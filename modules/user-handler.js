'use strict';

/*
 * Maintains user database
 */

var userSchema = require('../schemas/user-schema');
var User = userSchema.User;

exports.isAdmin = function (userId, callback) {
	User.findOne({ '_id': userId }, 'isAdmin', function(err, user){
		if(err || user === null){
			return callback(false);
		}
		return callback(user.isAdmin);
	});
};

exports.getUserByAccessToken = function (accessToken, callback){
	User.findOne({ 'accessToken': accessToken }, 'id', function(err, user){
		if(err !== null || user === null){
			return callback(true, null);
		}
		return callback(false, user.id);
	});
};

exports.createNewUser = function (userId, userObj, callback) {
	isAdmin(userId, function(result){
		if(result){
			var user = new User(userObj);
			user.save()
		}
		else{
			return callback({'err': 'Admin priviledges required for "POST /users" call'});
		}
	});
};

//TODO implement
exports.getUser = function (argument) {
	// body...
};

// TODO implement
exports.deleteUser = function (argument){
	// body...
};

// TODO implement
exports.updateUser = function (id, data, callback) {
	// body...
};