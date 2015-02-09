'use strict';

/*
 * Express Dependencies
 */
var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var app = express();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var mongoose = require('mongoose');
var port = 3000;

/*
 * Custom API Dependencies
 */

// Custom Modules
var auth = require('./modules/auth-handler');
var fileDelivery = require('./modules/file-delivery');
var users = require('./modules/user-handler');
var network = require('./modules/network-handler');

// Mongoose Schemas
var User = require('./schemas/user-schema').User;

/*
 * Use Handlebars for templating
 */
var exphbs = require('express3-handlebars');
var hbs;

// For gzip compression
app.use(express.compress());

/*
 * Config for Production and Development
 */
if (process.env.NODE_ENV === 'production') {
    // Set the default layout and locate layouts and partials
    app.engine('handlebars', exphbs({
        defaultLayout: 'main',
        layoutsDir: 'dist/views/layouts/',
        partialsDir: 'dist/views/partials/'
    }));

    // Locate the views
    app.set('views', __dirname + '/dist/views');
    
    // Locate the assets
    app.use(express.static(__dirname + '/dist/assets'));

} else {
    app.engine('handlebars', exphbs({
        // Default Layout and locate layouts and partials
        defaultLayout: 'main',
        layoutsDir: 'views/layouts/',
        partialsDir: 'views/partials/'
    }));

    // Locate the views
    app.set('views', __dirname + '/views');
    
    // Locate the assets
    app.use(express.static(__dirname + '/assets'));
}

// Set Handlebars
app.set('view engine', 'handlebars');

/*
 * Connect to the mongo database
 */

mongoose.connect('mongodb://localhost/wireless-usb');
var conn = mongoose.connection;
conn.on('error', function (callback){
    console.error('Could not connect to Mongo! Contact your admin to start it.\nExiting now!');
    process.exit(1);
}); 
conn.once('open', function (callback) {
    console.log('Connected to Mongo!');
    var admin = new User({
        name: 'admin',
        accessToken: 'foo',
        isAdmin: true
    });
    admin.save(function(err, admin){
        if(!err){
            console.log('Created admin:\n' + admin);
        }
        else{
            console.log('admin exists already');
        }
    });
});

/*
 * Routes
 */

// Index Page
app.get('/', function (request, response, next) {
    response.render('index');
});

/*
 * Authentication Module
 */

app.get('/requestAccessToken', function (request, response, next){
    auth.requestAccessToken(request.query.id, request.query.key, function (responseData){
        if(responseData.err !== undefined){
            response.status(400);
        }
        response.jsonp(responseData);
    });
});

/*
 * File Delivery Module
 */

// Relative file path included in request query
app.get('/fileListing', function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            fileDelivery.getFileListing(request.query.path, userId, function (responseData){
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
});

// Relative file path included in request query
app.get('/getSingleFile', function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            fileDelivery.getSingleFile(request.query.path, function (responseData){
                if(responseData.err === undefined){
                    responseData.pipe(response);
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
});

app.get('/setupWebStream', function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            fileDelivery.setupWebStream(request.query.path, function (responseData){
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
});

/*
 * User Module
 */

// Create a new user
app.post('/users', jsonParser, function (request, response, next){
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
});

// Get single user by id
app.get('/users/:id', function (request, response, next){
    auth.isAuthenticated(request.query.accessToken, function (authenticated, userId){
        if(authenticated){
            users.getUser(userId, request.params.id, function (responseData){
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
});

// Get all users
app.get('/users', function (request, response, next){
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
});

// Delete user
app.delete('/users/:id', function (request, response, next){
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
});

// Update user fields :id is the Mongo ObjectId
app.post('/users/:id', jsonParser, function (request, response, next){
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
});

// Create group

// Get group

// Get all groups

// Delete group

// Update group

// Add user to group

 /*
  * Network Module
  */


/*
 * Start it up
 */
app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);