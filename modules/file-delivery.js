'use strict';

/*
 * Coordinates between users and usb to deliver only files
 * that user has access to.
 */

var usb = require('./usb-handler');
var users = require('./user-handler');

exports.getFileListing = function(relPath, callback){
	// TODO verify this user has access to the given path

	usb.getFileListing(relPath, function(data){
		return callback(data);
	});
};

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

// TODO implement
exports.createFileStream = function (argument) {
	// body...
};

// TODO implement
exports.uploadFile = function (argument) {
	// body...
};