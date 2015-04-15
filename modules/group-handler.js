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
								users.getUser(userId, addUserIds[i], function (err,user){
									if(!err){
										if(flag == 1){
											// TODO shouldn't be an error, but what if?
											users.addGroupsToUser(userId, user.id, [groupId], 0, function(){});
										}
									}
									else{
										// Remove user if it doesn't exist
										exports.removeUsersFromGroup(userId, groupId, [currUser], 0, function(){});
									}
								});
							}
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
								fileDelivery.getFile(userId, addFileIds[i], function (err, file){
									if(!err){
										if(flag == 1){
											// TODO shouldn't be an error, but what if?
											fileDelivery.addGroupsToFile(userId, file.id, [groupId], 0, function(){});
										}
									}
									else{
										// Remove user if it doesn't exist
										exports.removeFilesFromGroup(userId, groupId, [currFile], 0, function(){});
									}
								});
							}
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

exports.removeFilesFromGroup = function (userId, groupId, removeFileIds, flag, callback){
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
					for (var i = 0; i < removeFileIds.length; i++) {
						if(flag == 1){
							// TODO shouldn't be an error, but what if?
							fileDelivery.removeGroupsFromFile(userId, removeFileIds[i], [groupId], 0, function(){});
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
		else{
			return callback({'err': 'Admin priviledges required for "DELETE /filesFromGroup/:id" call'});
		}
	});
}