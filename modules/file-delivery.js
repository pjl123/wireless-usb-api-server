'use strict';

/*
 * Coordinates between users and usb to deliver only files
 * that user has access to.
 */

var fileSchema = require('../schemas/file-schema');
var File = fileSchema.File;

var usb = require('./usb-handler');
var users = require('./user-handler');
var groups = require('./group-handler');

exports.getFileListing = function (fileId, userId, callback){
	users.isAdmin(userId, function (result){
		if(result){
			exports.getFile(userId, fileId, function (err, file){
				// If file does not exist, do the listing for the base directory
				var relPath = '';
				var parentDirectory = null;
				if(!err){
					relPath = file.filepath;
					// never store the usbDrive1 or usbDrive2 directories as parentDirectory references
					if(file.filepath.indexOf('usbDrive1') < 0 && file.filepath.indexOf('usbDrive2') < 0)
						parentDirectory = file._id;
				}
				usb.getFileListing(relPath, function (fileData){
					var filesToReturn = { 'files':[] };
					var numFiles = fileData.files.length;
					if(numFiles <= 0){
						return callback(filesToReturn);
					}
					for (var i = 0; i < fileData.files.length; i++) {
						fileData.files[i].parentDirectory = parentDirectory;
						createFile(fileData.files[i], function (newFile, filepath){
							// Return file if it was newly created
							if(newFile !== null){
								filesToReturn.files.push(newFile);
								numFiles --;
								if(numFiles <= 0){
									return callback(filesToReturn);
								}
							}
							// Retrieve the file from the database since it already exists
							else{
								File.findOne({ 'filepath' : filepath }, function (err, file){
									if(!err){
										updateFile(file, function (updatedFile){
											if(updatedFile.err === undefined){
												filesToReturn.files.push(updatedFile);
											}
											numFiles --;
											if(numFiles <= 0)
												return callback(filesToReturn);
										});
									}
									else{
										numFiles --;
										if(numFiles <= 0){
											return callback(filesToReturn);
										}
									}
								});
							}
						});
					}
				});
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "GET /fileListing" call'});
		}
	});
};

exports.getFile = function (userId, fileId, callback) {
	users.isAdmin(userId, function (result){
		if(result){
			exports.getFileNoAdmin(fileId, function (file){
				return callback(file);
			});
		}
		else{
			return callback(true, {'err': 'Admin priviledges required for "GET /files/:id" call'});
		}
	});
};

exports.getFileNoAdmin = function (fileId, callback){
	File.findOne({'_id' : fileId}, function (err, file){
		if(err){
			return callback(true, {'err': err});
		}
		else if(file === null){
			return callback(true, {'err': 'No file with given id: ' + fileId});
		}
		else{
			return callback(err, file);
		}
	});
}

exports.getAllFiles = function (userId, callback){
		users.isAdmin(userId, function (result){
		if(result){
			File.find({}, function (err, files){
				return callback(err, {'files':files});
			});
		}
		else{
			return callback(true, {'err': 'Admin priviledges required for "GET /files" call'});
		}
	});
}

exports.updateFile = function (userId, fileId, fileObj, callback){
	exports.getFile(userId, fileId, function (err, file){
		if(err){
			if(file !== null){
				return callback(file);
			}
			else{
				return callback({'err': err});
			}
		}
		else{
			updateFile(file, function (updatedFile){
				if(updatedFile.err){
					return callback({'err': err});
				}
				else{
					try{
						// Add or remove groups
						if(fileObj.addGroupIds !== undefined){
							exports.addGroupsToFile(userId, fileId, fileObj.addGroupIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
						}

						if(fileObj.removeGroupIds !== undefined){
							exports.removeGroupsFromFile(userId, fileId, fileObj.removeGroupIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
						}
					}
					catch(err){
						return callback(err);
					}
					return callback({'success':'Update was successful.'});
				}
			});
		}
	});
};

exports.getFilesByGroup = function (userId, groupId, callback){
	users.isAdmin(userId, function (result){
		groups.isUserInGroup(userId, groupId, function (inGroup){
			// Get files if the user is an admin or if they are in the group
			if(!result && !inGroup){
				return callback({'err': 'User does not have permissions required for "GET /filesByGroup/:id" call'});
			}
			else{
				File.find({ 'groups' : { $in : [groupId] } }, function (err, files){
					if(err){
						return callback({'err':err});
					}
					else{
						var numFiles = files.length;
						var filesToReturn = {'files':[]};
						for (var i = 0; i < files.length; i++) {
							updateFile(files[i], function (updatedFile){
								if(updatedFile.err === undefined){
									filesToReturn.files.push(updatedFile);
								}
								numFiles --;
								if(numFiles <= 0)
									return callback(filesToReturn);
							});
						}
						if(numFiles <= 0)
							return callback(filesToReturn);
					}
				});
			}
		})
	});
}

exports.addGroupsToFile = function (userId, fileId, groupIds, flag, callback){
	users.isAdmin(userId, function (result){
		if(result){
			exports.addGroupsToFileNoAdmin(fileId, groupIds, flag, function (file){
				return callback(file);
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "POST /groupsToFile/:id" call'});
		}
	});
}

exports.removeGroupsFromFile  = function (userId, fileId, removeGroupIds, flag, callback){
	users.isAdmin(userId, function (result){
		if(result){
			exports.removeGroupsFromFileNoAdmin(fileId, removeGroupIds, flag, function (file){
				return callback(file);
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "DELETE /groupsFromFile/:id" call'});
		}
	});
}

exports.addGroupsToFileNoAdmin = function (fileId, groupIds, flag, callback){
	File.findOne({ '_id' : fileId }, function(err, file){
		if(err){
			return callback({'err':err});
		}
		else if(file === null){
			return callback({'err':'File does not exist.'});
		}
		else{
			// Add all groups and remove bad ids after save
			for (var i = 0; i < groupIds.length; i++) {
				try{
					file.groups.addToSet(groupIds[i]);
				}
				catch(err){
					// Should only catch ids being added that are not the right Mongo format
					console.log("Error adding id: " + groupIds[i]);
					groupIds.splice(i,1);
				}
			};
			file.save(function (err, updatedFile){
				if(err){
					return callback({'err':err});
				}
				else{
					for (var i = 0; i < groupIds.length; i++) {
						var currGroup = groupIds[i]
						groups.getGroupNoAdmin(groupIds[i], function (err,group){
							if(!err){
								if(flag == 1){
									// TODO shouldn't be an error, but what if?
									groups.addFilesToGroupNoAdmin(group._id, [fileId], 0, function(){});
								}
								// Make sure to add all the parent directories so that the file is accesible from the user interfaces.
								if(file.parentDirectory !== null){
									exports.addGroupsToFileNoAdmin(file.parentDirectory, groupIds, 1, function(){});
								}
							}
							else{
								// Remove file if it doesn't exist
								exports.removeGroupsFromFileNoAdmin(fileId, [currGroup], 0, function(){});
							}
						});
					}
					return callback(updatedFile);
				}
			});
		}
	});
}

exports.removeGroupsFromFileNoAdmin = function (fileId, removeGroupIds, flag, callback){
	File.findOne({'_id' : fileId}, function(err, file){
		if(err){
			return callback({'err':err});
		}
		else{
			for (var i = 0; i < removeGroupIds.length; i++) {
				if(flag == 1){
					// TODO shouldn't be an error, but what if?
					groups.removeFilesFromGroupNoAdmin(removeGroupIds[i], [fileId], 0, function(){});
				}
				try{
					file.groups.remove(removeGroupIds[i]);
				}
				catch(err){
					return callback({'err':err});
				}
			}

			file.save(function (err, updatedFile){
				if(err){
					return callback({'err':err});
				}
				else{
					return callback(updatedFile);
				}
			});
		}
	});
}

exports.downloadFile = function (userId, groupId, fileId, callback){
	groups.canDownload(userId, groupId, function (canDownload){
		if(canDownload){
			File.findOne({'_id' : fileId}, function (err, file){
				if(!err){
					if(file.isDirectory){
						return callback({'err': 'Cannot download a directory.'});
					}
					usb.downloadFile(file.filepath, function (data){
						return callback(data);
					});
				}
				else{
					return callback({'err' : 'File does not exist.'});
				}
			})
		}
		else{
			return callback({'err' : 'User does not have download permissions for requested file.'});
		}
	});
};

exports.uploadFile = function (userId, groupId, parentId, filename, contents, callback) {
	groups.canUpload(userId, groupId, function (canUpload){
		if(canUpload){
			File.findOne({'_id':parentId}, function (err, parent){
				console.log(parentId);
				if(!err || parentId === 'null'){
					var filepath = '';
					if(parentId === 'null'){
						filepath = filename;
					}
					else{
						filepath = parent.filepath + '/' + filename;
					}
					// TODO how to do the file size?
					var file = {
						'filepath': filepath,
						'isDirectory': false,
						'size': 0
					};
					file.parentDirectory = parentId === 'null' ? null : parentId;
					createFile(file, function (newFile){
						if(newFile !== null){
							usb.uploadFile(newFile.filepath, contents, function (result){
								if(result.err === undefined){
									// add the file to the given group
									exports.addGroupsToFileNoAdmin(newFile._id, [groupId], 1, function (file){
										return callback(file);
									});
								}
								else{
									// TODO hopefully this doesn't cause an error
									deleteFile(newFile._id, function (result){});
									return callback(result);
								}
							});
						}
						else{
							return callback({'err':'Error creating file in database.'});
						}
					});
				}
				else{
					return callback({'err': 'Parent directory does not exist.'});
				}
			});
		}
		else{
			return callback({'err' : 'User does not have upload permissions for requested directory.'});
		}
	});
};

exports.setupWebStream = function (userId, groupId, fileId, callback){
	// If user and file are in the group, set up the stream
	groups.isUserInGroup(userId, groupId, function (inGroup){
		if(inGroup){
			File.findOne({'_id': fileId, 'groups' : { $in : [groupId] } }, function (err, file){
				if(!err && file !== null){
					usb.setupWebStream(file.filepath, function (data){
						return callback(data);
					});
				}
				else{
					return callback({ 'err' : 'File not available.'});
				}
			});
		}
		else{
			return callback({'err':'User does not have permissions for the requested file.'});
		}
	});
};

var updateFile = function (file, callback){
	var sevenDays = 604800000; // 7 days in milliseconds
	if(file.lastUpdated.getTime() + sevenDays > Date.now()){
		getFileStats(file, function (stats){
			// TODO remove file from database if error at any point?
			if(stats.err === undefined){
				file.size = stats.size;
				file.lastUpdated = Date.now();
				file.save(function (err, updatedFile){
					if(!err){
						return callback(updatedFile);
					}
					else{
						return callback({'err':err});
					}
				});
			}
			else{
				return callback(stats);
			}
		});
	}
}

var getFileStats = function (file, callback){
	usb.getFileStats(file.filepath, function (stats){
		return callback(stats);
	});
};

var createFile = function (file, callback){
	var newFile = new File();
	// TODO implement creating/storing/reading usb identifiers
	newFile.usbId = "test";
	newFile.filepath = file.filepath;
	newFile.isDirectory = file.isDirectory;
	newFile.size = file.size;
	newFile.lastUpdated = Date.now();
	newFile.parentDirectory = file.parentDirectory;
	newFile.save(function(err, createdFile){
		if(err){
			//console.log(err);
			return callback(null, file.filepath);
		}
		else{
			return callback(createdFile);
		}
	});
}

var deleteFile = function (fileId, callback){
	File.remove({'_id': fileId}, function (err){
		if(err){
			return callback({'err':err});
		}
		else{
			return callback({'success':'Successfully deleted file with id: ' + fileId});
		}
	});
};