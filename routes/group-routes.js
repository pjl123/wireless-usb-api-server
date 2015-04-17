/*
 * Group Routes
 */

var auth = require('../modules/auth-handler');
var groups = require('../modules/group-handler');

// Create group
exports.create = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            groups.createGroup(userId, request.body, function (responseData){
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
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

// Get group
exports.get = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            groups.getGroup(userId, request.params.id, function (err, responseData){
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

// Get all groups
exports.getAll = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            groups.getAllGroups(userId, function (err, responseData){
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

// Delete group
exports.delete = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            groups.deleteGroup(userId, request.params.id, function (responseData){
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

// Update group
exports.update = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            groups.updateGroup(userId, request.params.id, request.body, function (responseData){
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

// Get the groups the given user is part of
exports.getGroupsByUser = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            groups.getGroupsByUser(userId, request.params.id, function (responseData){
                if(responseData.err){
                    response.status(400);
                }
                else{
                    response.status(200);
                }
                console.log(responseData);
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

// Get the groups the given user is part of
exports.getGroupsByFile = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            groups.getGroupsByFile(userId, request.params.id, function (responseData){
                if(responseData.err){
                    response.status(400);
                }
                else{
                    response.status(200);
                }
                console.log(responseData);
                response.jsonp(responseData);
            });
        }
        else{
            response.status(401);
            response.jsonp({'err':'User not authorized.'});
        }
    });
}