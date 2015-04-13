/*
 * Group Routes
 */

var auth = require('../modules/auth-handler');
var groups = require('../modules/group-handler');

// Create group
exports.create = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// Get group
exports.get = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// Get all groups
exports.getAll = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// Delete group
exports.delete = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// Update group
exports.update = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// Get the groups the given user is part of
exports.getGroupsByUser = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}

// Get the groups the given user is part of
exports.getGroupsByFile = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
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
            response.jsonp({'err':'Please request new access token.'});
        }
    });
}