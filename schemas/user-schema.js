'use strict';

var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	accessToken: {
		type: String
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
		[mongoose.Schema.Types.ObjectId]
	}
});

exports.User = mongoose.model('User', userSchema);