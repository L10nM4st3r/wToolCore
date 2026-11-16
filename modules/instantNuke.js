/*
	Module script
	This module adds a "template user" button to the tools dropdown
*/
// Dependancies: lib/editTools.js, core/settings.js, lib/userFeedback.js, lib/form.js

wToolCore.showNukeUserUI = function () {
	function onConfirmed(dialog) {
		dialog.close();
		var user_was_blocked = false;
		var reason = "Nuking all \"contributions\" of this user.";


		function do_revert(out) {
			var deletedPages = [];
			var pages = 0;
			var revdel_revisions = {};
			function addRevision(pageid, revid) {
				if (!revdel_revisions[pageid]) {
					revdel_revisions[pageid] = [];
				}
				revdel_revisions[pageid].push(revid);
			}

			// Loops through contribs.. Ensures that rev-dells are done AFTER reverts
			function processUsercontrib(i, stage) {
				if (i >= out.query.usercontribs.length) {
					wToolCore.displaySuccess("User was nuked.");
					return;
				}

				var page = out.query.usercontribs[i];

				if (!user_was_blocked) {
					user_was_blocked = true;
					if (page.userid == 0) { // IP address
						wToolCore.banUserNukeMode(mw.config.get("wgRelevantUserName"), reason, "1 year");
					}
					else { // Logged in
						wToolCore.banUserNukeMode(mw.config.get("wgRelevantUserName"), reason, "never");
					}
				}

				if (stage < 1) {
					console.log("Revert stage enters")
					if ("new" in page) {
						wToolCore.deletePageId(page.pageid, reason, true).done(processUsercontrib.bind(null, i, 1));
						return;
					}
					else if ("top" in page && !(page.pageid in deletedPages)) {
						wToolCore.rollbackRevid(page.revid, reason).done(processUsercontrib.bind(null, i, 1));
						addRevision(page.pageid, page.revid);
						return;
					} else {
						addRevision(page.pageid, page.revid);
					}
				}

				pages++;
				if (((pages == 500) || (i == out.query.usercontribs.length - 1)) && stage < 2) {
					for (var key in revdel_revisions) {
						wToolCore.revDel(revdel_revisions[key].join("|"), reason).done(processUsercontrib.bind(null, i, 2));
					}


					console.log("Rev-del stage enters")
					pages = 0;
					revdel_revisions = {};
					return;
				}

				processUsercontrib(i + 1, 0);
			}

			// Start processing from the first item.
			processUsercontrib(0, 0);
		}

		new mw.Api().get({
			"action": "query",
			"format": "json",
			"list": "usercontribs",
			"uclimit": "5000",
			"ucstart": "2000-11-14T19:13:03.000Z", // Ensures FIRST edit comes first
			"ucuser": mw.config.get("wgRelevantUserName"),
			"ucdir": "newer",
			"ucprop": "ids|flags",
			"ucshow": "!patrolled|!autopatrolled"
		}).done(function (out) {
			do_revert(out);
		})

	}

	wToolCore.createForm("Nuke user",
		[
			{ type: "label", text: "Are you sure you want to nuke this user?\n\nThis will revert all their unpatrolled edits, delete all their pages, and ban them." }
		],
		{
			onSubmit: onConfirmed,
			cancelText: "Nevermind",
		}
	);
}



if (mw.config.get("wgRelevantUserName") && wToolCore.settings.USER_IS_ACTUALLY_ADMIN && mw.config.get('wgCanonicalSpecialPageName') === "Contributions") {
	wToolCore.addToolButton("ca-nukeUser", "Nuke user", "Completely obliterates this user and all their \"contributions\".", wToolCore.showNukeUserUI);
}



// Non-admin version of this feature

if (mw.config.get('wgCanonicalSpecialPageName') === "Contributions") {
	var createRollbackForm = function (rollbackAction, title) {
		wToolCore.createForm(title, [{
			name: "reason",
			type: "textbox",
			placeholder: "Reason...",
			value: wToolCore.settings.ROLLBACK_ALL_DEFAULT_REASON,
			text: "Rollback Reason"
		}],
			{
				onSubmit: function (dialouge) {
					var reason = dialouge.reason.value.trim();
					rollbackAction(reason, dialouge);
				},
				submitText: "Do Rollback"
			});
	};

	// Rollbacks all edits on the page
	var rollbackEverything = function (editSummary, onComplete) {
		if (editSummary === null)
			return;
		var list = [];
		$("a[href*='action=rollback']").each(function (ind, el) {
			list.push(el);
		});
		var index = 0;
		function doNext() {
			clearTimeout();
			rollbackOneThing(list[index], editSummary, function () {
				if (index < list.length) setTimeout(doNext, 100);
				else onComplete();
			});
			index++;
		}
		doNext();
	};

	// Rollbacks all selected edits on the page
	var rollbackSelected = function (editSummary, onComplete) {
		if (editSummary === null)
			return;
		var rollbackList = $("input.revdelIds:checked").parents("li.mw-contributions-current").find("a[href*='action=rollback']");
		if (rollbackList.length <= 0)
			return mw.notify("You didn't select any edits that could be rolled back!");
		var list = [];
		$("input.revdelIds:checked").parents("li.mw-contributions-current").find("a[href*='action=rollback']").each(function (ind, el) {
			list.push(el);
		});
		var index = 0;
		function doNext() {
			clearTimeout();
			rollbackOneThing(list[index], editSummary, function () {
				if (index < list.length) setTimeout(doNext, 100);
				else onComplete();
			});
			index++;
		}
		doNext();
	};

	// Helper to rollback a single edit
	var rollbackOneThing = function (edit, editSummary, done) {
		editSummary = wToolCore.do_default(editSummary, "");

		var userName;
		// If we're in an anonymous IP range, we have to figure out each username on its own, since they might be different for each edit.
		if (mw.config.get("wgRelevantUserName") === null)
			userName = $(edit).parents("li:first").children("a.mw-anonuserlink").not(".mw-contributions-title").text();
		else
			userName = mw.config.get("wgRelevantUserName");
		wToolCore.rollbackEdit(/title=([^&]+)/.exec(edit.href)[1], userName, editSummary).done(done);
	};

	// Only add rollback links if there is at least one rollback link present.
	if ($("span.mw-rollback-link").length > 0) {
		// Gets every edit entry, and adds a checkbox to the start of a line.
		// Also stores the revid of the edit.
		if ($("ul.mw-contributions-list .mw-revdelundel-link").length > 0)
			$("ul.mw-contributions-list .mw-revdelundel-link").each(function (ind, el) {
				if ($(this).children("a").length > 0) {
					var revId = /ids=(\d+)/.exec($(this).children("a").attr("href"))[1];
					var pageTitle = /target=([^&]+)/.exec($(this).children("a").attr("href"))[1];
					$(el).prepend("<input type='checkbox' name='" + decodeURIComponent(pageTitle) + "' class='revdelIds' value='" + revId + "'>&nbsp;");
					$(el).children(".revdelIds").data("index", ind);
				}
			});
		else $("ul.mw-contributions-list a.mw-changeslist-date").each(function (ind, el) {
			$(el).before("<input type='checkbox' class='revdelIds'>&nbsp;");
		});

		// Add button to rollback all edits.
		function rollback_all() {
			createRollbackForm(function (reason, dialouge) {
				rollbackEverything(wToolCore.settings.ROLLBACK_ALL_EDIT_SUMMARY.replace("{reason}", reason ? " - " + reason : "") + wToolCore.settings.EDIT_SUMMARY_AD, function () { dialouge.close(); location.reload(); });
			}, "Rollback All");
		}
		wToolCore.addToolButton("ca-rollbackAll", "rollback all", "rollback all edits displayed here", rollback_all);
		
		
		$("a[href*='action=rollback']").each(function (ind, el) {
			el.addEventListener("click", function (event) {
				event.preventDefault();
				rollbackOneThing(el);
			});
		});

		// Add button to rollback all selected edits.
		function rollback_selected() {
			createRollbackForm(function (reason, dialouge) {
				rollbackSelected(wToolCore.settings.ROLLBACK_ALL_EDIT_SUMMARY.replace("{reason}", reason ? " - " + reason : "") + wToolCore.settings.EDIT_SUMMARY_AD, function () { dialouge.close(); location.reload(); });
			}, "Rollback Selected");
		}
		var rollbackSome = wToolCore.addToolButton("ca-rollbackSelected", "rollback selected", "rollback selected edits", rollback_selected);
	}


	// Add button to allow undoing an edit with a single click.
	// $("li[class*='mw-contributions-current']").each(function (ind, el) {
	// 	var diff = el.getAttribute("data-mw-revid");
	// 	if (el.className.indexOf("mw-tag") > -1)
	// 		$(el).find("span[class*='mw-tag-markers']").before("<span>[<a id=\"undoEditAll-" + diff + "\">undo</a>]</span> ");
	// 	else
	// 		$(el).append("<span>[<a id=\"undoEditAll-" + diff + "\">undo</a>]</span>");

	// 	var undoButton = document.getElementById("undoEditAll-" + diff);
	// 	undoButton.addEventListener("click", function (event) {
	// 		event.preventDefault();
	// 		undoRevid(diff).done(function () {
	// 			undoButton.parentElement.innerHTML = "[<strong>reverted</strong>]";
	// 		});
	// 	});
	// });
}
