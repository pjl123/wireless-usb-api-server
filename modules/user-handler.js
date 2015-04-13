'use strict';

/*
 * Maintains user database
 */

var userSchema = require('../schemas/user-schema');
var User = userSchema.User;

var groups = require('./group-handler');

exports.isAdmin = function (userId, callback) {
	User.findOne({ '_id': userId }, 'isAdmin', function (err, user){
		if(err || user === null){
			return callback(false);
		}
		return callback(user.isAdmin);
	});
};

exports.getUserByAccessToken = function (accessToken, callback){
	User.findOne({ 'accessToken': accessToken }, 'id', function (err, user){
		if(err || user === null){
			return callback(true, null);
		}
		return callback(false, user.id);
	});
};

exports.createUser = function (userId, userObj, callback) {
	exports.isAdmin(userId, function (result){
		if(result){
			console.log(userObj);
			var user = new User();
			if(userObj.name !== undefined){
				user.name = userObj.name;
			}
			if(userObj.isAdmin !== undefined){
				user.isAdmin = userObj.isAdmin;
			}
			if(userObj.canUpload !== undefined){
				user.canUpload = userObj.canUpload;
			}
			if(userObj.canDownload !== undefined){
				user.canDownload = userObj.canDownload;
			}

			user.save(function (err, newUser){
				if(err){
					return callback({'err': err});
				}
				else{
					return callback(newUser);
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "POST /users" call'});
		}
	});
};

// Gets user for the given id
exports.getUser = function (userId, getId, callback) {
	exports.isAdmin(userId, function (result){
		if(result || userId === getId){
			User.findOne({ '_id': getId }, function (err, user){
				if(err){
					return callback(true, {'err': err});
				}
				else if(user === null){
					return callback(true, {'err': 'No user with given id: ' + getId});
				}
				else{
					return callback(err, user);
				}
			});
		}
		else{
			return callback(true, {'err': 'Admin priviledges required for "GET /users/:id" call'});
		}
	});
};

exports.getAllUsers = function (userId, callback){
	exports.isAdmin(userId, function (result){
		if(result){
			User.find({}, function (err, users){
				return callback(err, users);
			});
		}
		else{
			return callback(true, {'err': 'Admin priviledges required for "GET /users" call'});
		}
	});
};

exports.deleteUser = function (userId, deleteId, callback){
	exports.isAdmin(userId, function (result){
		if(result){
			User.remove({ '_id': deleteId }, function (err){
				if(err){
					return callback({'err': err});
				}
				else{
					return callback({'success': 'User with id "' + deleteId + '" has been deleted.'});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "DELETE /users/:id" call'});
		}
	});
};

exports.updateUser = function (userId, updateId, userObj, callback) {
	exports.getUser(userId, updateId, function (err, user){
		if(err){
			if(user !== null){
				return callback(user);
			}
			else{
				return callback({'err': err});
			}
		}
		else{
			// Update the changeable user fields if they are set in the userObj
			if(userObj.name !== undefined){
				user.name = userObj.name;
			}

			// Only fields an admin can change
			if(user.isAdmin || userId !== updateId){
				if(userObj.isAdmin !== undefined){
					user.isAdmin = userObj.isAdmin;
				}
				if(userObj.canUpload !== undefined){
					user.canUpload = userObj.canUpload;
				}
				if(userObj.canDownload !== undefined){
					user.canDownload = userObj.canDownload;
				}
			}

			user.save(function (err, updatedUser){
				if(err){
					return callback({'err': err});
				}
				else{
					if(user.isAdmin || userId !== updateId){
						try{
							// Add or remove groups
							if(userObj.addGroupIds !== undefined){
								exports.addGroupsToUser(userId, updateId, userObj.addGroupIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
							}

							if(userObj.removeGroupIds !== undefined){
								exports.removeGroupsFromUser(userId, updateId, userObj.removeGroupIds, 1, function (data) {if(data.err !== undefined) throw data.err;});
							}
						}
						catch(err){
							return callback(err);
						}
					}
					return callback({'success':'Update was successful.'});
				}
			});
		}
	});
};

exports.getUsersByGroup = function (userId, groupId, callback){
	exports.isAdmin(userId, function (result){
		if(result){
			User.find({ 'groups' : { $in : [groupId] } }, function(err, users){
				if(err){
					return callback({'err':err});
				}
				else{
					return callback({'users':users});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "GET /usersByGroup/:id" call'});
		}
	});
}

exports.addGroupsToUser = function (userId, targetId, groupIds, flag, callback){
	exports.isAdmin(userId, function (result){
		if(result){
			User.findOne({ '_id' : targetId }, function(err, user){
				if(err){
					return callback({'err':err});
				}
				else if(user === null){
					return callback({'err':'User does not exist.'});
				}
				else{
					// Add all groups and remove bad ids after save
					for (var i = 0; i < groupIds.length; i++) {
						try{
							user.groups.addToSet(groupIds[i]);
						}
						catch(err){
							// Should only catch ids being added that are not the right Mongo format
							console.log("Error adding id: " + groupIds[i]);
							groupIds.splice(i,1);
						}
					};
					user.save(function (err, updatedUser){
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
											groups.addUsersToGroup(userId, group.id, [targetId], 0, function(){});
										}
									}
									else{
										// Remove user if it doesn't exist
										exports.removeGroupsFromUser(userId, targetId, [currGroup], 0, function(){});
									}
								});
							}
							return callback(updatedUser);
						}
					});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "POST /groupsToUser/:id" call'});
		}
	});
}

// TODO implement
exports.removeGroupsFromUser = function (userId, targetId, groupIds, flag, callback){
	exports.isAdmin(userId, function (result){
		if(result){
			User.findOne({ '_id' : targetId }, function(err, user){
				if(err){
					return callback({'err':err});
				}
				else if(user === null){
					return callback({'err':'User does not exist.'});
				}
				else{
					for (var i = 0; i < groupIds.length; i++) {
						if(flag == 1){
							// TODO shouldn't be an error, but what if?
							groups.removeUsersFromGroup(userId, groupIds[i], [targetId], 0, function(){});
						}

						try{
							user.groups.remove(groupIds[i]);
						}
						catch(err){
							return callback({'err':err});
						}
					}

					user.save(function (err, updatedUser){
						if(err){
							return callback({'err':err});
						}
						else{
							return callback(updatedUser);
						}
					});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "DELETE /groupsFromUser/:id" call'});
		}
	});
}