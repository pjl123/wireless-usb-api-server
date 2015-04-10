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
			getFile({'_id' : fileId}, function (err, file){
				// If file does not exist, do the listing for the base directory
				var relPath;
				if(!err){
					relPath = file.filepath;
				}
				else{
					relPath = '';
				}
				usb.getFileListing(relPath, function (fileData){
					var filesToReturn = { 'files':[] };
					var numFiles = fileData.files.length;
					for (var i = 0; i < fileData.files.length; i++) {
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
								getFile({ 'filepath' : filepath }, function (err, file){
									if(!err){
										filesToReturn.files.push(file);
										numFiles --;
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

exports.addFilesToGroup = function (relPaths, userId, groupId, callback){
	users.isAdmin(userId, function (result){
		if(result){
			var files = [];
			var numPaths = relPaths.length;

			for (var i = 0; i < relPaths.length; i++) {
				var file = {};
				file.filepath = relPaths[i];

				exports.getFileStats(relPaths[i], function (stats){
					if(stats.err === undefined){
						file.isDirectory = stats.isDirectory();
						file.size = stats.size;
						file.lastUpdated = Date.now();
						files.push(file);
					}

					numPaths = numPaths - 1;
					if(numPaths <= 0){
						groups.addFilesToGroup(userId, groupId, files, function (result){
							return callback(result);
						});
					}
				});
			}
			if(numPaths <= 0){
				return callback({'err':'No paths given to add to the group'});
			}
		}
		else{
			return callback({'err': 'Admin priviledges required for "POST /filesToGroup" call'});
		}
	});
}

exports.addGroupsToFile = function (relPath, userId, groupIds, callback){
	users.isAdmin(userId, function (result){
		if(result){
			var numGroups = groupIds.length;
			var groupsAdded = [];

			for (var i = 0; i < groupIds.length; i++) {
				var file = {};
				file.filepath = relPath;

				exports.getFileStats(relPath, function (stats){
					if(stats.err === undefined){
						file.isDirectory = stats.isDirectory();
						file.size = stats.size;
						file.lastUpdated = Date.now();

						groups.addFilesToGroup(userId, groupIds[i], [file], function (result){
							numGroups = numGroups - 1;
								if(result.err === undefined){
									groupsAdded.push(result.id);
								}
								if(numGroups <= 0){
									return callback({'success':'Added file to groups: ' + groupsAdded});
								}
						});
					}
					else{
						return callback(stats);
					}
				});
			};
			if(numGroups <= 0){
				return callback({'err':'No groups given to add to the file'});
			}
		}
		else{
			return callback({'err': 'Admin priviledges required for "POST /groupsToFile" call'});
		}
	});
}

exports.getFileStats = function (relPath, callback){
	usb.getFileStats(relPath, function (stats){
		return callback(stats);
	});
};

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

exports.setupWebStream = function (relPath, callback){
	// TODO verify user has access to the file

	usb.setupWebStream(relPath, function (data){
		return callback(data);
	});
};

// TODO implement
exports.createFileStream = function (argument) {
	// body...
};

// TODO implement
exports.uploadFile = function (argument) {
	// body...
};

var createFile = function (file, callback){
	var newFile = new File();
	// TODO implement creating/storing/reading usb identifiers
	newFile.usbId = "test";
	newFile.filepath = file.filepath;
	newFile.isDirectory = file.isDirectory;
	newFile.size = file.size;
	newFile.lastUpdated = Date.now();
	newFile.save(function(err, createdFile){
		if(err){
			console.log(err);
			return callback(null, file.filepath);
		}
		else{
			return callback(createdFile);
		}
	});
}

var getFile = function (query, callback){
	File.findOne(query, function (err, file){
		return callback(err, file);
	});
}