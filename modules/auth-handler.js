'use strict';

/*
 * Issues and checks authenitcation tokens to users
 */

var users = require('./user-handler');

exports.requestAccessToken = function (id, key, callback) {
	// TODO compare key with our key and generate token
	// then set token to the given user id in database

	return callback({'accessToken':'Open Sesame'});
};

exports.isAuthenticated = function (accessToken) {
	// TODO lookup user in database using accessToken

	return true;
}

// TODO implement
exports.getOwner = function (accessToken){
	// returns user who owns the token
}