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
						parentDirectory = file.id;
				}
				usb.getFileListing(relPath, function (fileData){
					var filesToReturn = { 'files':[] };
					var numFiles = fileData.files.length;
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
										// run file stats if not updated recently
										var sevenDays = 604800000; // 7 days in milliseconds
										if(file.lastUpdated.getTime() + sevenDays > Date.now()){
											updateFile(file, function (updatedFile){
												file = updatedFile;
												numFiles --;
											});
										}
									}
									if(numFiles <= 0){
										return callback(filesToReturn);
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
		else{
			return callback(true, {'err': 'Admin priviledges required for "GET /files/:id" call'});
		}
	});
};

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
							})
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
								groups.getGroup(userId, groupIds[i], function (err,group){
									if(!err){
										if(flag == 1){
											// TODO shouldn't be an error, but what if?
											groups.addFilesToGroup(userId, group.id, [fileId], 0, function(){});
										}
									}
									else{
										// Remove file if it doesn't exist
										exports.removeGroupsFromFile(userId, fileId, [currGroup], 0, function(){});
									}
								});
							}
							return callback(updatedFile);
						}
					});
				}
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
			exports.getFile(userId, fileId, function(err, file){
				if(err){
					return callback({'err':err});
				}
				else{
					for (var i = 0; i < removeGroupIds.length; i++) {
						if(flag == 1){
							// TODO shouldn't be an error, but what if?
							groups.removeFilesFromGroup(userId, removeGroupIds[i], [fileId], 0, function(){});
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
		else{
			return callback({'err': 'Admin priviledges required for "DELETE /groupsFromFile/:id" call'});
		}
	});
}

exports.getSingleFile = function (relPath, callback){
	// TODO verify this user has access to file

	usb.getSingleFile(relPath, function (data){
		return callback(data);
	});
};

// TODO implement
exports.getManyFiles = function (argument) {
	// body...
};

exports.setupWebStream = function (userId, fileId, callback){
	// TODO verify user has access to the file

	exports.getFile(userId, fileId, function (err, file){
		if(!err){
			usb.setupWebStream(file.filepath, function (data){
				return callback(data);
			});
		}
		else{
			return callback({ 'err' : err});
		}
	})
};

// TODO implement
exports.createFileStream = function (argument) {
	// body...
};

// TODO implement
exports.uploadFile = function (argument) {
	// body...
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