/**
 * Lesson
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {
	attributes: {
		title: {
			type: 'string',
			required: true,
			minLength: 2,
		},
		type: {
			type: 'string',
			required: true,
		},
		createdBy: {
			type: 'string',
			required: true,
		},
		scriptList: {  // List of signed-up users.
			type: 'array',
			defaultsTo:  [],
		},	
		videoList: {  // List of signed-up users.
			type: 'array',
			defaultsTo:  [],
		},
		scriptStatus: 'string',  // in progress, finished
		videoStatus: 'string',	// in progress, finished
		url: 'string',
		
		// For Application lessons only
		parent: 'string',
		parentType: 'string'
	},
};
