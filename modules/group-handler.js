'use strict';

/*
 * Maintains group database
 */

var groupSchema = require('../schemas/group-schema');
var userSchema = require('../schemas/user-schema');
var Group = groupSchema.Group;
var User = userSchema.User;

var users = require('./user-handler.js');
var fileDelivery = require('./file-delivery.js');

exports.canDownload = function (userId, groupId, callback){
	Group.findOne({'_id': groupId}, function (err, group){
		if(!err && group !== null){
			User.findOne({'_id': userId}, function (err, user){
				if(!err && user !== null){
					return callback(group.canDownload && user.canDownload);
				}
				else{
					return callback(false);
				}
			});
		}
		else{
			return callback(false);
		}
	});
};

exports.canUpload = function (userId, groupId, callback){
	Group.findOne({'_id': groupId}, function (err, group){
		if(!err && group !== null){
			User.findOne({'_id': userId}, function (err, user){
				if(!err && user !== null){
					return callback(group.canUpload && user.canUpload);
				}
				else{
					return callback(false);
				}
			});
		}
		else{
			return callback(false);
		}
	});
};

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
					try{
						// Add or remove users
						if(groupObj.addUserIds !== undefined){
							exports.addUsersToGroup(userId, newGroup._id, groupObj.addUserIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
						}

						if(groupObj.removeUserIds !== undefined){
							exports.removeUsersFromGroup(userId, newGroup._id, groupObj.removeUserIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
						}
						// Add or remove files
						if(groupObj.addFileIds !== undefined){
							exports.addFilesToGroup(userId, newGroup._id, groupObj.addFileIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
						}

						if(groupObj.removeFileIds !== undefined){
							exports.removeFilesFromGroup(userId, newGroup._id, groupObj.removeFileIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
						}
					}
					catch(err){
						return callback({'err':err});
					}
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
	users.isAdmin(userId, function (isAdmin){
		exports.isUserInGroup(userId, groupId, function (inGroup){
			if(isAdmin || inGroup){
				exports.getGroupNoAdmin(groupId, function (err, group){
					return callback(err, group);
				});
			}
			else{
				return callback(true, {'err': 'Admin priviledges required for "GET /groups/:id" call'});
			}
		});
	});
};

// Get all groups in db
exports.getAllGroups = function (userId, callback) {
	users.isAdmin(userId, function (result){
		if(result){
			Group.find({}, function (err, groups){
				return callback(err, {'groups':groups});
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

			group.save(function (err, updatedGroup){
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
						// Add or remove files
						if(groupObj.addFileIds !== undefined){
							exports.addFilesToGroup(userId, groupId, groupObj.addFileIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
						}

						if(groupObj.removeFileIds !== undefined){
							exports.removeFilesFromGroup(userId, groupId, groupObj.removeFileIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
						}
					}
					catch(err){
						console.log(err);
						return callback({'err':err});
					}
					return callback({'success':'Update was successful.'});
				}
			});
		}
	});
};

exports.isUserInGroup = function (userId, groupId, callback){
	Group.findOne({'_id' : groupId}, function (err, group){
		if(err || group === null){
			return callback(false);
		}
		else{
			return callback(group.users.indexOf(userId) >= 0);
		}
	})
}

exports.getGroupsByUser = function (userId, targetId, callback){
	users.isAdmin(userId, function (result){
		// Get groups if user is an admin or if the user is asking for their own groups
		if(result || userId === targetId){
			Group.find({ 'users' : { $in : [targetId] } }, function(err, groups){
				if(err){
					return callback({'err':err});
				}
				else{
					return callback({'groups':groups});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "GET /groupsByUser/:id" call'});
		}
	});
}

exports.addUsersToGroup = function (userId, groupId, addUserIds, flag, callback){
	users.isAdmin(userId, function (result){
		if(result){
			console.log('Adding user ids to group: ' + addUserIds);
			exports.addUsersToGroupNoAdmin(groupId, addUserIds, flag, function (group){
				return callback(group);
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
			exports.removeUsersFromGroupNoAdmin(groupId, removeUserIds, flag, function (group){
				return callback(group);
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "DELETE /usersFromGroup/:id" call'});
		}
	});
}

exports.getGroupsByFile = function (userId, fileId, callback){
	users.isAdmin(userId, function (result){
		if(result){
			Group.find({ 'files' : { $in : [fileId] } }, function(err, groups){
				if(err){
					return callback({'err':err});
				}
				else{
					return callback({'groups':groups});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "GET /groupsByFile/:id" call'});
		}
	});
}

exports.addFilesToGroup = function (userId, groupId, addFileIds, flag, callback){
	users.isAdmin(userId, function (result){
		if(result){
			exports.addFilesToGroupNoAdmin(groupId, addFileIds, flag, function (group){
				return callback(group);
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "POST /filesToGroup/:id" call'});
		}
	});
}

exports.removeFilesFromGroup = function (userId, groupId, removeFileIds, flag, callback){
	users.isAdmin(userId, function (result){
		if(result){
			exports.removeFilesFromGroupNoAdmin(groupId, removeFileIds, flag, function (group){
				return callback(group);
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "DELETE /filesFromGroup/:id" call'});
		}
	});
}

exports.getGroupNoAdmin = function (groupId, callback){
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

exports.addUsersToGroupNoAdmin = function (groupId, addUserIds, flag, callback){
	Group.findOne({ '_id' : groupId }, function(err, group){
		if(err){
			return callback({'err':err});
		}
		else if(group === null){
			return callback({'err':'Group does not exist.'});
		}
		else{
			// Add all users and remove bad ids after save
			for (var i = 0; i < addUserIds.length; i++) {
				try{
					group.users.addToSet(addUserIds[i]);
				}
				catch(err){
					// Should only catch ids being added that are not the right Mongo format
					console.log("Error adding id: " + addUserIds[i]);
					addUserIds.splice(i,1);
				}
			};
			group.save(function (err, updatedGroup){
				if(err){
					return callback({'err':err});
				}
				else{
					for (var i = 0; i < addUserIds.length; i++) {
						var currUser = addUserIds[i]
						users.getUserNoAdmin(addUserIds[i], function (err,user){
							if(!err){
								if(flag == 1){
									// TODO shouldn't be an error, but what if?
									users.addGroupsToUserNoAdmin(user._id, [groupId], 0, function(){});
								}
							}
							else{
								// Remove user if it doesn't exist
								exports.removeUsersFromGroupNoAdmin(groupId, [currUser], 0, function(){});
							}
						});
					}
					return callback(updatedGroup);
				}
			});
		}
	});
}

exports.removeUsersFromGroupNoAdmin = function (groupId, removeUserIds, flag, callback){
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
					users.removeGroupsFromUserNoAdmin(removeUserIds[i], [groupId], 0, function(){});
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

exports.addFilesToGroupNoAdmin = function (groupId, addFileIds, flag, callback){
	Group.findOne({ '_id' : groupId }, function(err, group){
		if(err){
			return callback({'err':err});
		}
		else if(group === null){
			return callback({'err':'Group does not exist.'});
		}
		else{
			// Add all files and remove bad ids after save
			for (var i = 0; i < addFileIds.length; i++) {
				try{
					group.files.addToSet(addFileIds[i]);
				}
				catch(err){
					// Should only catch ids being added that are not the right Mongo format
					console.log("Error adding id: " + addFileIds[i]);
					addFileIds.splice(i,1);
				}
			};
			group.save(function (err, updatedGroup){
				if(err){
					return callback({'err':err});
				}
				else{
					for (var i = 0; i < addFileIds.length; i++) {
						var currFile = addFileIds[i]
						fileDelivery.getFileNoAdmin(addFileIds[i], function (err, file){
							if(!err){
								if(flag == 1){
									// TODO shouldn't be an error, but what if?
									fileDelivery.addGroupsToFileNoAdmin(file._id, [groupId], 0, function(){});
								}
							}
							else{
								// Remove user if it doesn't exist
								exports.removeFilesFromGroupNoAdmin(groupId, [currFile], 0, function(){});
							}
						});
					}
					return callback(updatedGroup);
				}
			});
		}
	});
}

exports.removeFilesFromGroupNoAdmin = function (groupId, removeFileIds, flag, callback){
	Group.findOne({ '_id' : groupId }, function(err, group){
		if(err){
			return callback({'err':err});
		}
		else if(group === null){
			return callback({'err':'Group does not exist.'});
		}
		else{
			for (var i = 0; i < removeFileIds.length; i++) {
				if(flag == 1){
					// TODO shouldn't be an error, but what if?
					fileDelivery.removeGroupsFromFileNoAdmin(removeFileIds[i], [groupId], 0, function(){});
				}
				try{
					group.users.remove(removeFileIds[i]);
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