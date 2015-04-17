/*
 * File Delivery Routes
 */
 var auth = require('../modules/auth-handler');
 var fileDelivery = require('../modules/file-delivery');

// Relative file path included in request query
exports.getFileListing = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            fileDelivery.getFileListing(request.query.fileId, userId, function (responseData){
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

exports.getSingleFile = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            fileDelivery.getSingleFile(request.query.path, function (responseData){
                if(responseData.err === undefined){
                    responseData.on('open', function () {
                        responseData.pipe(response);
                    });
                    responseData.on('error', function(err){
                        response.status(400);
                        response.jsonp(err);
                    })
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

exports.setupWebStream = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            fileDelivery.setupWebStream(userId, request.query.fileId, function (responseData){
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