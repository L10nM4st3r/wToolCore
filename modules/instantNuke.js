/*
	Module script
	This module adds a "template user" button to the tools dropdown
*/
// Dependancies: lib/editTools.js, core/settings.js, lib/userFeedback.js, lib/form.js

wToolCore.showNukeUserUI = function() {
	function onConfirmed(dialog) {
		dialog.close();
		var user_was_blocked = false;
		var reason = "Nuking all \"contributions\" of this user.";


		async function do_revert(out) {
			var deletedPages = [];
			var pages = 0;
			var revdel_revisions = [];

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
						deletedPages.push(page.pageid);
						wToolCore.deletePageId(page.pageid, reason, true).done(processUsercontrib.bind(null, i, 1));
						return;
					}
					else if ("top" in page && !(page.pageid in deletedPages)) {
						wToolCore.rollbackRevid(page.revid, reason).done(processUsercontrib.bind(null, i, 1));
						return;
					}
				}

				revdel_revisions.push(page.revid);
				pages ++;
				if (((pages == 500) || (i == out.query.usercontribs.length - 1)) && stage < 2) {
					console.log("Rev-del stage enters")
					pages = 0;
					wToolCore.revDel(revdel_revisions.join("|"), reason).done(processUsercontrib.bind(null, i, 2));
					revdel_revisions = [];
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
		}).done(function(out) {
			do_revert(out);
		})
		
	}

	wToolCore.createForm("Nuke user",
		[
			{type: "label", text: "Are you sure you want to nuke this user?\n\nThis will revert all their unpatrolled edits, delete all their pages, and ban them."}
		],
		{
			onSubmit: onConfirmed,
			cancelText: "Nevermind",
		}
	);
}



if (mw.config.get("wgRelevantUserName") && wToolCore.settings.USER_IS_ACTUALLY_ADMIN) {
	wToolCore.addToolButton("ca-nukeUser", "Nuke User Contribs", "Completely obliterates this user and all their \"contributions\".", wToolCore.showNukeUserUI);
}
