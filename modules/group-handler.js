'use strict';

/*
 * Maintains group database
 */

var userSchema = require('../schemas/user-schema');
var groupSchema = require('../schemas/group-schema');
var User = userSchema.User;
var Group = groupSchema.Group;

var users = require('./user-handler.js');

// Create group
exports.createGroup = function (userId, groupObj, callback) {
	users.isAdmin(userId, function (result){
		if(result){
			var group = new Group(groupObj);
			group.save(function (err, newGroup){
				if(err){
					return callback({'err': err});
				}
				else{
					return callback(newGroup);
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "POST /groups" call'});
		}
	});
};

// Get a single user with the given id
exports.getGroup = function (userId, groupId, callback) {
	users.isAdmin(userId, function (result){
		if(result){
			Group.findOne({ '_id': groupId }, function (err, group){
				if(err){
					return callback(true, {'err': err});
				}
				else if(group === null){
					return callback(true, {'err': 'No group with given id: ' + groupId});
				}
				else{
					return callback(err, group);
				}
			});
		}
		else{
			return callback(true, {'err': 'Admin priviledges required for "GET /groups/:id" call'});
		}
	});
};

// Get all groups in db
exports.getAllGroups = function (userId, callback) {
	users.isAdmin(userId, function (result){
		if(result){
			Group.find({}, function (err, groups){
				return callback(err, groups);
			});
		}
		else{
			return callback(true, {'err': 'Admin priviledges required for "GET /groups" call'});
		}
	});
};

// Deletes the group with the given id
exports.deleteGroup = function (userId, groupId, callback) {
	users.isAdmin(userId, function (result){
		if(result){
			Group.remove({ '_id': groupId }, function (err){
				if(err){
					return callback({'err': err});
				}
				else{
					return callback({'success': 'group with id "' + groupId + '" has been deleted.'});
				}
			});
		}
		else{
			return callback({'err': 'Admin priviledges required for "DELETE /groups/:id" call'});
		}
	});
};

//TODO implement
exports.updateGroup = function (userId, groupId, groupObj, callback) {
	exports.getGroup(userId, groupId, function (err, group){
		if(err){
			if(group !== null){
				return callback(group);
			}
			else{
				return callback({'err': err});
			}
		}
		else{
			// Update the changeable group fields if they are set in the groupObj
			if(groupObj.name !== undefined){
				group.name = groupObj.name;
			}

			if(groupObj.canUpload !== undefined){
				group.canUpload = groupObj.canUpload;
			}

			if(groupObj.canDownload !== undefined){
				group.canDownload = groupObj.canDownload;
			}

			group.save(function (err, updatedUser){
				if(err){
					return callback({'err': err});
				}
				else{
					return callback(updatedUser);
				}
			});
		}
	});
};

exports.getUsersByGroup = function (userId, groupId, callback){

}

exports.getFilesByGroup = function (userId, groupId, callback){

}

//TODO implement
exports.addUserToGroup = function (userId, addUserId, groupId, callback) {
	// body...
};

exports.addManyUsersToGroup = function (userId, addUserIds, groupId, callback){

}

//TODO implement
exports.addFileToGroup = function (userId, addFileId, groupId, callback) {
	// body...
};

exports.addManyFilesToGroup = function (userId, addFileIds, groupId, callback){

}