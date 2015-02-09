'use strict';

/*
 * Maintains user database
 */

var userSchema = require('../schemas/user-schema');
var groupSchema = require('../schemas/group-schema');
var User = userSchema.User;
var Group = groupSchema.Group;

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

exports.createNewUser = function (userId, userObj, callback) {
	exports.isAdmin(userId, function (result){
		if(result){
			console.log(userObj);
			var user = new User(userObj);
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

			// Only fields and admin can change
			if(userId !== updateId){
				if(userObj.isAdmin !== undefined){
					user.isAdmin = userObj.isAdmin;
				}
				if(userObj.canUpload !== undefined){
					user.canUpload = userObj.canUpload;
				}
				if(userObj.canDownload !== undefined){
					user.canDownload = userObj.canDownload;
				}
				if(userObj.groups !== undefined){
					user.groups = userObj.groups;
				}
			}

			user.save(function (err, updatedUser){
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

//TODO implement
exports.createGroup = function (argument) {
	// body...
};

//TODO implement
exports.getGroup = function (argument) {
	// body...
};

//TODO implement
exports.getAllGroups = function (argument) {
	// body...
};

//TODO implement
exports.deleteGroup = function (argument) {
	// body...
};

//TODO implement
exports.updateGroup = function (argument) {
	// body...
};

//TODO implement
exports.addUserToGroup = function (argument) {
	// body...
};