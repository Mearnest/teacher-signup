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
		script: {  // signed-up user
			type: 'string',
			defaultsTo:  null,
		},	
		video: {  // signed-up user
			type: 'string',
			defaultsTo:  null,
		},

		createdById: 'string', // user id
		scriptId: 'string', // user id
		scriptStatus: 'string',  // not started/null / in progress, finished
		videoId: 'string', // user id
		videoStatus: 'string',	// not started/null / in progress, finished

		// To access lesson via a url
		url: 'string',
		
		// For Application lessons only
		parent: 'string',
		parentType: 'string'
	},
};
