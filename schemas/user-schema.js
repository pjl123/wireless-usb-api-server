'use strict';

var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true
	},
	isAdmin: {
		type: Boolean,
		default: false
	},
	canUpload: {
		type: Boolean,
		default: false
	},
	canDownload: {
		type: Boolean,
		default: false
	},
	groups: {
		type: [mongoose.Schema.Types.ObjectId]
	}
});

exports.User = mongoose.model('User', userSchema);