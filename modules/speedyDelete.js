/*
	Module script
	This module adds a "speedy delete" button to the tools dropdown
*/
// Dependancies: lib/editTools.js, core/settings.js, lib/userFeedback.js, lib/form.js, modules/purgePage.js

wToolCore.showSpeedyDeletePageUI = function() {
	if (!wToolCore.perWikiConfigReady) return
	var configData = wToolCore.perWikiConfig.speedyDelete;
	var redirectData = [];

	function makeRequest(dialog, onComplete) {
		wToolCore.displayInfo("Posting to " + configData.target_page + ".")
		var reportReason = dialog.reason.value.trim();
		var pageName = mw.config.get('wgPageName');
		var redirectsDeleting = 0;
		var additionalRedirectText = "";
		var setVars = (function(string, content) {return string.replace("{{{PAGE}}}", pageName).replace("{{{REASON}}}", reportReason).replace("{{{CONTENT}}}", content).replace("{{{REDIRECTS}}}", additionalRedirectText)});


		var redirectCheckbox = dialog.deleteredirects;
		if (redirectCheckbox != null && redirectCheckbox.isSelected()) {
			for (var redirectIndex in redirectData) {
				var redirect = redirectData[redirectIndex];
				if (dialog["redirectoption_" + redirect.title].isSelected()) {
					redirectsDeleting ++;
					additionalRedirectText += setVars(configData.redirect_append);
				}
			}
		}

		var editSummary = '[Requesting Deletion of [[' + pageName + ']]' +
			(redirectsDeleting > 0 ?
			' (And [[Special:WhatLinksHere/' + pageName + '|' +
				redirectsDeleting + ' Redirect' + (redirectsDeleting !== 1 ? 's' : '') + ']])' :
			'') +
		'] ' + reportReason;

		var shortEditSummary = '[Requesting Deletion of [[' + pageName + ']]] ' + reportReason;
		var message = setVars(mw.config.get("wgIsRedirect") ? configData.message_redirect : configData.message);


		// If there is no message to send to a page, assume that we must put the templates on all redirects.
		if (!configData.message && redirectsDeleting > 0) for (var redirect in redirectData) {
			if (dialog["redirectoption_" + redirect.title].isSelected()) {
				return wToolCore.generateEditRequest({
					text: setVars(configData.send_page_notice, revision.content),
					summary: editSummary
				})
			}
		}

		if (configData.target_page) new mw.Api().get({
				action:"parse",
				prop:"wikitext",
				page:configData.target_page
		}).then(function(ret) {
			wToolCore.editPage({
					title: configData.target_page,
					summary: editSummary,
					text: wToolCore.handleStringEdit(ret.parse.wikitext["*"], configData.append_message_rules, message)
			}).then(function() {
				wToolCore.displaySuccessAfterReload("Successfuly sent request!");

				// Posting the template is required if there is no target page.
				if (configData.send_page_notice && (!configData.target_page || dialog.sendtemplate.isSelected())) {
					wToolCore.displayInfo("Adding template to page.")

					new mw.Api().edit(pageName, function(revision) {
						return wToolCore.generateEditRequest({
							text: setVars(configData.send_page_notice, revision.content),
							summary: shortEditSummary
						})
					}).then(
						function() {
							onComplete();
							location.reload();
						},
						function(error, e) {
							onComplete();
							wToolCore.displayError("Failed to post page template.");
							wToolCore.displayErrorJSON(error, e);
						}
					);
				}
				// Should we go to the QVFD page
				else if (wToolCore.settings.SPEEDY_DELETE_REDIRECTS) {
					location.href = wToolCore.getArticlePath(configData.target_page);
				}
				//
				else {
					onComplete();
					wToolCore.displaySuccess("Added to " + configData.target_page + ".");
				}
			}, function(error) {
				onComplete();
				wToolCore.displayErrorJSON(error);
			});
		});
		else {
			// No request page to edit, instead directly add the template to this page
			new mw.Api().edit(pageName, function(revision) {
				return wToolCore.generateEditRequest({
					text: setVars(configData.send_page_notice, revision.content),
					summary: shortEditSummary
				})
			}).then(function() {
				onComplete();
				location.reload();
			});
		}
	}

	if (configData === null) {
		mw.notify("Speedy delete not configured on this wiki!", {type: "error", tag: "err-sp-delete"});
		return;
	}
	// Ask the user to input why they want to delete this page.
	new mw.Api().get({
		"action": "query",
		"prop": "redirects",
		"titles": mw.config.get("wgRelevantPageName"),
		"formatversion": 2
	}).then(function(data) {
		hasLoadedPageData = true;
		if ("redirects" in data.query.pages[0]) redirectData = data.query.pages[0].redirects;
		var content = [
			{
				type: "textbox",
				name: "reason",
				text: "Reason:",
				placeholder: "Reason"
			}
		];
		if (configData.send_page_notice && configData.target_page) {
			content.push({
				type: "checkbox",
				name: "sendtemplate",
				value: true,
				text: "Post deletion template on this page"
			});
		}
		if (redirectData.length > 0) {
			content.push({
				type: "checkbox",
				name: "deleteredirects",
				onclick: function(form) {
					var checked = form.deleteredirects.isSelected();
					for (var redirectIndex in redirectData)
						form["redirectoption_" + redirectData[redirectIndex].title].setDisabled(!checked);
				},
				text: "Also request deletion of redirects"
			});
		}
		for (var redirectIndex in redirectData) {
			var redirect = redirectData[redirectIndex];
			content.push({
				type: "checkbox",
				value: true,
				style: "display:none",
				name: "redirectoption_" + redirect.title,
				text: '+ "' + redirect.title + '" (redirect)',
				disabled: true
			});
		}
		wToolCore.createForm("Request speedy deletion for page", content, {
			onSubmit: function(dialog) {
				makeRequest(dialog, function() {dialog.close()});
			}
		});
	});
}


if ((wToolCore.DEBUG || !wToolCore.settings.USER_IS_ADMIN) && wToolCore.perWikiConfigReady && mw.config.get("wgNamespaceNumber") >= 0 && mw.config.get('wgPageName').replace(/_/g, " ") !== wToolCore.perWikiConfig.VFD.target_page.replace(/_/g, " ")) {
	wToolCore.addToolButton("ca-speedyDeleteRequest", "Speedy delete", "Request this page to be deleted.", wToolCore.showSpeedyDeletePageUI);
}