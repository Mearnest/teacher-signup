$(function() {
	// set user to the global account object, then undefine the global.
	var user = account;
	account = undefined;
	
	function setUserFields() {
		$("#fullName").html(user.fullName);
		$("#email a").attr("href", "mailto:" + user.email);
		$("#email a").text(user.email);
		$("#role").html(user.role);
		$("#school").html(user.school);
		
		$.get("/profile", function(data) {
			var newHTML = "";
			
			$.each(data.lessonsCreated, function(index, lesson) {
				newHTML += lesson.title + " " + lesson.type + "<br>";
				
			});
			$(".info.lessons-created").append(newHTML);
			newHTML = "";
			
			$.each(data.scripts, function(index, lesson) {
				newHTML += lesson.title + " " + lesson.type + "<br>";
				
			});
			$(".info.scripts").append(newHTML);
			newHTML = "";
			
			$.each(data.videos, function(index, lesson) {
				newHTML += lesson.title + " " + lesson.type + "<br>";
				
			});
			$(".info.videos").append(newHTML);
		});
	}
	
	function addLesson(event) {
		event.preventDefault();
		
		// Only logged in users are allowed to add new lessons.
		if (user) {  // If user is logged in
			var form = $(this);
			var path = form.attr("action");
			
			$.post(path, form.serialize(), function(data) {
				if (data.error) {
					console.log("error", data.error);
					$("span.error", form.parent()).html(data.error);
				}
				else {
					var lesson = data.lesson;
					var application = data.application;
					var table;
					var newRow;
					
					if (lesson.type == "Principle") {
						table = $("table.principles");
					}
					else {
						table = $("table.strategies");
					}
					
					// This won't work if there isn't a prexisting lesson row 1 (not the theader row).
					// Prepend a new data row for the new Principle or Strategy Lesson
					newRow = $("tr.clone", table).clone();
					newRow.removeClass("clone");
					newRow.attr("data-id", lesson.id);
					newRow.attr("data-title", lesson.title);
					$("td.title", newRow).html(lesson.title);
					$("a.signup", newRow).on("click", lessonSignup);
					table.prepend(newRow);
					table.trigger("update");
					
					// Prepend the accompanying Applicaiton Lesson row.
					table = $("table.applications");
					newRow = $("tr.clone", table).clone();
					newRow.removeClass("clone");
					newRow.attr("data-id", application.id);
					newRow.attr("data-title", application.title);
					$("td.title", newRow).html(application.title + " (" + application.parentType + ")");
					$("a.signup", newRow).on("click", lessonSignup);
					table.prepend(newRow);
					table.trigger("update");
					
					$("span.error").html(); // Clear any error messages
					$("input.lesson", form).val("");  // Clear input field
				}
			});
		}
		else {  // Redirect to login
			$("div.popup").html('<h3>In order to add a lesson, you need to be logged in. If you do not have an account yet, signup for one in the upper right hand corner.</h3>');
			$("div.popup").dialog({ width: '600', title: "Login or Signup" });
			
			$("section").hide();
			$("section.login").show();
		}
	}
	
	function lessonSignup(event) {
		event.preventDefault();
		
		if (user) { // If Logged-in user
			var cell = $(this).parent();
			var signupType = $(this).attr("data-type");
			var lessonRow = $(this).parent().parent();
			var title = lessonRow.attr("data-title");
			var id = lessonRow.attr("data-id");
			
			$.ajax({
				url: "/lesson/signup/" + id,
				type: 'PUT',
				data: { "signupType": signupType },
				success: function(data) {
					var newHtml = "";
					
					if (data.error) {
						$("span.error", cell).html(data.error);
					}
					else if (signupType == "script") {
						$.each(data.scriptList, function(index, value) {
							newHtml += value.user + " " + value.school + "<br>";
						});
						cell.html(newHtml);
						cell.next().html(data.scriptStatus);
					}
					else {
						$.each(data.videoList, function(index, value) {
							newHtml += value.user + " " + value.school + "<br>";
						});
						cell.html(newHtml);
						cell.next().html(data.videoStatus);
					}
				}
			});
		}
		else {  // Redirect to login
			$("div.popup").html('<h3>In order to signup to produce a lesson script or video, you need to be logged in. If you do not have an account yet, signup for one in the upper right hand corner.</h3>');
			$("div.popup").dialog({ width: '600', title: "Login or Signup" });
			
			$("section").hide();
			$("section.login").show();
		}
	}
	
	// When Logging in our out, need to refresh the list of lessons.
	// This is so the right signup buttons show up.
	function refreshLessonList(callback) {
		$.get("/lesson/list", function(data) {
			if (data.error) {
				console.log("error: " + data.error);
			}
			else {
				var row, scriptCell, videoCell;
				var scripts, videos, newHTML;
				
				$.each(data.lessons, function(index, lesson) {
					row = $("tr[data-id='" + lesson.id + "']");
					scriptCell = $("td.script", row);
					videoCell = $("td.video", row);
					scripts = lesson.scriptList;
					videos = lesson.videoList;
					
					newHtml = "";
					for (i = 0; i < scripts.length; i++) {
						newHtml += scripts[i].user + " at " + scripts[i].school + "<br>";
					}
					if (!lesson.noScriptSignup) {
						newHtml += '<a href="#signup" data-type="script" class="signup btn btn-default"><span class="glyphicon glyphicon-pencil">&nbsp;</span>Signup</a>';
					}
					scriptCell.html(newHtml);
					
					newHtml = "";
					for (i = 0; i < videos.length; i++) {
						newHtml += videos[i].user + " at " + videos[i].school + "<br>";
					}
					if (!lesson.noVideoSignup) {
						newHtml += '<a href="#signup" data-type="video" class="signup btn btn-default"><span class="glyphicon glyphicon-pencil">&nbsp;</span>Signup</a>';
					}
					videoCell.html(newHtml);
				});
				
				// Reassign signup events.
				$("a.signup").click(lessonSignup);
				callback(); // show/hide relevant sections and divs
			}
		});
	}
	
	function saveLessonStatus(event) {
		var cell = $(this).parent();
		var statusField = $(this);
		var status = statusField.val();
		var lessonId = cell.parent().attr("data-id");
		var path = "/lesson/" + lessonId;
		var update = {};
		
		if (cell.hasClass("script-status")) {
			update.scriptStatus = status;
		}
		else {
			update.videoStatus = status;
		}
		
		$.ajax({
			url: path,
			type: "PUT",
			data: update,
			success: function(data) {
				cell.html(status);
				cell.click(addSelectStatus);  // rebind select status
			}
		});
	};
	
	function cancelLessonStatus(event) {
		event.preventDefault();
		
		var cell = $(this).parent();
		var status = cell.attr("data-status");
		
		console.log(status);
		cell.html(status);
		
		// Need a little bit of time to rebind cell click or we never get to reset to just the status.
		setTimeout(function() { cell.click(addSelectStatus); 50});
	};
	
	function addSelectStatus(event) {
		if (!$(this).html().match(/select/)) {
			var status = $(this).text();
			$(this).attr("data-status", status);  // store the status for later retrieval
			
			var selectHTML = '<select class="status" name="status">';
				if (status == "") {
					selectHTML += '<option value="" selected>Not Started</option>';
				}
				else {
					selectHTML += '<option value="">Not Started</option>';
				}
				if (status == "In Progress") {
					selectHTML += '<option value="In Progress" selected>In Progress</option>';
				}
				else {
					selectHTML += '<option value="In Progress">In Progress</option>';
				}
				if (status == "Completed") {
					selectHTML += '<option value="Completed" selected>Completed</option>';
				}
				else {
					selectHTML += '<option value="Completed">Completed</option>';
				}
				
			selectHTML += '</select>';
			selectHTML += '<a class="cancel btn btn-info" href="#cancel">Cancel</a>';
			
			$(this).html(selectHTML);
			$("select.status", $(this)).change(saveLessonStatus);
			
			$(this).unbind("click");
			$("a.cancel", $(this)).click(cancelLessonStatus);
		}
	}
	
	function bindAdminStatusChange() {
		if (user && user.role === "Admin") {
			$("td.script-status, td.video-status").click(addSelectStatus);
			$("td.script-status, td.video-status").addClass("change-status");
		}
	}
	
	
	$(document).ready(function() {
		var path = document.location.pathname;
		console.log(path, user);
		
		if (user) { // If logged in
			setUserFields();
			$("#profile").show();
			
			if (path == "/profile") {
				$("section").hide();
				$("section.profile").show();
			}
		}
		else { // if Logged out
			$("#register").show();
			
			if (path == "/login") {
				$("section").hide();
				$("section.login").show();
			}
			else if(path == "/signup") {
				$("section").hide();
				$("section.signup").show();
			}
		}
	});
	
	//  Assign event handlers
	$("a[href='/']").click(function(event) {
		event.preventDefault();
		
		$("section").hide();
		$("section.lessons").show();
	}); 
	
	$("a[href='/signup']").click(function(event) {
		event.preventDefault();
		
		$("section").hide();
		$("p.error").html(""); // clear existing errors
		$("section.signup").show();
		$("firstName").focus();
	}); 
	
	$("a[href='/login']").click(function(event) {
		event.preventDefault();
		
		$("section").hide();
		$("p.error").html(""); // clear existing errors
		$("section.login").show();
		$("loginName").focus();
	}); 
	
	$("a[href='/logout']").click(function(event) {
		event.preventDefault();
		
		$.get("/logout", function(data) {
			user = null;
			refreshLessonList(function() {
				$("td.script-status, td.video-status").unbind("click");
				$("td.script-status, td.video-status").removeClass("change-status");
				$("#profile").hide();
				$("#register").show();
				$("section").hide();
				$("section.lessons").show();
			});
		});
	}); 
	
	
	$("a[href='/profile']").click(function(event) {
		event.preventDefault();
		setUserFields();  // Make sure latest info is loaded
		$("section").hide();
		$("section.profile").show();
	}); 
	
	$("form.login, form.signup").submit(function(event) {
		event.preventDefault();
		var path = $(this).attr("action");
		
		$.post(path, $(this).serialize(), function(data) {
			if (data.error) {
				$("p.error").html(data.error);
			}
			else {
				user = data.user;
				setUserFields();
				
				refreshLessonList(function() {
					bindAdminStatusChange();
					
					try {
						// Mayber ther eis a better way to test if a dialog has been instantiated?
						$("div.popup").dialog("close");
					}
					catch(err) {  /* do noting */ }
					
					$("#register").hide();
					$("#profile").show();
					$("section").hide();
					$("section.lessons").show();
				});
			}
		});
	});
	
	// Change sort glyph depending on what sort state the table is in.
	$("th.lesson-type").click(function(event) {
		var span = $("span", $(this));
		
		if (span.hasClass("glyphicon-sort")) {
			span.removeClass("glyphicon-sort");
			span.addClass("glyphicon-sort-by-alphabet");
		}
		else if (span.hasClass("glyphicon-sort-by-alphabet")) {
			span.removeClass("glyphicon-sort-by-alphabet");
			span.addClass("glyphicon-sort-by-alphabet-alt");
		}
		else {
			span.removeClass("glyphicon-sort-by-alphabet-alt");
			span.addClass("glyphicon-sort-by-alphabet");
		}
	});
	
	// These need to be assigned before the form add-lesson submit handler.
	$("table.lesson-list").tablesorter({ 
		// Disable sorting on the second column (add lesson colspan=4)
		headers: { 1: {sorter: false} }
	}); 
	
	// Add a new Principle or Strategy Lesson
	$("form.add-lesson").submit(addLesson);
	
	$("a.signup").click(lessonSignup);
	
	bindAdminStatusChange();
});