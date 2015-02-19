/*
 * User Routes
 */

var auth = require('../modules/auth-handler');
var users = require('../modules/user-handler');

// Create a new user
exports.create = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            users.createUser(userId, request.body, function (responseData){
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

// Get single user by id
exports.get = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            users.getUser(userId, request.params.id, function (err, responseData){
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

// Get all users
exports.getAll = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            users.getAllUsers(userId, function (err, responseData){
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

// Delete user
exports.delete = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            users.deleteUser(userId, request.params.id, function (responseData){
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

// Update user fields :id is the Mongo ObjectId
exports.update = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            users.updateUser(userId, request.params.id, request.body, function (responseData){
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
            users.getGroupsByUser(userId, request.params.id, function (responseData){
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

// Add array of group ids to the given user
exports.addGroupsToUser = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            users.addGroupsToUser(userId, request.params.id, request.body, 1, function (responseData){
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

// Remove array of group ids from the given user
exports.removeGroupsFromUser = function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            users.removeGroupsFromUser(userId, request.params.id, request.body, 1, function (responseData){
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