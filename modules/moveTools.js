/*
	Module script
	This module add helpful tools for page moving.
*/
// Dependancies: core/settings.js, lib/userFeedback.js, lib/helpers.js, lib/editTools.js, lib/form.js, lib/queryTools.js, core/settings_wiki_dependant.js


var wTools_pagesMoved = [];

function wTools_postMovePageRequest(oldTitle, newTitle, reason, movetalk, watch, supressRedirect) {
	console.log("Moving page "+oldTitle+" to "+newTitle);
	return new mw.Api().post({
		action: "move",
		from: oldTitle,
		to: newTitle,
		reason: reason,
		movetalk: movetalk,
		watchlist: watch,
		noredirect: supressRedirect ? "1" : false,
		token: mw.user.tokens.get('csrfToken'),
		format: "json",
		tags: wToolCore.settings.EDIT_TAG_TO_USE ? wToolCore.settings.EDIT_TAG_TO_USE : ""
	});
}
function wTools_MovePage(oldTitle, newTitle, reason, movetalk, watch, supressRedirect, then) {
	wTools_postMovePageRequest(oldTitle, newTitle, reason, movetalk, watch, supressRedirect).then(function(response) {
		if (response.move) {
			wTools_pagesMoved.push({
				from: response.move.from,
				to: response.move.to,
				ns: wToolCore.namespaceNameToId(response.move.to)
			});
		}
		then(response);
	},
	function(error) {
		if (error === "articleexists") {
			if (wToolCore.settings.USER_IS_ADMIN) {
				wToolCore.createForm("Cannot move page", [
					{
						type: "label",
						text: 'Cannot move the page <b>"' + oldTitle + '"</b> to ' + wToolCore.getHtmlPageLink(newTitle) + ": a page by that name already exists."
					}
				], {onSubmit: function(dialog) {
					wToolCore.deletePage(newTitle, "Deleting to make way for page move.", true).then(function() {
						dialog.close({ action: "submit" });
						wTools_MovePage(oldTitle, newTitle, reason, movetalk, watch, supressRedirect, then);
					}, function(error2) {
						dialog.close({ action: "submit" });
						wToolCore.createForm("Failed to delete page", [
							{
								type: "label",
								text: "Failed to delete "+wToolCore.getHtmlPageLink(newTitle)+": "+error2+"."
							}
						]);
					});
				}, submitText: "Delete Target Page"})
			}
			else {
				wToolCore.createForm("Cannot move page", [
					{
						type: "label",
						text: 'Cannot move the page <b>"' + oldTitle + '"</b> to <a href="' + wToolCore.getArticlePath(newTitle) + '">"' + newTitle + '"</a>: a page by the name of ' + wToolCore.getHtmlPageLink(newTitle) + ' already exists. Ask an admin to delete it.'
					}
				])
			}
		}
		else {
			wToolCore.createForm("Cannot move page", [
				{
					type: "label",
					text: 'Cannot move the page <b>"' + oldTitle + '"</b> to ' + wToolCore.getHtmlPageLink(newTitle) + ': ' + error + '.'
				}
			])
		}
	});
}

var wTools_PageLink_index = 0;
function wTools_fixPageLinks(pageName, onCompleted, isCategory, fixLinks, fixTransclusions) {
	var request = {action:"query", format:"json", prop:(fixLinks ? "linkshere" : "")+"|"+(fixTransclusions ? "transcludedin" : "")+"|"+(wToolCore.settings.VIEWING_NAMESPACE === 6 ? "fileusage" : ""), titles : pageName, formatversion:"2"};
	if (isCategory) request = {action:"query", format:"json", list:"categorymembers", cmtitle: pageName, cmlimit:"250"};

	wToolCore.getEntireApiRequest(request, function(pages) {
		console.log("Got "+pages.length+" page(s) to fix.")

		// No pages to fix, instead move to the next page.
		if (pages.length === 0) {
			wTools_PageLink_index += 1;
			if (wTools_PageLink_index < wTools_pagesMoved.length) wTools_fixPageLinks(wTools_pagesMoved[wTools_PageLink_index].from, onCompleted, isCategory, fixLinks, fixTransclusions);
			else onCompleted();
			return;
		}

		$('#renameCategories-log').remove();
		$('#progressWarning-log').remove();

		var inProgressWarning = $('<span>')
			.appendTo($('#movepage'))
			.text('Changing links. If you see this, do not close the tab.')
			.css('color', 'red')
			.attr('id', 'progressWarning-log');

		var log = $('<span>')
			.appendTo($('#movepage'))
			.append('<br/><hr/>')
			.attr('id', 'renameCategories-log');


		var loopComplete = function() { // Check the next pages for new links
			wTools_PageLink_index += 1;
			if (wTools_PageLink_index < wTools_pagesMoved.length) wTools_fixPageLinks(wTools_pagesMoved[wTools_PageLink_index].from, onCompleted, isCategory, fixLinks, fixTransclusions);
			else {
				onCompleted();
				inProgressWarning.remove();
			}
		};
		var loopProcess = function(pageTitle, then) {
			var changesWereMade = false;
			new mw.Api().edit(pageTitle.title, function(revision) {
				var output = {
					text: revision.content,
					summary: "Moving page [[" + wTools_pagesMoved[wTools_PageLink_index].from + "]] to [[" + wTools_pagesMoved[wTools_PageLink_index].to + "]] - updating links" + wToolCore.settings.EDIT_AD_TO_USE,
					minor: true,
					bot: true,
					watchlist: "nochange",
					tags: wToolCore.settings.EDIT_TAG_TO_USE
				};
				// Replace all links to the new page, as well as template transclusions.
				for (var moveIndex in wTools_pagesMoved) {
					var move = wTools_pagesMoved[moveIndex];
					// Has a namespace
					var fromPage = move.from.charAt(0).toUpperCase() + move.from.slice(1);
					if (move.ns != null) {
						var colonIndex = move.from.indexOf(":");
						fromPage = move.from.slice(0, colonIndex + 1) + move.from.charAt(colonIndex + 1).toUpperCase() + move.from.slice(colonIndex + 2);
					}
					output.text = fixPage(fixPage(output.text, fromPage, move.to), fromPage, move.to);
				}
				changesWereMade = output.text !== revision.content;
				return output;
			}).then(function() {
				log.append(
					"<p>"+(changesWereMade ? "Successfully changed link for" : "No changes made to")+" "+(wToolCore.getHtmlPageLink(pageTitle.title))+".</p>"
				).css('color', changesWereMade ? 'green' : 'gray');

				if (wToolCore.settings.USER_IS_ADMIN) {
					setTimeout(then, 250);
				}
				else {
					setTimeout(then, 500);
				}
			}, function(error) {
				console.error(error)
				if (error === "ratelimited") {
					log.append(
						"<p>Hit rate limit while editing "+wToolCore.getHtmlPageLink(pageTitle.title)+". Waiting 2 seconds to retry.</p>"
					).css('color', 'red');
					clearTimeout();
					setTimeout(function(){then({retryPrevious: true})}, 2000);
				}
				else {
					log.append(
						"<p>Failed to update link for " + wToolCore.getHtmlPageLink(pageTitle.title)+": "+error+".</p>"
					).css('color', 'red');
					if (wToolCore.settings.USER_IS_ADMIN) {
						setTimeout(function(){then({retryPrevious: true})}, 2000);
					}
					else {
						setTimeout(function(){then({retryPrevious: true})}, 2000);
					}
				}
			});
		};
		wToolCore.methodCallLoop(pages, {
			callOnDone: loopComplete,
			callFunction: loopProcess
		});
	}, function(query) {
		// Turn query into an array of pages to edit
		var output = [];
		if ("categorymembers" in query) output = query.categorymembers;
		if ("pages" in query && query.pages.length > 0) {
			if ("linkshere" in query.pages[0]) output = output.concat(query.pages[0].linkshere);
			if ("transcludedin" in query.pages[0]) output = output.concat(query.pages[0].transcludedin);
			if ("fileusage" in query.pages[0]) output = output.concat(query.pages[0].fileusage);
		}

		return output;
	});
}
function wTools_doPostMoveStuff(fromTitle, toTitle, redirectUrl) {
	redirectUrl = do_default(redirectUrl, true);

	console.log("Now changing page links (if settings enabled).")
	getFixPagecache();
	var index = 0;

	// If this page is a category
	if (wToolCore.settings.VIEWING_NAMESPACE === 14) {
		var changeCategoryLinks = $('input[name=changeCategoryLinks]').prop('checked');

		if (changeCategoryLinks) {
			index = 0;
			wTools_fixPageLinks(wTools_pagesMoved[index].from, function() {
				location.href = wToolCore.getArticlePath(toTitle);
			}, true);
		}
		else location.href = wToolCore.getArticlePath(toTitle);
	}
	else {
		var changeTransclusions = $('input[name=changeTransclusions]').prop('checked');
		var changeLinks = $('input[name=changeLinks]').prop('checked');

		if (changeLinks || changeTransclusions) {
			index = 0;
			wTools_fixPageLinks(wTools_pagesMoved[index].from, function() {
				if (redirectUrl) location.href = wToolCore.getArticlePath(toTitle);
			}, false, changeLinks, changeTransclusions);
		}
		else {
			if (redirectUrl) location.href = wToolCore.getArticlePath(toTitle);
		}
	}
}
function wTools_movePagePressed() {
	var oldTitle = mw.config.get("wgRelevantPageName"),
		to_ns = mw.config.get('wgFormattedNamespaces')[$('select[name=wpNewTitleNs]').val()].replace(' ', '_'),
		to_page = $('input[name=wpNewTitleMain]').val(),
		newTitle = (to_ns === '' ? to_page : to_ns + ':' + to_page),
		reason = $('input[name=wpReason]').val(),
		talk = $('input[name=wpMovetalk]').prop('checked') ? 'yes' : void 0,
		watch = $('input[name=wpWatch]').prop('checked') ? 'watch' : void 0,
		supressRedirect = $('input[name=wpLeaveRedirect]').prop('checked') ? false : true;

	document.getElementById("new-movePage").style.display = "none";
	if (document.getElementById("new-moveSubPages")) document.getElementById("new-moveSubPages").style.display = "none";
	document.getElementById("new-changeLinksOnly").style.display = "none";
	
	wTools_MovePage(oldTitle, newTitle, reason, talk, watch, supressRedirect, function(response) {
		if (response.move) {
			wTools_doPostMoveStuff(response.move.from, response.move.to);
		} else {
			document.getElementById("new-movePage").style.display = "inline";
			if (document.getElementById("new-moveSubPages")) document.getElementById("new-moveSubPages").style.display = "inline";
			mw.notify("Cannot move page: " + response.error.info, {type: "error"});
		}
	});
}
function wTools_moveSubpagesPressed() {
	document.getElementById("new-movePage").style.display = "none";
	if (document.getElementById("new-moveSubPages")) document.getElementById("new-moveSubPages").style.display = "none";
	document.getElementById("new-changeLinksOnly").style.display = "none";

	var oldTitle = mw.config.get("wgRelevantPageName"),
		to_ns = mw.config.get('wgFormattedNamespaces')[$('select[name=wpNewTitleNs]').val()].replace(' ', '_'),
		to_page = $('input[name=wpNewTitleMain]').val(),
		newTitle = (to_ns === '' ? to_page : to_ns + ':' + to_page),
		reason = $('input[name=wpReason]').val(),
		talk = $('input[name=wpMovetalk]').prop('checked') ? 'yes' : void 0,
		watch = $('input[name=wpWatch]').prop('checked') ? 'watch' : void 0,
		supressRedirect = $('input[name=wpLeaveRedirect]').prop('checked') ? false : true;

	wToolCore.getEntireApiRequest({
		action: 'query',
		list: 'prefixsearch',
		pssearch: oldTitle + '/',
		pslimit: 'max',
		format: 'json'
	}, function(subpageList) {
		$('#moveSubpages-log').remove();

		var log = $('<span>')
			.appendTo($('#movepage'))
			.append('<br/><hr/>')
			.attr('id', 'moveSubpages-log');

		function doMovePage(oldTitle, newTitle, noerror, reason, onerror) {
			reason = do_default(reason, "");
			onerror = do_default(onerror, null);

			wTools_MovePage(oldTitle, newTitle, reason, talk, watch, supressRedirect, function(response) {
				if (response.move) {
					if (response.move['talkmove-errors']) {
						var talkpage = oldTitle.match(':') ? oldTitle.replace(':', ' talk:') : 'Talk:' + oldTitle;
						log.append($('<p>').text(talkpage + ' could not be moved.').css('color', 'red'));
					} else if (response.move.talkfrom) {
						log.append(
							'<p>Successfully moved ' +
							response.move.talkfrom +
							' to ' +
							response.move.talkto +
							'.</p>'
						).css('color', 'green');
					}
				}

				if (response.error) {
					log.append($('<p>').text(oldTitle + ' could not be moved.').css('color', 'red'));
					log.append($('<p>').append('&bull; Reason: ' + response.error.info + '</li>').css('color', 'red'));
					if (onerror) onerror();
				} else {
					log.append("<p>Successfully moved "+wToolCore.getHtmlPageLink(response.move.from)+" to "+wToolCore.getHtmlPageLink(response.move.to)+".</p>").css('color', 'green');
					noerror();
				}
			});
		}

		var subpageIndex = 0;
		function doMoveNextPage(){
			while (subpageIndex < subpageList.length){
				doMovePage(subpageList[subpageIndex].title, subpageList[subpageIndex].title.replace(oldTitle, newTitle), doMoveNextPage, "[Moving Subpages] " + reason + wToolCore.settings.EDIT_AD_TO_USE);
				subpageIndex += 1;
				return;
			}
			wTools_doPostMoveStuff(oldTitle, newTitle);
		}
		doMovePage(oldTitle, newTitle, function() {
			doMoveNextPage();
		}, reason, function() {
			document.getElementById("new-movePage").style.display = "inline";
			if (document.getElementById("new-moveSubPages")) document.getElementById("new-moveSubPages").style.display = "inline";
		});
	}, function(query) {return query.prefixsearch;});
}
function wTools_changeLinksOnly() {
	document.getElementById("new-movePage").style.display = "none";
	if (document.getElementById("new-moveSubPages")) document.getElementById("new-moveSubPages").style.display = "none";
	document.getElementById("new-changeLinksOnly").style.display = "none";
	
	
	$('#moveSubpages-log').remove();

	var log = $('<span>')
		.appendTo($('#movepage'))
		.append('<br/><hr/>')
		.attr('id', 'moveSubpages-log');
	
	
	var oldTitle = mw.config.get("wgRelevantPageName"),
		to_ns = mw.config.get('wgFormattedNamespaces')[$('select[name=wpNewTitleNs]').val()].replace(' ', '_'),
		to_page = $('input[name=wpNewTitleMain]').val(),
		newTitle = (to_ns === '' ? to_page : to_ns + ':' + to_page);
	
	pagesMoved.push({from: oldTitle, to: newTitle, ns: wToolCore.namespaceNameToId(newTitle)});
	wTools_doPostMoveStuff(oldTitle, newTitle, false);
}


if (typeof mw.config.get("wgCanonicalSpecialPageName") === "string" && mw.config.get("wgCanonicalSpecialPageName").toLowerCase() === "movepage") {
	console.log("Is on move page, loading advanced UI.");
	new OO.ui.ButtonWidget({
		label: 'Move page',
		id: 'new-movePage',
		flags: ['primary', 'progressive']
	}).$element
		.on('click', wTools_movePagePressed)
		.appendTo($('button[name=wpMove]').parent().parent());

	if (!$('p:contains(\'This page has no subpages.\')')[0]) {
		var canUseSubpageMover = mw.config.get("wgUserGroups").filter(function(value, index, array) {
			return ["extendedconfirmed", "extendedconfirmeduser", "rollbacker", "admin", "interface-admin", "reviewer", "suppressredirect", "suppress-redirect", "bureaucrat", "steward", "sysop", "bot"].indexOf(value) !== -1;
		}) !== undefined;

		if (canUseSubpageMover) {
			new OO.ui.ButtonWidget({
				label: 'Move page and subpages',
				id: 'new-moveSubPages',
				flags: ['primary', 'progressive']
			}).$element
				.on('click', wTools_moveSubpagesPressed)
				.appendTo($('button[name=wpMove]').parent().parent());
		}
	}
	
	new OO.ui.ButtonWidget({
		label: 'Change links only',
		id: 'new-changeLinksOnly',
		flags: ['primary', 'progressive']
	}).$element
		.on('click', wTools_changeLinksOnly)
		.appendTo($('button[name=wpMove]').parent().parent());


	// If this page is a category
	if (wToolCore.settings.VIEWING_NAMESPACE === 14) {
		var changeCategoryLinks = new OO.ui.CheckboxInputWidget({
			name: 'changeCategoryLinks',
			selected: false
		});
		new OO.ui.FieldLayout( changeCategoryLinks, { label: 'Change category links for pages which use this category', align: 'inline'}).$element
			.appendTo($('input[name=wpWatch]').parent().parent().parent().parent());
	}
	else {
		var changeLinks = new OO.ui.CheckboxInputWidget({
			name: 'changeLinks',
			selected: false
		});
		new OO.ui.FieldLayout( changeLinks, { label: 'Change links to the new page.', align: 'inline'}).$element
			.appendTo($('input[name=wpWatch]').parent().parent().parent().parent());


		var changeTransclusions = new OO.ui.CheckboxInputWidget({
			name: 'changeTransclusions',
			selected: true
		});
		new OO.ui.FieldLayout( changeTransclusions, { label: 'Change transclusions to the new page.', align: 'inline'}).$element
			.appendTo($('input[name=wpWatch]').parent().parent().parent().parent());
	}


	// Remove the default move button, and do some general ui cleanup
	$('button[name=wpMove]').parent().remove();
	if ($('#wpMovesubpages')) $('#wpMovesubpages').parent().parent().parent().remove();

	var fixPage_fixCategories = false;
	var fixPage_fixLinks = false;
	var fixPage_fixTransclusions = true;
	function getFixPagecache() {
		if (wToolCore.settings.VIEWING_NAMESPACE === 14) {
			fixPage_fixCategories = $('input[name=changeCategoryLinks]').prop('checked');
        }
		else {
			fixPage_fixCategories = false;
			fixPage_fixLinks = $('input[name=changeLinks]').prop('checked');
			fixPage_fixTransclusions = $('input[name=changeTransclusions]').prop('checked');
		}
	}

	var templatePrefix = mw.config.get("wgFormattedNamespaces")[10] + ":";
	var namespaceIds = mw.config.get("wgNamespaceIds");

	function fixPage(content, fromTitle, toTitle) {
		var safeFromTitle = wToolCore.escapeRegex(fromTitle).replace(/[ _]/g, "[ _]").replace("File:", "(?:File:|Image:|file:|image:)");
		var safeToTitle = wToolCore.escapeRegex(toTitle).replace(/[ _]/g, "[ _]").replace("File:", "(?:File:|Image:|file:|image:)");

		var whitespaces = "[‎ \n]*";
		var toTitleNamespace = toTitle.split(":", 1)[0];

		// If we are fixing categories, just fix all the links.
		if (fixPage_fixCategories) {
			if (!content.indexOf("#REDIRECT") == 0 || !content.indexOf("__STATICREDIRECT__") !== -1) {
				if (":" in toTitle && toTitleNamespace in namespaceIds) {
					// We are moving to a page with a namespace
					content = content.replace(
						RegExp(
							"\\[\\["+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\]\\]",
							'g'
						),
						"[["+toTitle+"|$1]]"
					);
				}
				else {
					content = content.replace(
						RegExp(
							"\\[\\["+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\]\\]",
							'g'
						),
						"[[:"+toTitle+"|$1]]"
					);
				}
				content = content
					.replace(
						RegExp(
							"\\[\\["+whitespaces+"("+safeFromTitle+")"+whitespaces+"\\]\\]",
							'g'
						),
						"[["+toTitle+"]]"
					)
					.replace(
						RegExp(
							"\\[\\["+whitespaces+safeFromTitle+whitespaces+"\\|"+whitespaces+"(.+?)"+whitespaces+"\\]\\]",
							'g'
						),
						"[["+toTitle+"]]"
					)
					.replace(
						RegExp(
							"\\[\\["+whitespaces+":"+safeFromTitle+""+whitespaces+"\\|"+whitespaces+"(.+?)"+whitespaces+"\\]\\]",
							'g'
						),
						"[[$1"+toTitle+"|$2]]"
					);
			}
			content = content
					.replace(
						RegExp(
							"(?:^|[^{])\\{\\{"+whitespaces+"(:?)"+safeFromTitle+whitespaces+"\\}\\}",
							'g'
						),
						"{{$1"+toTitle+"}}"
					)
					.replace(
						RegExp(
							"(?:^|[^{])\\{\\{"+whitespaces+"(:?)"+safeFromTitle+whitespaces+"\\|"+whitespaces+"(.+?)"+whitespaces+"\\}\\}",
							'g'
						),
						"{{$1"+toTitle+"|$2}}"
					);
		}

		else {
			// Has the side effect of also fixing redirects
			if (fixPage_fixLinks) {
				if (!content.indexOf("#REDIRECT") == 0 || !content.indexOf("__STATICREDIRECT__") !== -1)
					if (":" in toTitle && toTitleNamespace in namespaceIds) {
						// We are moving to a page with a namespace
						content = content.replace(RegExp("\\[\\["+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\]\\]", 'g'), "[["+toTitle+"|$1]]");
					}
					else {
						content = content.replace(
							RegExp(
								"\\[\\["+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\]\\]",
								'g'
							),
							"[[:"+toTitle+"|$1]]"
						);
					}
					content = content
						.replace(
							RegExp(
								"\\[\\["+whitespaces+"(:?)("+safeFromTitle+")"+whitespaces+"\\]\\]",
								'g'
							),
							"[[$1"+toTitle+"|$2]]"
						)
						.replace(
							RegExp(
								"\\[\\["+whitespaces+"(:?)"+safeFromTitle+whitespaces+"\\|"+whitespaces+"(.+?)"+whitespaces+"\\]\\]",
								'g'
							),
							"[[$1"+toTitle+"|$2]]"
						)
						// If undoing a move, this makes sure it fixes things like [[Apple|Apple]] to [[Apple]]
						.replace(
							RegExp(
								"\\[\\["+whitespaces+"(:?)"+safeToTitle+whitespaces+"\\|"+whitespaces+safeToTitle+whitespaces+"\\]\\]",
								'g'
							),
							"[[$1"+toTitle+"]]"
						);
				
				if (wToolCore.settings.VIEWING_NAMESPACE === 6) { // File namespace, make sure to process the usage of <gallery>
					content = content.replace(RegExp(safeFromTitle, 'g'), toTitle);
				}
			}

			if (fixPage_fixTransclusions) {
				// Make sure to cut out the "Template:" prefix
				if (toTitle.indexOf(templatePrefix) == 0) toTitle = toTitle.replace(templatePrefix, "");
				else if (!toTitle.slice(0, toTitle.indexOf(":")).toLowerCase() in namespaceIds)
					// No namespace defined, it is in mainspace
					toTitle = ":" + toTitle;
				
				if (":" in toTitle && toTitleNamespace in namespaceIds) {
					// We are moving to a page with a namespace
					content = content
						.replace(
							RegExp(
								"\\{\\{"+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\}\\}", 'g'
							),
							"{{"+toTitle+"}}"
						)
						.replace(
							RegExp(
								"\\{\\{"+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\|", 'g'
							),
							"{{"+toTitle+"|"
						);
				}
				else {
					// We are moving to a page without a namespace, make sure templates include a colon
					content = content
						.replace(
							RegExp(
								"\\{\\{"+whitespaces+"\\("+safeFromTitle+")"+whitespaces+"\\}\\}", 'g'
							),
							"{{:"+toTitle+"}}"
						)
						.replace(
							RegExp(
								"\\{\\{"+whitespaces+"\\("+safeFromTitle+")"+whitespaces+"\\|", 'g'
							),
							"{{:"+toTitle+"|"
						);
				}

				if (wToolCore.settings.VIEWING_NAMESPACE === 10) {
					var shortFromTitle = wToolCore.escapeRegex(fromTitle.replace(templatePrefix, "")).replace(/[ _]/g, "[ _]");
					content = content
						.replace(
							RegExp(
								"(?:^|[^{])\\{\\{"+whitespaces+"(:?)"+shortFromTitle+whitespaces+"\\}\\}", 'g'
							),
							"{{$1"+toTitle+"}}"
						)
						.replace(
							RegExp(
								"(?:^|[^{])\\{\\{"+whitespaces+"(:?)"+shortFromTitle+whitespaces+"\\|"+whitespaces+"(.+?)"+whitespaces+"\\}\\}",
								'g'
							),
							"{{$1"+toTitle+"|$2}}"
						);
				}

				content = content.replace(
					RegExp(
						'(?:^|[^{])\\{\\{' + whitespaces + '(:?)' + safeFromTitle + whitespaces + '\\}\\}',
						'g'
					),
					'{{$1' + toTitle + '}}'
				)
				.replace(
					RegExp(
						'(?:^|[^{])\\{\\{' + whitespaces + '(:?)' + safeFromTitle + whitespaces + '\\|' + whitespaces + '(.+?)' + whitespaces + '\\}\\}',
						'g'
					),
					'{{$1' + toTitle + '|$2}}'
				);
			}
		}
		return content;
	}
};