'use strict';

var mongoose = require('mongoose');

var fileSchema = mongoose.Schema({
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
	containingDirectory: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	},
	groups: {
		type: [mongoose.Schema.Types.ObjectId]
	},
});

exports.File = fileSchema;