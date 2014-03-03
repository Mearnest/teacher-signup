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

 function userInList(list, user) {
	if (!user) return false;  // abort
	
	for (var i=0; i<list.length; i++) {
		if (list[i].user == user.fullName) {
			return true;
		}
	}
	return false;
}
 
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
				
				res.view({ "user": req.session.user, "lessons": lessonList, "userInList": userInList });
			}
		});
		
	},
	
	test: function(req, res) {
		res.view();
	},
	
	_config: {}
};
