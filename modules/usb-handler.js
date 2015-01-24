'use strict';

/*
	Performs all I/O operations on the USB drive
*/

// TODO update to the actual path on the Raspberry Pi
var usbPath = 'C:/Users/Patrick.pat-PC/Documents/School/Senior Design/sample_files';
var fs = require('fs');

exports.getFileListing = function(relPath, callback) {
	var filepath;
	if((relPath.trim()).length === 0){
		filepath = usbPath;
	}
	else{
		var filepath = usbPath + '/' + relPath;
	}

	fs.readdir(filepath,function(err,list){
    if(!err){
      var files = [];
      for (var i = 0; i < list.length; i++) {
        var fileData = {};
        fileData.filename = list[i];
        var stats = fs.statSync(filepath + '/' + list[i]);
        fileData.isDirectory = stats.isDirectory();
        fileData.size = stats.size;
        files.push(fileData);
      };
      return callback({'files':files});
    }
    else{
      return callback({'err':'problem with reading filepath: ' + filepath});
    }
  });
};


exports.getSingleFile = function (relPath, callback){
  if((relPath.trim()).length === 0){
    return callback({'err':'no filepath given'});
  }

  var filepath = usbPath + '/' + relPath;
  return callback(fs.createReadStream(filepath));
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