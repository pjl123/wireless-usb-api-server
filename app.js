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


/*
 * File Delivery Module
 */

// File path included in request query
app.get('/fileListing', function(request, response, next){
    // TODO check for authenticated request
    fileDelivery.getFileListing(request, function(responseData){
        response.jsonp(responseData);
    });
});

/*
 * User Module
 */

// Update user permissions
app.post('/users/:id', jsonParser, function(request, response, next){
    var accessToken = request.query.accessToken;
    var id = request.params.id;

    // request must be authenticated and come from an admin
    if(auth.isAuthenticated(accessToken)){
        if(users.isAdmin(auth.getOwner(accessToken))){
            users.updateUser(id, request.body, function(responseData){
                response.jsonp(responseData);
            });
        }
        else{
            response.jsonp({'err':'user with given id: \"' + id + '\" is not admin'});
        }
    }
    else{
        response.jsonp({'err':'call not authenticated, must request access token'});
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