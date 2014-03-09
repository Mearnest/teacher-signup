// EmailService.js - in api/services
var nodemailer = require("nodemailer");

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


exports.sendContactEmail = function(req, res) {
	var subject = req.param("subject");
	var message = req.param("message");
	var userAgent = req.headers['user-agent'];
	var user = req.session.user;
	
	mailOptions["to"] = "mark@treesforlife.org";
	mailOptions["subject"] = "Teacher Signup: " + subject;
	mailOptions["text"] = message;
	mailOptions["html"] = message;

	if (user) {
		mailOptions["from"] = user.email; // doesn't work
		mailOptions["text"] += "\n\n" + user.fullName + "\n" + user.role + "\n" + user.email;
		mailOptions["html"] += "<p>" + user.fullName + "<br>" + user.role + "<br>" + user.email + "</p>";
	}
	
	mailOptions["text"] += "\n\n" + userAgent;
	mailOptions["html"] += "<p>" + userAgent + "</p>";
	
	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response) {
		if (error) {
			console.log(error);
			res.json({ "error": "Error occurred while attempting to send your email." });
		} 
		else {
			// console.log("Message sent: " + response.message);
			var mailAttr = {
				"action": "contact",
				"subject": subject,
				"message": message,
				"userName": (user ? user.fullName : "anonymous"),
				"userAgent": userAgent,
				"response": response.message
			}

			Mail.create(mailAttr).done(function(err, mail) {
				if (err) {
					console.log({ "error": err });
				}

				// if you don't want to use this transport object anymore, uncomment following line
				// smtpTransport.close(); // shut down the connection pool, no more messages
				res.json({ "message": "Your email was successfully sent." });
			});
		}
	});
};

exports.notifyNewUser = function(user, password, userAgent) {
	var subject = "Teacher Signup: new account created";
	var message = "You have created a new account at http://teacher-signup.heroku.com";
	
	mailOptions["to"] = user.email;
	mailOptions["subject"] = subject;
	mailOptions["text"] = "Hello " + user.firstName + ",\n\n" + message + "\n\nLogin credentials:\n\n" + user.fullName + "\n" + password;
	mailOptions["html"] = "Hello " + user.firstName + ",<br><br>" + "<p>Login credentials:</p>" + user.fullName + "<br>" + password;
	
	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response) {
		if (error) {
			console.log(error);
		} 
		else {
			// console.log("Message sent: " + response.message);
			var mailAttr = {
				"action": "notify account created",
				"subject": subject,
				"message": message,
				"userName": (user ? user.fullName : "anonymous"),
				"userAgent": userAgent,
				"response": response.message
			};
			
			Mail.create(mailAttr).done(function(err, mail) {
				if (err) {
					console.log({ "error": err });
				}

				// if you don't want to use this transport object anymore, uncomment following line
				// smtpTransport.close(); // shut down the connection pool, no more messages
				// console.log(response);
			});
		}
	});
};

exports.notifyAddLesson = function(user, lesson, userAgent) {
	var subject = "Teacher Signup: lesson added";
	var message = "You added lesson " + lesson.title + " at http://teacher-signup.heroku.com";
	
	mailOptions["to"] = user.email;
	mailOptions["subject"] = subject;
	mailOptions["text"] = message;
	mailOptions["html"] = message;
	
	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response) {
		if (error) {
			console.log(error);
		} 
		else {
			// console.log("Message sent: " + response.message);
			var mailAttr = {
				"action": "notify lesson added",
				"subject": subject,
				"message": message,
				"userName": (user ? user.fullName : "anonymous"),
				"userAgent": userAgent,
				"response": response.message
			};
			
			Mail.create(mailAttr).done(function(err, mail) {
				if (err) {
					console.log({ "error": err });
				}

				// if you don't want to use this transport object anymore, uncomment following line
				// smtpTransport.close(); // shut down the connection pool, no more messages
				// console.log(response);
			});
		}
	});	
};