'use strict';

/*
 * Coordinates between users and usb to deliver only files
 * that user has access to.
 */

var usb = require('./usb-handler');
var users = require('./user-handler');

exports.getFileListing = function(request, callback){
	var relPath = request.query.path;
	// TODO verify this user has access to the given path

	usb.getFileListing(relPath, function(fileData){
		return callback(fileData);
	});
};

// TODO implement
exports.getSingleFile = function (argument){
	// body...
};

// TODO implement
exports.getManyFiles = function (argument) {
	// body...
};

// TODO implement
exports.createFileStream = function (argument) {
	// body...
};

// TODO implement
exports.uploadFile = function (argument) {
	// body...
};