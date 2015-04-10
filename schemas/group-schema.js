'use strict';

var mongoose = require('mongoose');
var File = require('./file-schema').File;

var groupSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
		index: true
	},
	canUpload: {
		type: Boolean,
		default: false
	},
	canDownload: {
		type: Boolean,
		default: false
	},
	users: {
		type: [mongoose.Schema.Types.ObjectId]
	},
	files: {
		type: [mongoose.Schema.Types.ObjectId]
	}
});

exports.Group = mongoose.model('Group', groupSchema);