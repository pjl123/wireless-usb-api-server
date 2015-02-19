'use strict';

/*
 * Maintains group database
 */

var userSchema = require('../schemas/user-schema');
var groupSchema = require('../schemas/group-schema');
var User = userSchema.User;
var Group = groupSchema.Group;

var users = require('./user-handler.js');

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

//TODO implement
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
					return callback(updatedUser);
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

// TODO implement
exports.getFilesByGroup = function (userId, groupId, callback){

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
						// TODO check for error here
						try{
							group.users.addToSet(addUserIds[i]);
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

// TODO implement
exports.addFilesToGroup = function (userId, addFileIds, groupId, callback){

}

// TODO implement
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
						// TODO check for error here
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