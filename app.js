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

// Routes
var groupRoutes = require('./routes/group-routes');
var userRoutes = require('./routes/user-routes');
var fileRoutes = require('./routes/file-routes');

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
app.get('/fileListing', fileRoutes.getFileListing);

app.post('/addFilesToGroup', jsonParser, fileRoutes.addFilesToGroup);

app.post('/addGroupsToFile', jsonParser, fileRoutes.addGroupsToFile);

// Relative file path included in request query
app.get('/getSingleFile', fileRoutes.getSingleFile);

app.get('/setupWebStream', fileRoutes.setupWebStream);

/*
 * User Module
 */

// Create a new user
app.post('/users', jsonParser, userRoutes.create);

// Get single user by id
app.get('/users/:id', userRoutes.get);

// Get all users
app.get('/users', userRoutes.getAll);

// Delete user
app.delete('/users/:id', userRoutes.delete);

// Update user fields :id is the Mongo ObjectId
app.post('/users/:id', jsonParser, userRoutes.update);

// Get the groups the given user is part of
app.get('/groupsByUser/:id', userRoutes.getGroupsByUser);

// Add array of group ids to the given user
// app.post('/groupsToUser/:id', jsonParser, userRoutes.addGroupsToUser);  // MOVED TO UPDATE CALL

// Remove array of group ids from the given user
// app.delete('/groupsFromUser/:id', jsonParser, userRoutes.removeGroupsFromUser);  // MOVED TO UPDATE CALL

/*
 * Group Module
 */

// Create group
app.post('/groups', jsonParser, groupRoutes.create);

// Get group
app.get('/groups/:id', groupRoutes.get);

// Get all groups
app.get('/groups', groupRoutes.getAll);

// Delete group
app.delete('/groups/:id', groupRoutes.delete);

// Update group
app.post('/groups/:id', jsonParser, groupRoutes.update);

// Get the users the given group contains
app.get('/usersByGroup/:id', groupRoutes.getUsersByGroup);

// Add array of user ids to the given group
// app.post('/usersToGroup/:id', jsonParser, groupRoutes.addUsersToGroup);  // MOVED TO UPDATE CALL

// Remove array of user ids from the given group
// app.delete('/usersFromGroup/:id', jsonParser, groupRoutes.removeUsersFromGroup);  // MOVED TO UPDATE CALL

app.get('/filesByGroup/:id', groupRoutes.getFilesByGroup);

// app.post('/filesToGroup/:id', jsonParser, groupRoutes.addFilesToGroup);  // MOVED TO UPDATE CALL

// app.delete('/filesFromGroup/:id', jsonParser, groupRoutes.removeFilesFromGroup);  // MOVED TO UPDATE CALL

 /*
  * Network Module
  */


/*
 * Start it up
 */
app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);