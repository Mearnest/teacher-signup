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
	var url = title.replace(/\s+/g, '_').replace(/\.|'/g, '').toLowerCase();
	return url;
}

function userInList(list, user) {
	for (var i=0; i<list.length; i++) {
		if (list[i].user == user.fullName) {
			return true;
		}
	}
	return false;
}
 
module.exports = {
	// Signup for the script or video part of the lesson.
	signup: function(req, res) {
		if (req.method == "PUT") {
			if (req.session.user) {
				var user = req.session.user;
				var id = req.param("id");
				var signupType = req.param("signupType");
				
				Lesson.findOne({ "id": id }, function(err, lesson) {
					if (err) {
						res.json({ "error": err });
					}
					else if (lesson) {
						if (signupType == "script") {
							if (userInList(lesson.scriptList, user) == false) {
								lesson.scriptList.push({ "user": user.fullName, "school": user.school });
								lesson.scriptStatus = "In Progress";
								
								lesson.save(function(err) {
									if (err) {
										res.json({ "error": err });
									}
									else {
										res.json(lesson);
									}
								});
							}
							else {
								res.json({ "error": "User " + user.fullName + " is already signed up for " + lesson.title + " " + signupType + "." });
							}
						}
						else {
							if (userInList(lesson.videoList, user) == false) {
								lesson.videoList.push({ "user": user.fullName, "school": user.school });
								lesson.videoStatus = "In Progress";
								
								lesson.save(function(err) {
									if (err) {
										res.json({ "error": err });
									}
									else {
										res.json(lesson);
									}
								});
								
							}
							else {
								res.json({ "error": "User " + user.fullName + " is already signed up for " + lesson.title + " " + signupType + "." });
							}
						}
					}
					else {
						res.json({ "error": "Lesson " + id + " not found." });
					}
				});
			}
		}
	},
	
	create: function(req, res) {
		if (req.session.user) {
			var user = req.session.user;
			var title = req.param("title");
			var url = lessonTitleToURL(title);
			var lessonType = req.param("lessonType");
			var createdBy = req.param("createdBy");
			var newLesson = { "title": title, "url": url, "type": lessonType, "createdBy": user.fullName };
			
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
								// Create an application video to go along with the Principle or Strategy video
								newLesson.type = "Application";
								newLesson.parent = lesson.title;
								newLesson.parentType = lesson.type;
								
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
						});
				}
			});
		}
		else {
			res.json({ "error": "You must first login or signup to add a new lesson." });
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
				res.json({ "error": err });
			}
			
			lessonList = lessons;
			if (user) {
				for (var i = 0; i < lessonList.length; i++) {
					lesson = lessonList[i];
					scriptList = lesson.scriptList;
					videoList = lesson.videoList;
					
					for (var j = 0; j < scriptList.length; j++) {
						// If the user is in the list, they will not have a signup button.
						if (user.fullName == scriptList[j].user) {
							lesson.noScriptSignup = true;
						}
					}
					
					for (var j = 0; j < videoList.length; j++) {
						// If the user is in the list, they will not have a signup button.
						if (user.fullName == videoList[j].user) {
							lesson.noVideoSignup = true;
						}
					}
				}
			}
			
			res.json({ "lessons": lessonList });
		});
	},
	
	_config: {}
};
