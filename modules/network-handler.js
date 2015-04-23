'use strict';

var users = require('./user-handler.js');

exports.getCredentials = function (userId, callback){
	users.isAdmin(userId, function (result){
		if(result){
			var network = {
				'name': 'HydraTestNetwork',
				'password': 'HailHydra'
			};
			return callback(network);
		}
		else{
			return callback({'err':'Admin priviledges required for "GET /networkCredentials" call'});
		}
	});
};