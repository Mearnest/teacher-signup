/**
 * LessonController
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

// utility functions
function lessonTitleToURL(title) {
	var url = title.replace(/\s+/g, '_').replace(/\.|'/g, '').replace(/\(|\)/g, '').toLowerCase();
	return url;
}

function createApplication(lesson, newLesson, res) {
	Lesson.create(newLesson)
		.done(function(err, application) {
			if (err) {
				res.json({ "error": err });
			} 
			else {
				res.json({ "lesson": lesson, "application": application });
			}
		});
}
 
module.exports = {
	create: function(req, res) {
		var user = req.session.user;
		if (user && user.role == "Teacher" || user.role == "Admin") {
			var title = req.param("title").trim();
			var url = lessonTitleToURL(title);
			var lessonType = req.param("lessonType");
			var createdBy = req.param("createdBy");
			var newLesson = { "title": title, "url": url, "type": lessonType, "createdBy": user.fullName, "createdById": user.id };
			
			if (title.length < 2) {
				res.json({ "error": "You must enter at least two letters for a lesson title." });
			}
			
			// Make sure Lesson doesn't already exist.
			Lesson.findOne({ "title": title }, function(err, lesson) {
				if (err) {
					res.json({ "error": err });
				}
				else if (lesson) { // Lesson already exists
					res.json({ "error": "Lesson " + title + " already exists."});
				}
				else { // Create the Lesson
					Lesson.create(newLesson)
						.done(function(err, lesson) {
							if (err) {
								res.json({ "error": err });
							} 
							else {
								// Have to pass a copy in order to ref lesson out of scope.
								var parentLesson = { "id": lesson.id, "title": lesson.title, "type": lesson.type, "createdBy": lesson.createdBy };

								// Create an application video to go along with the Principle or Strategy video
								newLesson.type = "Application";
								newLesson.parent = lesson.title;
								newLesson.parentType = lesson.type;
								
								EmailService.notifyAddLesson(user, lesson, req.headers['user-agent']);

								// If lesson has a parans, then it is probably a version.
								// Check for an existing principle, and if it doesn't exist, create it.
								// The idea is to have only one principle for multiple versions of a principle or strategy lesson.
								if (lesson.title.match(/\(/)) { 
									appTitle = title.replace(/\(.+\)/, "");

									Lesson.findOne({ "title": appTitle, "type": "Application" }, function(err, application) {
										if (err) {
											res.json({ "error": err });
										}
										else if (application) { // Lesson already exists
											res.json({ "lesson": lesson, "application": null });
										}
										else {
											newLesson.title = appTitle;
											newLesson.url = lessonTitleToURL(appTitle);
											
											createApplication(parentLesson, newLesson, res);
										}
									});
								}
								else {  // Just create the application as is.
									createApplication(parentLesson, newLesson, res);
								}
							}
						});
				}
			});
		}
		else {
			res.json({ "error": "You must first login or signup as a teacher to add a new lesson." });
		}
	},

	// Signup for the script or video part of the lesson.
	signup: function(req, res) {
		if (req.method == "PUT") {
			if (req.session.user) {
				var user = req.session.user;
				var id = req.param("id");
				var signupType = req.param("signupType");
				
				Lesson.findOne({ "id": id }, function(err, lesson) {
					if (err) {
						console.log(err)
						res.json({ "error": "A server error occurred while attempting to fetch data." });
					}
					else if (lesson) {
						if (signupType == "script") {
							// Needs to be a better way of handling this because users can change their information.
							lesson.script = user.fullName + (user.school != 'Other' ? " at " + user.school : ""); 
							lesson.scriptId = user.id;
							lesson.scriptStatus = "In Progress";
								
							lesson.save(function(err) {
								if (err) {
									console.log(err)
									res.json({ "error": "A server error occurred while attempting to save the lesson." });
								}
								else {
									res.json(lesson);
								}
							});
						}
						else {
							lesson.video = user.fullName + " at " + user.school; 
							lesson.videoId = user.id;
							lesson.videoStatus = "In Progress";
								
							lesson.save(function(err) {
								if (err) {
									console.log(err)
									res.json({ "error": "A server error occurred while attempting to save the lesson." });
								}
								else {
									res.json(lesson);
								}
							});
						}
					}
					else {
						res.json({ "error": "Lesson " + id + " not found." });
					}
				});
			}
		}
	},

	cancelSignup: function(req, res) {
		if (req.method == "PUT") {
			if (req.session.user) {
				var user = req.session.user;
				var id = req.param("id");
				var signupType = req.param("signupType");
				
				Lesson.findOne({ "id": id }, function(err, lesson) {
					if (err) {
						console.log(err)
						res.json({ "error": "A server error occurred while attempting to fetch data." });
					}
					else if (lesson) {
						if (signupType == "script") {
							lesson.script = null;
							lesson.scriptId = null;
							lesson.scriptStatus = null;
								
							lesson.save(function(err) {
								if (err) {
									console.log(err)
									res.json({ "error": "A server error occurred while attempting save the lesson." });
								}
								else {
									res.json(lesson);
								}
							});
						}
						else {
							lesson.video = null;
							lesson.videoId = null;
							lesson.videoStatus = null;
								
							lesson.save(function(err) {
								if (err) {
									console.log(err)
									res.json({ "error": "A server error occurred while attempting save the lesson." });
								}
								else {
									res.json(lesson);
								}
							});
						}
					}
					else {
						res.json({ "error": "Lesson " + id + " not found." });
					}
				});
			}
		}
	},
	
	// List of all lessons for repopulating lesson list when user logs in or out.
	// This is to determine what Signup buttons to show (all on logout, some on log in).
	list: function(req, res) {
		var user = req.session.user;
		var lessonList = [];
		var lesson;
		var scriptList;
		var videoList;
		
		Lesson.find().done(function(err, lessons) {
			if (err) {
				console.log({ "error": err });
				res.json({ "error": "An error occurred fetching the list of lessons." });
			}
			
			lessonList = lessons;
			res.json({ "lessons": lessonList });
		});
	},
	
	_config: {}
};
