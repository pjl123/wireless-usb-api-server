'use strict';

/*
 * Maintains group database
 */

var userSchema = require('../schemas/user-schema');
var groupSchema = require('../schemas/group-schema');
var User = userSchema.User;
var Group = groupSchema.Group;

var users = require('./user-handler.js');
var fileDelivery = require('./file-delivery.js');

// Create group
exports.createGroup = function (userId, groupObj, callback) {
	users.isAdmin(userId, function (result){
		if(result){
			var group = new Group();
			if(groupObj.name !== undefined){
				group.name = groupObj.name;
			}
			if(groupObj.canUpload !== undefined){
				group.canUpload = groupObj.canUpload;
			}
			if(groupObj.canDownload !== undefined){
				group.canDownload = groupObj.canDownload;
			}

			group.save(function (err, newGroup){
				if(err){
					return callback({'err': err});
				}
				else{
					return callback(newGroup);
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "POST /groups" call'});
		}
	});
};

// Get a single user with the given id
exports.getGroup = function (userId, groupId, callback) {
	users.isAdmin(userId, function (result){
		if(result){
			Group.findOne({ '_id': groupId }, function (err, group){
				if(err){
					return callback(true, {'err': err});
				}
				else if(group === null){
					return callback(true, {'err': 'No group with given id: ' + groupId});
				}
				else{
					return callback(err, group);
				}
			});
		}
		else{
			return callback(true, {'err': 'Admin priviledges required for "GET /groups/:id" call'});
		}
	});
};

// Get all groups in db
exports.getAllGroups = function (userId, callback) {
	users.isAdmin(userId, function (result){
		if(result){
			Group.find({}, function (err, groups){
				return callback(err, groups);
			});
		}
		else{
			return callback(true, {'err': 'Admin priviledges required for "GET /groups" call'});
		}
	});
};

// Deletes the group with the given id
exports.deleteGroup = function (userId, groupId, callback) {
	users.isAdmin(userId, function (result){
		if(result){
			Group.remove({ '_id': groupId }, function (err){
				if(err){
					return callback({'err': err});
				}
				else{
					return callback({'success': 'group with id "' + groupId + '" has been deleted.'});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "DELETE /groups/:id" call'});
		}
	});
};

exports.updateGroup = function (userId, groupId, groupObj, callback) {
	exports.getGroup(userId, groupId, function (err, group){
		if(err){
			if(group !== null){
				return callback(group);
			}
			else{
				return callback({'err': err});
			}
		}
		else{
			// Update the changeable group fields if they are set in the groupObj
			if(groupObj.name !== undefined){
				group.name = groupObj.name;
			}

			if(groupObj.canUpload !== undefined){
				group.canUpload = groupObj.canUpload;
			}

			if(groupObj.canDownload !== undefined){
				group.canDownload = groupObj.canDownload;
			}

			group.save(function (err, updatedUser){
				if(err){
					return callback({'err': err});
				}
				else{
					try{
						// Add or remove users
						if(groupObj.addUserIds !== undefined){
							exports.addUsersToGroup(userId, groupId, groupObj.addUserIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
						}

						if(groupObj.removeUserIds !== undefined){
							exports.removeUsersFromGroup(userId, groupId, groupObj.removeUserIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
						}

						// Remove files
						if(groupObj.removeFileIds !== undefined){
							exports.removeFilesFromGroup(userId, groupId, groupObj.removeFileIds, function (data) {if(data.err !== undefined) throw data.err;});
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

exports.getUsersByGroup = function (userId, groupId, callback){
	users.isAdmin(userId, function (result){
		if(result){
			Group.findOne({ '_id' : groupId }, function(err, group){
				if(err){
					return callback({'err':err});
				}
				else if(group === null){
					return callback({'err':'Group does not exist.'});
				}
				else{
					var data = {'users':[]};
					var numCalls = group.users.length;
					for (var i = 0; i < group.users.length; i++) {
						users.getUser(userId, group.users[i], function (err, user){
							if(err === null){
								data.users.push(user);
							}
							// TODO if there is an error what do I do?

							numCalls = numCalls - 1;
							if(numCalls <= 0){
								return callback(data);
							}
						});
					}
					if(numCalls == 0){
						return callback(data);
					}
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "GET /usersByGroup/:id" call'});
		}
	});
}

exports.addUsersToGroup = function (userId, groupId, addUserIds, flag, callback){
	users.isAdmin(userId, function (result){
		if(result){
			Group.findOne({ '_id' : groupId }, function(err, group){
				if(err){
					return callback({'err':err});
				}
				else if(group === null){
					return callback({'err':'Group does not exist.'});
				}
				else{
					for (var i = 0; i < addUserIds.length; i++) {
						if(flag == 1){
							// TODO shouldn't be an error, but what if?
							users.addGroupsToUser(userId, addUserIds[i], [groupId], 0, function(){});
						}
						try{
							users.getUser(userId, addUserIds[i], function (result){
								// Add user if record exists alread.
								if(result.err === undefined)
									group.users.addToSet(addUserIds[i]);
							});
						}
						catch(err){
							return callback({'err':err});
						}
					}

					group.save(function (err, updatedGroup){
						if(err){
							return callback({'err':err});
						}
						else{
							return callback(updatedGroup);
						}
					});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "POST /usersToGroup/:id" call'});
		}
	});
}

exports.removeUsersFromGroup = function (userId, groupId, removeUserIds, flag, callback){
	users.isAdmin(userId, function (result){
		if(result){
			Group.findOne({ '_id' : groupId }, function(err, group){
				if(err){
					return callback({'err':err});
				}
				else if(group === null){
					return callback({'err':'Group does not exist.'});
				}
				else{
					for (var i = 0; i < removeUserIds.length; i++) {
						if(flag == 1){
							// TODO shouldn't be an error, but what if?
							users.removeGroupsFromUser(userId, removeUserIds[i], [groupId], 0, function(){});
						}
						try{
							group.users.remove(removeUserIds[i]);
						}
						catch(err){
							return callback({'err':err});
						}
					}

					group.save(function (err, updatedGroup){
						if(err){
							return callback({'err':err});
						}
						else{
							return callback(updatedGroup);
						}
					});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "DELETE /usersFromGroup/:id" call'});
		}
	});
}

// TODO also return files if userId is in the group
exports.getFilesByGroup = function (userId, groupId, callback){
	users.isAdmin(userId, function (result){
		if(result){
			Group.findOne({ '_id' : groupId }, 'files', function(err, group){
				if(err){
					return callback({'err':err});
				}
				else if(group === null){
					return callback({'err':'Group does not exist.'});
				}
				else{
					// run stats on files if they were updated too long ago
					var sevenDays = 604800000; // 7 days in milliseconds
					for (var i = 0; i < group.files.length; i++) {
						if(group.files[i].lastUpdated.getTime() + sevenDays > Date.now()){
							fileDelivery.getFileStats(group.files[i].filepath, function (stats){
								if(stats.err === undefined){
									group.files[i].size = stats.size;
									group.files[i].lastUpdated = Date.now();
								}
								else{
									// TODO remove file from group if there's an error?
								}
							});
						}
					};
					return callback(group);
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "GET /filesByGroup/:id" call'});
		}
	});
}

exports.addFilesToGroup = function (userId, groupId, addFiles, callback){
	users.isAdmin(userId, function (result){
		if(result){
			Group.findOne({ '_id' : groupId }, function (err, group){
				if(err){
					return callback({'err':err});
				}
				else if(group === null){
					return callback({'err':'Group does not exist.'});
				}
				else{
					for (var i = 0; i < addFiles.length; i++) {
						try{
							var exists = false;
							for (var i = 0; i < group.files.length; i++) {
								if(group.files[i].filepath === addFiles[i].filepath)
									exists = true;
							};
							// Add file if it doesn't already exist in the record
							if(!exists)
								group.files.push(addFiles[i]);
						}
						catch(err){
							return callback({'err':err});
						}
					}

					group.save(function (err, updatedGroup){
						if(err){
							return callback({'err':err});
						}
						else{
							return callback(updatedGroup);
						}
					});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "POST /filesToGroup/:id" call'});
		}
	});
}

exports.removeFilesFromGroup = function (userId, groupId, removeFileIds, callback){
	users.isAdmin(userId, function (result){
		if(result){
			Group.findOne({ '_id' : groupId }, function (err, group){
				if(err){
					return callback({'err':err});
				}
				else if(group === null){
					return callback({'err':'Group does not exist.'});
				}
				else{
					for (var i = 0; i < removeFileIds.length; i++) {
						try{
							group.files.id(removeFileIds[i]).remove();
						}
						catch(err){
							return callback({'err':err});
						}
					}

					group.save(function (err, updatedGroup){
						if(err){
							return callback({'err':err});
						}
						else{
							return callback(updatedGroup);
						}
					});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "DELETE /filesFromGroup/:id" call'});
		}
	});
}