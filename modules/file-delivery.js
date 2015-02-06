'use strict';

/*
 * Coordinates between users and usb to deliver only files
 * that user has access to.
 */

var usb = require('./usb-handler');
var users = require('./user-handler');

exports.getFileListing = function(relPath, userId, callback){
	users.isAdmin(userId, function(result){
		if(result){
			usb.getFileListing(relPath, function(data){
				return callback(data);
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "GET /fileListing" call'});
		}
	});
};

exports.getFileListingByGroup = function(relPath, accessToken, callback){

}

exports.getSingleFile = function (relPath, callback){
	// TODO verify this user has access to file

	usb.getSingleFile(relPath, function(data){
		return callback(data);
	});
};

// TODO implement
exports.getManyFiles = function (argument) {
	// body...
};

exports.setupWebStream = function (relPath, callback){
	// TODO verify user has access to the file

	usb.setupWebStream(relPath, function(data){
		return callback(data);
	});
};

// TODO implement
exports.createFileStream = function (argument) {
	// body...
};

// TODO implement
exports.uploadFile = function (argument) {
	// body...
};