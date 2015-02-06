'use strict';

var mongoose = require('mongoose');

var groupSchema = mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	canUpload: {
		type: Boolean,
		default: false;
	},
	canDownload: {
		type: Boolean
		default: false;
	}
});

exports.Group = mongoose.model('Group', groupSchema);