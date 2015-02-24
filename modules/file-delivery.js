'use strict';

/*
 * Coordinates between users and usb to deliver only files
 * that user has access to.
 */

var File = require('../schemas/file-schema').File;

var usb = require('./usb-handler');
var users = require('./user-handler');
var groups = require('./group-handler');

exports.getFileListing = function (relPath, userId, callback){
	users.isAdmin(userId, function (result){
		if(result){
			usb.getFileListing(relPath, function (data){
				return callback(data);
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
			};
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