/**
 * UserController
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
 
// Convert a user's fullanme to a friendly url (underscores for spaces, lowercase, remove periods and apostrophes).
function userNameToURL(fullName) {
	var url = fullName.replace(/\s+/g, '_').replace(/\.|'/g, '').toLowerCase();
	return url;
}

function checkIfEmail(loginName) {
	return /\b[a-z0-9-_.]+@[a-z0-9-_.]+(\.[a-z0-9]+)+/i.test(loginName);
}

function setUserSession(user, req) {
	var sessionUser = { "firstName": user.firstName, "fullName": user.fullName, "role": user.role, "school": user.school, "url": user.url, "email": user.email };
	req.session.user = sessionUser;
}

function loginVerifyPass(req, res, user, password, loginName) {
	var hasher = require("password-hash");
	
	if (hasher.verify(password, user.password)) {
		setUserSession(user, req);
		res.json({ "user": req.session.user });
	}
	else {
		res.json({ "error": "You entered the wrong password for " + loginName + "." });
	}
}



module.exports = {
	signup: function(req, res) {
		if (req.method == "POST") {
			var firstName = req.param("firstName");
			var lastName = req.param("lastName");
			var fullName = firstName + " " + lastName;
			var url = userNameToURL(fullName);
			var role = req.param("role");
			var email = req.param("email");
			var school = req.param("school");
			var password = req.param("password");
			var confirmPassword = req.param("confirmPassword");
			var hasher = require("password-hash");
			var account; // new user
			
			// Make sure the passwords match
			if (password.length < 3) {
				res.json({ "error": "Password must be at least 3 characters." });
			}
			else if (password === confirmPassword) {
				// Check that the user does not already exist.
				User.findOne({ "fullName": fullName }, function(err, user) {
					if (err) {
						res.json({ "error": err });
					}
					else if (user) {
						res.json ({ "error": "User " + fullName + " already exists." });
					}
					else {
						// Email has to be unique as well.
						User.findOne({ "email": email }, function(err, user) {
							if (err) res.json({ "error": err });
							else if (user) {
								res.json ({ "error": "There is already a user with email " + email + "." });
							}
							else {
								// Generate the password hash and account object to create a new user.
								password = hasher.generate(password);
								account = { "firstName": firstName, "lastName": lastName, "fullName": fullName, "url": url, "role": role, "school": school, "email": email, "password": password };
								
								User.create(account)
									.done(function(err, user) {
										if (err) {
											res.json({ "error": err });
										} 
										else {
											setUserSession(user, req);
											res.json({ "user": user, "sesson": req.session });
										}
									});
							}
						});
					}
				});
			}
			else {
				res.json({ "error": "Password and Confirm Password are not the same." });
			}	
		}
		else {
			res.view({ "user": JSON.stringify(req.session.user) });
		}
	},
	
	login: function(req, res) {
		if (req.method == "POST") {
			var loginName = req.param("loginName");  // This can also be the user's email addy
			var password = req.param("password");
			
			if (checkIfEmail(loginName)) {
				// try to login via email
				User.findOne({ "email": loginName }, function(err, user) {
					if (err) {
						res.json({ "error": err });
					}
					else if (!user) {
						res.json ({ "error": "No user was found with the email " + loginName + "." });
					}
					else {
						loginVerifyPass(req, res, user, password, loginName);
					}
				});
			}
			else {
				// try to login via full name
				User.findOne({ "fullName": loginName }, function(err, user) {
					if (err) {
						res.json({ "error": err });
					}
					else if (!user) {
						res.json ({ "error": "No user was found with the name " + loginName + "." });
					}
					else {
						loginVerifyPass(req, res, user, password, loginName);
					}
				});
			}
		}
		else {
			res.view({ "user": JSON.stringify(req.session.user) });
		}
	},
	
	logout: function(req, res) {
		req.session.user = null;
		res.json({ "message": "Logged Out" });
	},
	
	profile: function(req, res) {
		if (req.session.user) {
			var user = req.session.user;
			var lessonsCreated = [];
			var scripts = [];
			var videos = [];
			
			Lesson.find(function(err, lessons) {
				if (err) {
					res.json({ "error": err });
				}
				else {
					for (var i = 0; i < lessons.length; i++) {
						var lesson = lessons[i];
						var scriptList = lesson.scriptList;
						var videoList = lesson.videoList;
						
						if (lesson.createdBy == user.fullName) {
							lessonsCreated.push(lesson);
						}
						
						for(var j = 0; j < scriptList.length; j++) {
							if (scriptList[j].user == user.fullName) {
								scripts.push(lesson)
							}
						}
						
						for(j = 0; j < videoList.length; j++) {
							if (videoList[j].user == user.fullName) {
								videos.push(lesson)
							}
						}
					}
					
					res.json({ "lessonsCreated": lessonsCreated, "scripts": scripts, "videos": videos });
				}
			});
		}
		else {
			res.json({ "error": "User not logged in." });
		}
	},
	
	_config: {}
};
