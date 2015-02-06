'use strict';

/*
 * Issues and checks authenitcation tokens to users
 */

var users = require('./user-handler');

exports.requestAccessToken = function (id, key, callback) {
	// TODO compare key with our key and generate token
	// then set token to the given user id in database

	return callback({'accessToken':'foo'});
};

exports.isAuthenticated = function (accessToken, callback) {
	// lookup user in database using accessToken
	users.getUserByAccessToken(accessToken, function(err, userId){
		if(err || userId === null){
			return callback(false, null);
		}
		else{
			return callback(true, userId);
		}
	})
}