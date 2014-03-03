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
	
	function lessonSignup(event) {
		event.preventDefault();
		
		if (user) { // If Logged-in user
			var cell = $(this).parent();
			var signupType = $(this).attr("data-type");
			var lessonRow = $(this).parent().parent();
			var title = lessonRow.attr("data-title");
			var id = lessonRow.attr("data-id");
			
			console.log(id, title, signupType);
			
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
							cell.html(newHtml);
						});
					}
					else {
						$.each(data.videoList, function(index, value) {
							newHtml += value.user + " " + value.school + "<br>";
							cell.html(newHtml);
						});
					}
				}
			});
		}
		else {  // Redirect to login
			$("section").hide();
			$("section.login").show();
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
			
			$("section").hide();
			$("#profile").hide();
			$("#register").show();
			$("section.lessons").show();
		});
	}); 
	
	
	$("a[href='/profile']").click(function(event) {
		event.preventDefault();
		
		$("section").hide();
		$("section.profile").show();
	}); 
	
	$("form.login, form.signup").submit(function(event) {
		event.preventDefault();
		var path = $(this).attr("action");
		
		$.post(path, $(this).serialize(), function(data) {
			console.log(data);
			
			if (data.error) {
				$("p.error").html(data.error);
			}
			else {
				user = data.user;
				setUserFields();
				
				$("#register").hide();
				$("#profile").show();
				$("section").hide();
				$("section.lessons").show();
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
	$("form.add-lesson").submit(function(event) {
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
				}
			});
		}
		else {  // Redirect to login
			$("section").hide();
			$("section.login").show();
		}
	});
	
	$("a.signup").click(lessonSignup);
});