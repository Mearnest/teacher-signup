$(function() {
	// set user to the global account object, then undefine the global.
	var user = account;
	delete account;

	// Hold the current element which triggered a dialog box.
	var triggerElement = $("a.login"); 

	$(document).ready(function() {
		var path = document.location.pathname;
		
		if (user) { // If logged in
			setUserFields();
			$("#profile").show();
			
			// Only applies if putting urls in the url bar
			if (path == "/profile") {
				$("section").hide();
				$("section.profile").show();
			}
		}
		else { // if Logged out
			$("#register").show();
			
			// Only applies if putting urls in the url bar
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

	function loginRegisterSubmit(event) {
		event.preventDefault();
		var path = ($(this).hasClass("login") ? "/login" : "/register");
		var form = $(this);
		
		$.post(path, form.serialize(), function(data) {
			if (data.error) {
				$("p.error").html(data.error);
			}
			else {
				user = data.user;

				// Only teachers and admins can add lessons
				if (user.role !== "Teacher" && user.role !== "Admin") {
					$("a.add").hide();
				}
				
				refreshLessonList(function() {
					bindUserCancelSignup();
					bindAdminStatusChange();
					setUserFields();
					
					if (path === "/login") {
						$("section.login").dialog("close");
					}
					else {
						$("section.register").dialog("close");
					}
					
					form[0].reset();  // html reset fields in case user logs out and wishes to reuse form.
					$("p.error").html(""); // clear any old error messages
					
					$("#register").hide();
					$("#profile").show();

					if (path == "/register") {
						$("#message-title").html("Hello, " + user.firstName + ". You have created a new account.<br>An email was sent to you for your records.");
					}
					else {
						$("#message-title").html(user.firstName + ", you have logged in.");
					}
					
					$("section.message").dialog({ width: 'auto', height: 'auto', title: "Success!", position: { my: "right top", at: "right bottom", of: triggerElement }});
				});
			}
		});
	}

	function sendEmail(event) {
		event.preventDefault();
		var form = $(this);
		var path = "/contact"; // form.attr("action");
		
		$("p.contact.message").show(); // Sending message ...

		$.post(path, form.serialize(), function(data) {
			if (data.error) {
				$("p.error").html(data.error);
			}
			else {
				form[0].reset();  // html reset fields in case user logs out and wishes to reuse form.
				$("p.contact.message").hide();
				$("section.contact").dialog("close");
				
				var elem = (user ? $("a.profile") : $("a.login")); // The element to base the positioning of the dialog on.
				$("#message-title").html(data.message);
				$("section.message").dialog({ width: 'auto', height: 'auto', title: "Success!", position: { my: "left top", at: "left bottom", of: elem }});
			}
		});	
	}
	
	function setUserFields() {
		$("#fullName").html(user.fullName);
		$("#email a").attr("href", "mailto:" + user.email);
		$("#email a").text(user.email);
		$("#role").html("Role: " + user.role);
		$("#school").html("School: " + user.school);
		
		$.get("/profile", function(data) {
			var newHTML = "";
			
			$.each(data.lessonsCreated, function(index, lesson) {
				newHTML += '<span class="' + lesson.type + '">' + lesson.title + " " + lesson.type + "</span><br>";
			});
			$(".info.lessons-created > .content").html(newHTML);
			
			newHTML = "";
			$.each(data.scripts, function(index, lesson) {
				newHTML += '<span class="' + lesson.type + '">' + lesson.title + " " + lesson.type + "</span><br>";
			});
			$(".info.scripts > .content").html(newHTML);
			
			newHTML = "";
			$.each(data.videos, function(index, lesson) {
				newHTML += '<span class="' + lesson.type + '">' + lesson.title + " " + lesson.type + "</span><br>";
			});
			$(".info.videos > .content").html(newHTML);
		});
	}

	function signupHTML() {
		return '<a href="#signup" class="signup btn btn-default"><span class="glyphicon glyphicon-pencil"></span>&nbsp;Sign Up!</a>';
	}

	function cancelSignupHTML() {
		return '<span class="pull-right glyphicon glyphicon-remove"></span>';
	}
	
	// When Logging in our out, need to refresh the list of lessons.
	// This is so the right signup buttons show up.
	function refreshLessonList(callback) {
		$.get("/lesson/list", function(data) {
			if (data.error) {
				console.log("error: " + data.error);
			}
			else {
				try {
					var row, scriptCell, videoCell;
					var scripts, videos, newHTML;
					
					$.each(data.lessons, function(index, lesson) {
						row = $("tr[data-id='" + lesson.id + "']");
						scriptCell = $("td.script", row);
						videoCell = $("td.video", row);
						scripts = lesson.scriptList;
						videos = lesson.videoList;
						
						newHtml = "";
						if (lesson.script) {
							newHtml = lesson.script;
							if (lesson.scriptStatus != "Completed" && (user && lesson.script.match(user.fullName))) {
								newHtml += cancelSignupHTML();
							}

						}
						else if(lesson.scriptStatus != "Completed") {
							newHtml += signupHTML();
						}
						scriptCell.html(newHtml);
						
						newHtml = "";
						if (lesson.video) {
							newHtml = lesson.video;
							if (lesson.videoStatus != "Completed" && (user && lesson.video.match(user.fullName))) {
								newHtml += cancelSignupHTML();
							}

						}
						else if(lesson.videoStatus != "Completed") {
							newHtml += signupHTML();
						}
						videoCell.html(newHtml);
					});
				}
				catch(error) {
					console.log(error);
				}
				
				// Reassign signup events.
				$("a.signup").click(lessonSignup);
				bindUserCancelSignup();

				callback(); // show/hide relevant sections and divs
			}
		});
	}

	function addLesson(event) {
		event.preventDefault();
		var form = $(this);
		var path = form.attr("action");
		
		$.post(path, form.serialize(), function(data) {
			if (data.error) {
				$("p.error", form.parent()).html(data.error);
			}
			else {
				console.log(data);
				var lesson = data.lesson;
				var application = data.application;
				var created = new Date().toTFLString();
				var table, newRow;
				var addBtn; // element that trigged this event
				
				if (lesson.type == "Principle") {
					table = $("table.principles");
					addBtn = $("a.add.principle");
				}
				else {
					table = $("table.strategies");
					addBtn = $("a.add.strategy");
				}
				
				// This won't work if there isn't a prexisting lesson row 1 (not the theader row).
				// Prepend a new data row for the new Principle or Strategy Lesson
				newRow = $("tr.clone", table).clone();
				newRow.removeClass("clone");
				newRow.attr("data-id", lesson.id);
				newRow.attr("data-title", lesson.title);
				$("td.title", newRow).html(lesson.title);
				$("td.created", newRow).html(created);
				$("a.signup", newRow).on("click", lessonSignup);
				table.prepend(newRow);
				table.trigger("update");
				
				if (application) {
					// Prepend the accompanying Applicaiton Lesson row.
					table = $("table.applications");
					newRow = $("tr.clone", table).clone();
					newRow.removeClass("clone");
					newRow.attr("data-id", application.id);
					newRow.attr("data-title", application.title);
					$("td.title", newRow).html(application.title + " " + application.parentType);
					$("td.created", newRow).html(created);
					$("a.signup", newRow).on("click", lessonSignup);
					table.prepend(newRow);
					table.trigger("update");
				}
				
				$("p.error", form).html(""); // Clear any error messages
				form[0].reset();  // Clear input field
				$("section.add-lesson").dialog("close");

				$("#message-title").html("Lesson " + lesson.title + " added.");
				$("section.message").dialog({ width: 'auto', height: 'auto', title: "Success!", position: { my: "left top", at: "left bottom", of: addBtn }});
			}
		});
	}
	
	function lessonSignup(event) {
		event.preventDefault();
		var signupBtn = $(this);
		var cell = signupBtn.parent();
		var row = cell.parent();
		var lessonId = row.attr("data-id");
		var lessonTitle = row.attr("data-title");
		var lessonType = cell.hasClass("script") ? "script" : "video";

		if (user) {
			$("#signup-title").html(lessonTitle + " " + lessonType);
			$("section.signup").dialog({ width: 'auto', height: 'auto', title: "Sign-up?", position: { my: "left top", at: "left bottom", of: $(this) }});

			$("input.signup.ok").click(function(event) {
				$.ajax({
					url: "/lesson/signup/" + lessonId,
					type: 'PUT',
					data: { "signupType": lessonType, "_csrf": $("input.csrf").val() },
					success: function(data) {
						var newHtml = "";
						
						if (data.error) {
							$("span.error", cell).html(data.error);
						}
						else if (lessonType == "script") {
							newHtml += data.script;
							newHtml += cancelSignupHTML();
							cell.html(newHtml);

							cell.next().html(data.scriptStatus);
						}
						else {
							newHtml += data.video;
							newHtml += cancelSignupHTML();
							cell.html(newHtml);

							cell.next().html(data.videoStatus);
						}

						// Bind new cell events.
						bindUserCancelSignup();
						bindAdminStatusChange();
						
						$("input.signup.ok").unbind("click"); // Prevent stacking
						$("section.signup").dialog("close");

						$("#message-title").html("You have signed up.");
						$("section.message").dialog({ width: 'auto', height: 'auto', title: "Success!", position: { my: "left top", at: "left bottom", of: cell }});
					}
				});
			});
		}
		else {
			triggerElement = cell;
			$("section.login").dialog({ width: 'auto', height: 'auto', title: "Login", position: { my: "left top", at: "left bottom", of: cell }});
		}
	}

	function bindUserCancelSignup() {
		$("span.glyphicon-remove").unbind("click"); // Prevent stacking
		$("span.glyphicon-remove").click(function(event) {
			var cell = $(this).parent();
			var row = cell.parent();
			var lessonId = row.attr("data-id");
			var lessonTitle = row.attr("data-title");
			var lessonType = cell.hasClass("script") ? "script" : "video";

			$("#signup-title").html(lessonTitle + " " + lessonType);
			$("section.signup").dialog({ width: 'auto', height: 'auto', title: "Unsign-up?", position: { my: "left top", at: "left bottom", of: $(this) }});

			$("input.signup.ok").unbind("click"); // Prevent stacking
			$("input.signup.ok").click(function(event) {
				$.ajax({
					url: "/lesson/cancel/signup/" + lessonId,
					type: 'PUT',
					data: { "signupType": lessonType, "_csrf": $("input.csrf").val() },
					success: function(data) {
						if (data.error) {
							$("p.error").html(data.error);
						}
						else {
							cell.html(signupHTML());
							cell.next().html(""); // change the status to not started
						}

						// Bind new cell events.
						bindAdminStatusChange();
						$("a.signup", cell).click(lessonSignup);
						
						$("input.signup.ok").unbind("click"); // Prevent stacking
						$("section.signup").dialog("close");

						$("#message-title").html("You have unsigned up.");
						$("section.message").dialog({ width: 'auto', height: 'auto', title: "Success!", position: { my: "left top", at: "left bottom", of: cell }});
					}
				});
			});
		});
	}
	
	function saveLessonStatus(event) {
		var cell = $(this).parent();
		var statusField = $(this);
		var status = statusField.val();
		var lessonId = cell.parent().attr("data-id");
		var path = "/lesson/" + lessonId;
		var update = { "_csrf": $("input.csrf").val() };
		
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
				var signupCell = cell.prev();

				if (status === "Completed") {  // no need to signup, so remove it
					// Remove signup and cancel signup
					var newHtml = signupCell.html().replace(/\<a href.*\<\/a\>/, "");
					var newHtml = signupCell.html().replace(/\<span.*\<\/span\>/, "");
					signupCell.html(newHtml);
				}
				else {
					var html = signupCell.html();
					// Add the signup or cancel signup actions if missing.
					if (html === "") {
						signupCell.html(signupHTML());
						$("a.signup", signupCell).click(lessonSignup);
					}
					if (html.match(user.fullName) && !html.match("glyphicon-remove") && !html.match("a.signup")) {
						signupCell.append(cancelSignupHTML());
						bindUserCancelSignup();
					}
				}
				cell.html(status);
				cell.click(addSelectStatus);  // rebind select status

				$("#message-title").html("You have changed the status.");
				console.log(cell, signupCell);
				$("section.message").dialog({ width: 'auto', height: 'auto', title: "Success!", position: { my: "left top", at: "left bottom", of: cell }});
			}
		});
	};
	
	function cancelLessonStatus(event) {
		event.preventDefault();
		
		var cell = $(this).parent();
		var status = cell.attr("data-status");
		
		cell.html(status);
		
		// Need a little bit of time to rebind cell click or we never get to reset to just the status.
		setTimeout(function() { cell.click(addSelectStatus); 50});
	};
	
	function addSelectStatus(event) {
		if (!$(this).html().match(/select/)) { // If the select input field isn't already there
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
	
	//  Assign event handlers
	$("a[href='/']").click(function(event) {
		event.preventDefault();
		
		$("section").hide();
		$("section.lessons").show();
	}); 
	
	$("a.login").click(function(event) {
		event.preventDefault();
		
		triggerElement = $("a.logout");
		$("p.error").html(""); // clear existing errors
		$("section.login").dialog({ width: 'auto', height: 'auto', title: "Login", position: { my: "left top", at: "left bottom", of: $(this) }});
	}); 
	
	$("a.logout").click(function(event) {
		event.preventDefault();
		
		$.get("/logout", function(data) {
			user = null;
			$("a.add").show(); // In case the add lesson buttons were hidden for a Student account

			refreshLessonList(function() {
				$("td.script-status, td.video-status").unbind("click");
				$("td.script-status, td.video-status").removeClass("change-status");
				
				// Clear profile lists
				$(".info.lessons-created > .content").html("");
				$(".info.scripts > .content").html("");
				$(".info.videos > .content").html("");
				
				$("#profile").hide();
				$("#register").show();

				$("#message-title").html("You logged out.");
				$("section.message").dialog({ width: 'auto', height: 'auto', title: "Success!", position: { my: "left top", at: "left bottom", of: $("a.login") }});
			});
		});
	}); 

	$("a.register").click(function(event) {
		event.preventDefault();

		triggerElement = $("a.profile");
		$("p.error").html(""); // clear existing errors
		$("section.register").dialog({ width: 'auto', height: 'auto', title: "Create Account", position: { my: "left top", at: "left bottom", of: $("a.login") }});
	}); 
	
	
	$("a.contact").click(function(event) {
		event.preventDefault();

		var elem = (user ? $(this) : $("a.login")); // The element to base the positioning of the dialog on.
		$("section.contact").dialog({ width: 'auto', height: 'auto', title: "Contact Us", position: { my: "left top", at: "left bottom", of: elem }});
	});

	$("a.profile").click(function(event) {
		event.preventDefault();

		setUserFields();  // Make sure latest info is loaded
		$("section.profile").dialog({ width: '350', height: '500', title: user.fullName, position: { my: "left top", at: "left bottom", of: $(this) }});
	}); 

	$("a.add").click(function(event) {
		event.preventDefault();
		var lessonType = $(this).attr("data-type");
		var section = $("section.add-lesson");

		if (user) {
			$("input.lesson", section).attr("placeholder", lessonType);
			$("input.lesson-type", section).val(lessonType);

			section.dialog({ width: 'auto', title: "Add Lesson", position: { my: "left top", at: "left bottom", of: $(this) }});
		}
		else {
			triggerElement = $(this);
			$("section.login").dialog({ width: 'auto', height: 'auto', title: "Login", position: { my: "left top", at: "left bottom", of: $(this) }});
		}
	});

	$("a.login-create-account").click(function(event) {
		event.preventDefault();

		// Reset because there is no logout
		if (triggerElement.is($("a.logout"))) {
			triggerElement = $("a.login");
		}

		$("section.login").dialog("close");
		$("section.register").dialog({ width: 'auto', height: 'auto', title: "Create Account", position: { my: "left top", at: "left bottom", of: triggerElement }});
		
	});

	$("input.cancel").click(function(event) {
		// Errors out on closing the wrong dialog. This is a catch-all.
		var section = $(this).parent().parent().parent();

		try {
			section.dialog("close");
		}
		catch(error) { 
			section = $(this).parent();
			section.dialog("close");
		};

		$("input.signup.ok").unbind("click"); // Prevent stacking of signing up for a lesson.
	});

	$("a.signup").click(lessonSignup);

	

	$("a.print").click(function(event) {
		event.preventDefault();

		window.print();
	});

	$("form.login, form.register").submit(loginRegisterSubmit);

	$("form.contact").submit(sendEmail);
	
	// Add a new Principle or Strategy Lesson
	$("form.add-lesson").submit(addLesson);

	bindUserCancelSignup();
	bindAdminStatusChange();

	// These need to be assigned before the form add-lesson submit handler.
	$("table.lesson-list").tablesorter({
		textExtraction: 'complex'  // handle html, dates?
	}); 

	// Change sort glyph depending on what sort state the table is in.
	$("th").click(function(event) {
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

	// Sticky table Headers
	var principleTop = $("table.principles").offset().top;
	var strategyTop = $("table.strategies").offset().top - 105;
	var applicationTop = $("table.applications").offset().top - 80;

  	var stickyWidth = $("table.principles").width();
  	var stickyColWidths = [];
  	$("table.principles th").each(function(index, col) {
  		stickyColWidths[index] = $(col).width();
  	});

	var stickyHeader= function(header, table1, table2) {  
		var scrollTop = $(window).scrollTop();  
	     
		if (scrollTop > table1 && scrollTop < table2) {   
			$(header).addClass("sticky");
			
			$(header + " th").each(function(index, col) {
		  		$(col).css("width", stickyColWidths[index] + (16 + index));
		  	});	
		} else {  
			$(header).removeClass("sticky");   
		}
	}; 
	  
	$(window).scroll(function() {  
	    stickyHeader("table.principles thead", principleTop, strategyTop); 
	    stickyHeader("table.strategies thead", strategyTop, applicationTop);
	    stickyHeader("table.applications thead", applicationTop, $("section.lessons").height());
	});
});