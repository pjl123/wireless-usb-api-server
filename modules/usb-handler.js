'use strict';

/*
	Performs all I/O operations on the USB drive
*/

// TODO update to the actual path on the Raspberry Pi
var usbPath = 'C:/Users/Patrick.pat-PC/Documents/School/Senior Design';
// TODO set path of Raspberry Pi for serving files
var serverPath = 'C:/Users/Patrick.pat-PC/Documents/School/Senior Design/wireless-usb-web-server/app/content';
var fs = require('fs');

exports.getFileListing = function (relPath, callback) {
	var fullpath;
	if((relPath.trim()).length === 0){
		fullpath = usbPath;
	}
	else{
		var fullpath = usbPath + '/' + relPath;
	}
  
	fs.readdir(fullpath,function (err,list){
    if(!err){
      var files = [];
      for (var i = 0; i < list.length; i++) {
        var fileData = {};
        fileData.filepath = relPath + '/' + list[i];
        try{
          var stats = fs.statSync(fullpath + '/' + list[i]);
          fileData.isDirectory = stats.isDirectory();
          fileData.size = stats.size;
          files.push(fileData);
        }
        catch(e){
          console.log('Error reading file stats for ' + fileData.filepath + ': ' + e);
        }
      };
      return callback({'files':files});
    }
    else{
      return callback({'err':'problem with reading filepath: ' + fullpath});
    }
  });
};

exports.getFileStats = function (relPath, callback){
  fs.stat(usbPath + '/' + relPath, function (err, stats){
    if(stats === undefined){
      return callback({'err':'File does not exist'});
    }
    else if(err !== undefined){
      return callback(stats);
    }
    else{
      return callback({'err':err});
    }
  });
}

exports.downloadFile = function (relPath, callback){
  if((relPath.trim()).length === 0){
    return callback({'err':'no filepath given'});
  }

  var filepath = usbPath + '/' + relPath;
  return callback(fs.createReadStream(filepath));
};

exports.uploadFile = function (relPath, contents, callback){
  if((relPath.trim()).length === 0){
    return callback({'err':'no filepath given'});
  }

  var filepath = usbPath + '/' + relPath;
  fs.writeFile(filepath, contents, function (err){
    if(err){
      return callback({'err':err});
    }
    else{
      return callback(relPath);
    }
  });
};

exports.setupWebStream = function (relPath, newName, callback){
  if((relPath.trim()).length === 0){
    return callback({'err':'no filepath given'});
  }

  var filepath = usbPath + '/' + relPath;
  var temp = relPath.split('/');
  var fileType = temp[temp.length - 1].split('.')[1];
  var filename = newName + '.' + fileType;
  var webpath = serverPath + '/' + filename;
  try{
    var stats = fs.statSync(webpath);
  }
  catch (err){
    // If the error is that the file doesn't exist, then copy it
    if(err.errno === 34){
      fs.createReadStream(filepath).pipe(fs.createWriteStream(webpath));
    }
    else if(err.errno !== undefined){
      return callback(err);
    }
  }
  return callback({'filename':filename});
};