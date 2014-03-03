/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {
	attributes: {
		firstName: {
			type: 'string',
			required: true,
			minLength: 2
		},
		lastName: {
			type: 'string',
			required: true,
			minLength: 2
		},
		fullName: {
			type: 'string',
			required: true,
			minLength: 5
		},
		email: {
			type: 'email',
			required: true,
			unique: true
		},
		role: {
			type: 'string',
			required: true
		},
		password: {
			type: 'string',
			required: true,
			minLength: 3
		},
		school: 'string',
		url: 'string'
	}
};
