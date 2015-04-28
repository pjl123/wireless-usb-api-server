/*
 * File Delivery Routes
 */
 var auth = require('../modules/auth-handler');
 var fileDelivery = require('../modules/file-delivery');
 var fs = require('fs');

// Relative file path included in request query
exports.getFileListing = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            fileDelivery.getFileListing(request.params.id, userId, function (responseData){
                if(responseData.err !== undefined){
                    response.status(400);
                }
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

// Get file
exports.get = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            fileDelivery.getFile(userId, request.params.id, function (err, responseData){
                if(err){
                    response.status(400);
                }
                else{
                    response.status(200);
                }
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

// Get all files
exports.getAll = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            fileDelivery.getAllFiles(userId, function (err, responseData){
                if(err){
                    response.status(400);
                }
                else{
                    response.status(200);
                }
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

// Update file
exports.update = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            fileDelivery.updateFile(userId, request.params.id, request.body, function (responseData){
                if(responseData.err !== undefined){
                    response.status(400);
                }
                else{
                    response.status(200);
                }
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

// Get the groups the given file belongs in
exports.getFilesByGroup = function (request, response, next){
    var userId = request.get('Authorization');
    if(request.query.callback !== undefined){
        userId = request.query.userId;
    }
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            fileDelivery.getFilesByGroup(userId, request.params.id, function (responseData){
                if(responseData.err){
                    response.status(400);
                }
                else{
                    response.status(200);
                }
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

exports.downloadFile = function (request, response, next){
    fs.appendFile('downloadTimes.txt', 'S,' + Date.now() + ',' + request.params.id + "\n", function (err) {});
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            fileDelivery.downloadFile(userId, request.query.groupId, request.params.id, function (responseData){
                if(responseData.err === undefined){
                    responseData.on('open', function () {
                        responseData.pipe(response);
                    });
                    responseData.on('error', function(err){
                        response.status(400);
                        fs.appendFile('downloadTimes.txt', 'E,' + Date.now() + ',' + request.params.id + "\n", function (err) {});
                        response.jsonp(err);
                    });
                    responseData.on('end', function(){
                        fs.appendFile('downloadTimes.txt', 'C,' + Date.now() + ',' + request.params.id + "\n", function (err) {});
                    });
                }
                else{
                    response.status(400);
                    response.jsonp(responseData);
                }
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

exports.uploadFile = function (request, response, next){
    fs.appendFile('uploadTimes.txt', 'S,' + Date.now() + ',' + request.query.filename + "\n", function (err) {});
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            fileDelivery.uploadFile(userId, request.query.groupId, request.params.id, request.query.filename, request.text, function (responseData){
                if(responseData.err !== undefined){
                    response.status(400);
                    fs.appendFile('uploadTimes.txt', 'E,' + Date.now() + ',' + request.query.filename + "\n", function (err) {});
                }
                else{
                    fs.appendFile('uploadTimes.txt', 'C,' + Date.now() + ',' + request.query.filename + "\n", function (err) {});
                }
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

exports.setupWebStream = function (request, response, next){
    var userId = request.get('Authorization');
    if(request.query.callback !== undefined){
        userId = request.query.userId;
    }
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            fileDelivery.setupWebStream(userId, request.query.groupId, request.params.id, function (responseData){
                if(responseData.err !== undefined){
                    response.status(400);
                }
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'User not authorized.'});
        }
    });
}