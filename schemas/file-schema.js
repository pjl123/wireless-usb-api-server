'use strict';

var mongoose = require('mongoose');

var fileSchema = mongoose.Schema({
	usbId: {
		type: String,
		required: true
	},
	filepath: {
		type: String,
		required: true,
		unique: true,
		index: true
	},
	isDirectory: {
		type: Boolean,
		required: true
	},
	size: {
		type: Number,
		required: true
	},
	lastUpdated: {
		type: Date,
		required: true
	},
	parentDirectory: {
		type: mongoose.Schema.Types.ObjectId // Maybe make this required and have it point to the group id if it's top level file
	},
	groups: {
		type: [mongoose.Schema.Types.ObjectId]
	}
});

exports.File = mongoose.model('File', fileSchema);