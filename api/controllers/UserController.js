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
	var sessionUser = { "id": user.id, "firstName": user.firstName, "lastName": user.lastName, "fullName": user.fullName, "role": user.role, "school": user.school, "url": user.url, "email": user.email };
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
	register: function(req, res) {
		if (req.method == "POST" && req.isAjax) {
			var firstName = req.param("firstName").trim();
			var lastName = req.param("lastName").trim();
			var fullName = firstName + " " + lastName;
			var url = userNameToURL(fullName);
			var role = req.param("role");
			var email = req.param("email").trim();
			var school = req.param("school");
			var password = req.param("password");
			var confirmPassword = req.param("confirmPassword");
			var hasher = require("password-hash");
			
			if (firstName.length < 2) {
				res.json({ "error": "First name must be at least 2 characters." });
			}
			else if (lastName.length < 2) {
				res.json({ "error": "Last name must be at least 2 characters." });
			}
			else if (password.length < 3) {
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
								var hashedPassword = hasher.generate(password);
								var account = { "firstName": firstName, "lastName": lastName, "fullName": fullName, "url": url, "role": role, "school": school, "email": email, "password": hashedPassword };
								
								User.create(account)
									.done(function(err, user) {
										if (err) {
											res.json({ "error": err });
										} 
										else {
											setUserSession(user, req);
											EmailService.notifyNewUser(user, password, req.headers['user-agent']);

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
		// Make hacking and spam bot job harder by only allowing ajax logins
		if (req.method == "POST" && req.isAjax) {
			var loginName = req.param("loginName").trim();  // This can also be the user's email addy
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
			res.json({ "error": "Login disabled." });
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
					console.log({ "error": err })
					res.json({ "error": "There was a database error while fetching the list of lessons." });
				}
				else {
					for (var i = 0; i < lessons.length; i++) {
						var lesson = lessons[i];
						
						if (lesson.createdBy == user.fullName) {
							lessonsCreated.push(lesson);
						}
						
						if (lesson.script && lesson.script.match(user.fullName)) {
							scripts.push(lesson);
						}
						
						if (lesson.video && lesson.video.match(user.fullName)) {
							videos.push(lesson);
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

	update: function(req, res) {
		if (req.method == "PUT") {
			if (req.session.user) {
				var user = req.session.user;
				var firstName = req.param("firstName").trim();
				var lastName = req.param("lastName").trim();
				var fullName = firstName + " " + lastName;
				var email = req.param("email").trim();
				var password = req.param("password");
				var role = req.param("role");
				var school = req.param("school");

				if (firstName == "") {
					res.json({ "error": "First Name is required." });
				}
				else if (lastName == "") {
					res.json({ "error": "Last Name is required." });
				}
				else if (email == "") {
					res.json({ "error": "Email is required." });
				}
				else if (password && password.length < 3) {
					res.json({ "error": "Password must be at least 3 characters." });
				}
				// Validation passed
				else {
					console.log("Update user");

					User.findOne({ "id": user.id }, function(err, account) {
						if (err) {
							console.log(err);
							res.json({ "error": "A server error occurred while attempting to fetch data." });
						}
						else {
							// If the user changed their name, need to update Lessons they've created or signed-up form.
							if (user.fullname != fullName) {
								account.firstName = firstName;
								account.lastName = lastName;
								account.fullName = fullName;
								account.url = userNameToURL(account.fullName);
							}

							account.email = email;
							account.role = role;
							account.school = school;

							// If the user typed in a new password
							if (password) {
								var hasher = require("password-hash");
								var hashedPassword = hasher.generate(password);
								account.password = hashedPassword;
							}

							account.save(function(err) {
								if (err) {
									console.log(err);
									res.json({ "error": "A server error occurred while attempting to update your profile." });
								}
								else {
									res.json({ 'user': account });

									// If the user changed their name, need to update Lessons they've created or signed-up form.
									if (user.fullName != fullName) {
										Lesson.update({ "createdBy": user.fullName }, { "createdBy": account.fullName }, function(err, lessons) {
											if (err) {
										    	return console.log(err);
										  	} 
										  	else {
										  		console.log("Lessons updated for createdBy.")
										    	// console.log("Lessons updated:", lessons);
											}
										});

										var oldSignup = user.fullName + (user.school != 'Other' ? " at " + user.school : ""); 
										var newSignup = fullName + (account.school != 'Other' ? " at " + account.school : ""); 

										Lesson.update({ "script": oldSignup }, { "script": newSignup }, function(err, lessons) {
											if (err) {
										    	return console.log(err);
										  	} 
										  	else {
										  		console.log("Lessons updated for script.")
										    	// console.log("Lessons updated:", lessons);
											}
										});

										Lesson.update({ "video": oldSignup }, { "video": newSignup }, function(err, lessons) {
											if (err) {
										    	return console.log(err);
										  	} 
										  	else {
										  		console.log("Lessons updated for video.")
										    	// console.log("Lessons updated:", lessons);
											}
										});
									}
								}
							});
						}
					});
				}
			}
		}
	},
	
	_config: {}
};
