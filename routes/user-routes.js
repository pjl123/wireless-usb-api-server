/*
 * User Routes
 */

var auth = require('../modules/auth-handler');
var users = require('../modules/user-handler');

exports.createUserToken = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            users.generateCreateUserToken(userId, function (responseData){
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

// Create a new user
exports.create = function (request, response, next){
    users.createUser(request.query.token, request.body, function (responseData){
        if(responseData.err !== undefined){
            response.status(400);
        }
        else{
            response.status(201);
        }
        response.jsonp(responseData);
    });
}

// Get single user by id
exports.get = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
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
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

// Get all users
exports.getAll = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
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
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

// Delete user
exports.delete = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
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
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

// Update user fields :id is the Mongo ObjectId
exports.update = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
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
            response.jsonp({'err':'User not authorized.'});
        }
    });
}

// Get the users the given group contains
exports.getUsersByGroup = function (request, response, next){
    var userId = request.get('Authorization');
    auth.isAuthorized(userId, function (authorized){
        if(authorized){
            users.getUsersByGroup(userId, request.params.id, function (responseData){
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