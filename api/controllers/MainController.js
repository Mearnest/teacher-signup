/**
 * MainController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var nodemailer = require("nodemailer");

function emptyModels() {
	Mail.destroy().done(function(err) {
	  	// Error handling
	  	if (err) {
	    	return console.log(err);
	  	// Johnny was deleted!
	  	} else {
	    	console.log("Mail deleted");
	  	}
	});

	Lesson.destroy().done(function(err) {
	  	// Error handling
	  	if (err) {
	    	return console.log(err);
	  	// Johnny was deleted!
	  	} else {
	    	console.log("Lesson deleted");
	  	}
	});

	User.destroy().done(function(err) {
	  	// Error handling
	  	if (err) {
	    	return console.log(err);
	  	// Johnny was deleted!
	  	} else {
	    	console.log("User deleted");
	  	}
	});
}

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
	service: "Gmail",
	auth: {
		user: "mark@treesforlife.org",
		pass: "corkwood1"
	}
});

// setup e-mail data with unicode symbols
var mailOptions = {
		from: "Teacher Signup ✔", // sender address
		to: "", // list of receivers
		subject: "", // Subject line
		text: "", // plaintext body
		html: "" // html body
};
 
module.exports = {
	index: function(req, res) {
		Lesson.find().done(function(err, lessons) {
			if (err) {
				res.json({ "error": err });
			}
			else {
				var lessonList = lessons;
				lessonList.sort(function(l1, l2) {
					return new Date(l2.createdAt) - new Date(l1.createdAt);
				});
				
				res.view({ "user": req.session.user, "lessons": lessonList });
			}
		});
	},
	
	test: function(req, res) {
		res.view({ "data": "foo bar" });
	},
	
	_config: {}
};
