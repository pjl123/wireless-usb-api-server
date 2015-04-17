'use strict';

/*
 * Issues and checks authenitcation tokens to users
 */

var users = require('./user-handler');

exports.isAuthorized = function (userId, callback) {
	// check if this user exists
	users.isAuthorized(userId, function(isAuthorized){
		return callback(isAuthorized);
	});
};