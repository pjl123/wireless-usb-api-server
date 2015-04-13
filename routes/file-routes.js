/*
 * File Delivery Routes
 */
 var auth = require('../modules/auth-handler');
 var fileDelivery = require('../modules/file-delivery');

// Relative file path included in request query
exports.getFileListing = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            fileDelivery.getFileListing(request.query.fileId, userId, function (responseData){
                if(responseData.err !== undefined){
                    response.status(400);
                }
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// exports.addFilesToGroup = function (request, response, next){
//     auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
//         if(authenticated){
//             fileDelivery.addFilesToGroup(request.body.paths, userId, request.body.groupId, function (responseData){
//                 if(responseData.err !== undefined){
//                     response.status(400);
//                 }
//                 response.jsonp(responseData);
//             });
//         }
//         else{
//             response.status(401);
//             response.jsonp({'err':'Please request new access token.'});
//         }
//     });
// }

// Get file
exports.get = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// Get all files
exports.getAll = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// Update file
exports.update = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// Add array of group ids to the given file
exports.addGroupsToFile = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            fileDelivery.addGroupsToFile(userId, request.body.fileId, request.body.groupIds, 1, function (responseData){
                if(responseData.err !== undefined){
                    response.status(400);
                }
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// Remove array of group ids from the given file
exports.removeGroupsFromFile = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            fileDelivery.removeGroupsFromFile(userId, request.params.id, request.body, 1, function (responseData){
                if(responseData.err !== undefined){
                    response.status(400);
                }
                else{
                    response.status(201);
                }
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// Get the groups the given file belongs in
exports.getFilesByGroup = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

exports.getSingleFile = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

exports.setupWebStream = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            fileDelivery.setupWebStream(userId, request.query.fileId, function (responseData){
                if(responseData.err !== undefined){
                    response.status(400);
                }
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}