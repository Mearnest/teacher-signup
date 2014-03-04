/**
 * Global adapter config
 * 
 * The `adapters` configuration object lets you create different global "saved settings"
 * that you can mix and match in your models.  The `default` option indicates which 
 * "saved setting" should be used if a model doesn't have an adapter specified.
 *
 * Keep in mind that options you define directly in your model definitions
 * will override these settings.
 *
 * For more information on adapter configuration, check out:
 * http://sailsjs.org/#documentation
 */

module.exports.adapters = {
	'default': 'mongo',

	mongo: {
		module: 'sails-mongo',
		url: 'mongodb://T3aCh3R:L3Ss0nsS1gnUp@ds033499.mongolab.com:33499/heroku_app22698701'
		// { user: "T3aCh3R", account: "L3Ss0nsS1gnUp" }
	}
};