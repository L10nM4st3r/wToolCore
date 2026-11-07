/*
	Module script
	This module add helpful tools for page moving.
*/
// Dependancies: core/settings.js, lib/userFeedback.js, lib/helpers.js, lib/editTools.js, lib/form.js, lib/queryTools.js, core/settings_wiki_dependant.js


var do_default = function(value, default_value) {
	return value === null || value === undefined ? default_value : value;
}



function wtools_moveSinglePage(oldTitle, newTitle, reason, params, then) {
	params = do_default(params, {});
	var movetalk = do_default(params.movetalk, true);
	var watch = do_default(params.watch, false);
	var supressRedirect = do_default(params.supressRedirect, false);

	console.log("Moving page " + oldTitle + " to " + newTitle);
	return new mw.Api().post({
		action: "move",
		from: oldTitle,
		to: newTitle,
		reason: reason + wToolCore.settings.EDIT_AD_TO_USE,
		movetalk: movetalk ? "yes" : void 0,
		watchlist: watch ? "watch" : void 0,
		noredirect: supressRedirect ? "1" : false,
		token: mw.user.tokens.get('csrfToken'),
		format: "json",
		tags: wToolCore.settings.EDIT_TAG_TO_USE ? wToolCore.settings.EDIT_TAG_TO_USE : ""
	}).then(
		function() {
			//logMessage(
			//	"Successfully moved " + wToolCore.getHtmlPageLink(oldTitle) + " to " + wToolCore.getHtmlPageLink(newTitle) + ".",
			//	'green'
			//)
			params.pages_moved.push({"from": oldTitle, "to": newTitle});
			then();
		},
		function(error) {
			console.error(error)
			if (error === "articleexists") {
				wtools_movePageError_pageExists(oldTitle, newTitle, reason, params, then);
				return;
			}
			//logMessage(
			//	oldTitle + ' could not be moved for reason: ' + response.error.info,
			//	'red'
			//)
			then();
		}
	);
}


function wtools_moveSubpages(oldTitle, newTitle, reason, params, then) {
	wToolCore.getEntireApiRequest({
		action: 'query',
		list: 'prefixsearch',
		pssearch: oldTitle + '/',
		pslimit: 'max',
		format: 'json'
	}, function(subpageList) {
		var doNext = function(doNext, index) {
			if (index > subpageList.length) {
				if (then) then();
				return;
			}

			wtools_moveSinglePage(
				subpageList[index].title,
				subpageList[index].title.replace(oldTitle, newTitle),
				"[Moving Subpages] " + reason,
				params,
				function() {doNext(doNext, index + 1)}
			);
		}
		doNext(doNext, 0);
	});
}


function wtools_movePageError_pageExists(oldTitle, newTitle, reason, params, then) {
	var form = [
		{
			type: "label",
			text: 'Cannot move the page "' + oldTitle + '" to "' + newTitle + '": target page already exists.'
		}
	]
	
	if (wToolCore.settings.USER_IS_ADMIN) {
		form.push({
			type: "button",
			text: 'Delete destination page then move',
			onclick: function(dialog) {
				dialog.close()

				wToolCore.deletePage(newTitle, "Deleting to make way for page move.", true).then(
					function() {
						dialog.close({ action: "submit" });
						wTools_MovePage(oldTitle, newTitle, reason, movetalk, watch, supressRedirect, then);
					},
					function(error) {
						dialog.close({ action: "submit" });
						wToolCore.createForm("Failed to delete page", [
							{
								type: "label",
								text: "Failed to delete " + newTitle + ": " + error + "."
							}
						],
						{
							onCancel: then
						});
					}
				);

			}
		});
	}


	form.push({
		type: "button",
		text: 'Swap pages (Unimplemented)'
	});


	form.push({
		type: "button",
		text: 'Rename destination page then move (Unimplemented)'
	});


	wToolCore.createForm("Failed to move page", form,
	{
		onCancel: then
	});
}


function wtools_changeLinks(oldTitle, newTitle, reason, params, then) {
	params = do_default(params, {});
	var transclusions = do_default(params.fixTransclusions, false);
	var links = do_default(params.fixLinks, false);
	var categoryLinks = do_default(params.fixCategoryLinks, false);

	var request = {
		action:"query",
		format:"json",
		prop:	(links ? "linkshere" : "") +
			"|" + (transclusions ? "transcludedin" : "") +
			"|" + (wToolCore.settings.VIEWING_NAMESPACE === 6 ? "fileusage" : ""),
		titles: pageName,
		formatversion:"2"
	};
	var request2;
	if (categoryLinks) request2 = {
		action: "query",
		format: "json",
		list: "categorymembers",
		cmtitle: pageName,
		cmlimit: "250"
	};


	var fix_pages_by_request = function(request) {
		wToolCore.getEntireApiRequest(request, function(pages) {
			console.log("Got " + pages.length + " page(s) to fix.");

			wToolCore.methodCallLoop(pages, {
				callFunction: function(page, doNext) {
					// Process this page's links
					
					new mw.Api().edit(page.title, function(revision) {
						var output = {
							text: revision.content,
							summary: "Moving page [[" + oldTitle + "]] to [[" + newTitle + "]] - updating links" + wToolCore.settings.EDIT_AD_TO_USE,
							minor: true,
							bot: true,
							watchlist: "nochange",
							tags: wToolCore.settings.EDIT_TAG_TO_USE
						};

						// Replace all links to the new page, as well as template transclusions.
						for (var moveIndex in params.pages_moved) {
							var move = params.pages_moved[moveIndex];
							output.text = wToolCore.replaceLink(output.text, move.from, move.to, page.title);
						}
						return output;
					});
				

				}
			})
		});
	}

	fix_pages_by_request(request);
}



function wtools_showMovePageForm(oldTitle, then, is_main) {
	is_main = do_default(is_main, false);
	
	var form = [
		{
			type: "textbox",
			value: oldTitle,
			text: "New page name",
			placeholder: "New Page Title",
			name: "page_title"
		},
		{
			type: "textbox",
			text: "Reason:",
			placeholder: "",
			name: "reason"
		},
		{
			type: "checkbox",
			text: "Move Talk",
			name: "move_talk",
			value: true
		},
		{
			type: "checkbox",
			text: "Move Subpages",
			name: "move_subpages",
			value: false
		}
	];
	
	var canSupressRedirect = mw.config.get("wgUserGroups").indexOf("rollback") !== -1 || wToolCore.settings.USER_IS_ADMIN;
	

	if (canSupressRedirect) {
		form.push({
			type: "checkbox",
			text: "Leave Redirect",
			name: "leave_redirect",
			value: true
		});
	}
	form.push({
		type: "checkbox",
		text: "Watch target page",
		name: "watch",
		value: true
	});


	// TODO: Add checkboxes for changing links, category, tranclusions

	wToolCore.createForm("Moving " + oldTitle, form,
	{
		onCancel: then,
		submitText: "Move",
		onSubmit: function(dialog) {
			if (is_main) {
				wToolCore.pageMoveRedirect = dialog.page_title.value.trim();
			}

			var newTitle = dialog.page_title.value.trim();
			var reason = dialog.reason.value.trim();
			var params = {
				movetalk: dialog.move_talk.selected,
				watch: dialog.watch.selected,
				supressRedirect: canSupressRedirect ? !dialog.leave_redirect.selected : false,
				pages_moved: []
			};

			var do_after_move = function() {
				// TODO: Instead make it do this for every moved file.
				if (params.pages_moved.length > 0) {
					wtools_changeLinks(oldTitle, newTitle, reason, params, then);
				}
			}

			wtools_moveSinglePage(
				oldTitle,
				newTitle,
				reason,
				params,
				function() {
					if (dialog.move_subpages.selected) {
						wtools_moveSubpages(oldTitle, newTitle, reason, params, do_after_move);
					}
					else {
						then();
					}
				}
			);

			dialog.close();
		}
	});
}


document.getElementById("ca-move").children[0].onclick = function(event) {
	event.preventDefault();
	wtools_showMovePageForm(mw.config.get("wgRelevantPageName"), function() {
		if (wToolCore.pageMoveRedirect) {
			location.href = wToolCore.getArticlePath(wToolCore.pageMoveRedirect);
		}
	}, true);
}