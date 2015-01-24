'use strict';

/*
 * Express Dependencies
 */
var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var app = express();
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var port = 3000;

/*
 * Custom API Dependencies
 */
var auth = require('./modules/auth-handler');
var fileDelivery = require('./modules/file-delivery');
var users = require('./modules/user-handler');
var network = require('./modules/network-handler');

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
 * Routes
 */
// Index Page
app.get('/', function(request, response, next) {
    response.render('index');
});

/*
 * Authentication Module
 */

app.get('/requestAccessToken', function(request, response, next){
    auth.requestAccessToken(request.query.id, request.query.key, function(responseData){
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
app.get('/fileListing', function(request, response, next){
    if(auth.isAuthenticated(request.query.accessToken)){
        fileDelivery.getFileListing(request.query.path, function(responseData){
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

// Relative file path included in request query
app.get('/getSingleFile', function(request, response, next){
    if(auth.isAuthenticated(request.query.accessToken)){
        fileDelivery.getSingleFile(request.query.path, function(responseData){
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

/*
 * User Module
 */

// Update user permissions
app.post('/users/:id', jsonParser, function(request, response, next){
    if(auth.isAuthenticated(request.query.accessToken)){
        users.updateUser(request.params.id, request.body, function(responseData){
            if(responseData.err === undefined){
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


 /*
  * Network Module
  */


/*
 * Start it up
 */
app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);