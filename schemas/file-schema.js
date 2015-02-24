'use strict';

var mongoose = require('mongoose');

var fileSchema = mongoose.Schema({
	filepath: {
		type: String,
		required: true,
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
	}
});

exports.File = fileSchema;