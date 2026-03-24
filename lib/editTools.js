/*
	Library script
	This script handles editing pages
*/
// Dependancies: core/settings.js, lib/queryTools.js, lib/userFeedback.js

/**
	Will post an edit to a page. Suported parameters for [config]:
	@pageid - The id of the page to edit.
	@title - The title of the page to edit.
	@section - The section to edit. use "new" to make a new section at the end.
	@sectiontitle - The title of the section when making a new section.
	@text - The text to replace the page or section with.
	@summary - The edit summary to use.
	@useAd - Set to false to disable the edit ad.
	@tags - A string of tags to use for this edit, comma seperated.
	@usetag - Set to false to disable the edit tag.
	@minor - Sets if the edit is a minor edit.
	@bot - Sets if the edit is a bot edit.
	@nocreate - Set to true to disable the ability to create pages.
	@appendtext - Text to append to the end.
	@prependtext - Text to prepend to the start.
*/
wToolCore.editPage = function(config) {
	config = do_default(config, {});

	var query = wToolCore.generateEditRequest(config);
	console.log("Sending edit query: ", query)
	return new mw.Api().postWithEditToken(query);
}


/**
	Creates an edit request json. To be used with `new mw.Api().edit`. Suported parameters for @config:
	@pageid - The id of the page to edit.
	@title - The title of the page to edit.
	@section - The section to edit. use "new" to make a new section at the end.
	@sectiontitle - The title of the section when making a new section.
	@text - The text to replace the page or section with.
	@summary - The edit summary to use.
	@useAd - Set to false to disable the edit ad.
	@tags - A string of tags to use for this edit, comma seperated.
	@usetag - Set to false to disable the edit tag.
	@minor - Sets if the edit is a minor edit.
	@bot - Sets if the edit is a bot edit.
	@nocreate - Set to true to disable the ability to create pages.
	@appendtext - Text to append to the end.
	@prependtext - Text to prepend to the start.
	@watchlist - Rules for the watchlist.
	Also suports: @undo and @undoafter
*/
wToolCore.generateEditRequest = function(config) {
	config = do_default(config, {});
	
	var query = {
		format: "json",
		action: "edit",
		formatversion: "2"
	};

	var PARAMETERS = ["appendtext","prependtext","pageid","title","nocreate","minor","bot","section","sectiontitle","undo","undoafter","watchlist","text","appendtext","prependtext"];
	for (parameterIndex in PARAMETERS) {
		var parameter = PARAMETERS[parameterIndex];
		if (config[parameter]) query[parameter] = config[parameter];
	}
	if (config.summary) query.summary = config.summary + (wToolCore.settings.USE_EDIT_SUMMARY_AD && config.useAd !== false ? wToolCore.settings.EDIT_SUMMARY_AD : "");

	var canUseEditTag = config.usetag !== false && wToolCore.settings.EDIT_TAG_TO_USE !== undefined;
	if (canUseEditTag) query.tags = (config.tags ? config.tags + "," : "") + wToolCore.settings.EDIT_TAG_TO_USE;

	return query;
}

/**
	Will restore the revision id provided, no matter what page is linked to that revid.
	@summary is optional, and if not set will use a default summary.
*/
wToolCore.restoreRevid = function(revid, summary) {
	return wToolCore.getRevisionQuery(revid, {prop: "revisions", rvprop: "user"}).then(function(res) {
		//console.log(res)
		var user = res.query.pages[0].revisions[0].user;
		var pageid = res.query.pages[0].pageid;
		if (!summary) {
			summary = "Restored revision [[Special:Diff/$ID|$ID]] by [[Special:Contributions/$USER|$USER]]";
		}
		return wToolCore.editPage({
			pageid: pageid,
			undo: mw.config.get('wgCurRevisionId'),
			undoafter: revid,
			nocreate: true,
			summary: summary.replace(/\$ID/g, revid).replace(/\$USER/g, user)
		});
	});/*.then(function() {
			wToolCore.displaySuccessAfterReload("Restored revision successfully.");
			location.reload();
		}, function(error) {
			wToolCore.displayErrorJSON(error);
		}
	);*/
}


/**
	Will undo the revid provided, no matter what page is linked to that revid.
*/
wToolCore.undoRevid = function(revid) {
	return wToolCore.getRevisionQuery(revid, {prop: "revisions", rvprop: "user|ids"}).then(function(res) {
		var user = res.query.pages[0].revisions[0].user;
		var oldid = res.query.pages[0].revisions[0].parentid;
		var pageid = res.query.pages[0].pageid;
		return wToolCore.editPage({
			pageid: pageid,
			undoafter: oldid,
			undo: revid,
			nocreate: true,
			summary: "Undoing revision $ID by $USER".replace(/\$ID/, revid).replace(/\$USER/, user)
		});
	});/*.then(function() {
			mw.notify('Reverted revision successfully.');
		}, function(e) {
			mw.notify(JSON.stringify(e), {type: 'error'});
		}
	);*/
}

/**
	Will rollback the revid provided, no matter what page is linked to that revid.
	This will fail if there is a more recent edit on this page by a different user.
*/
wToolCore.rollbackRevid = function(revid, editSummary) {
	return wToolCore.getRevisionQuery(revid, {prop: "revisions", rvprop: "user"}).then(function(res) {
		var user = res.query.pages[0].revisions[0].user;
		var pageName = res.query.pages[0].title;
		return wToolCore.rollbackEdit(pageName, user, editSummary);
	});
}

/**
	Will rollback the most recent edits to this page by this user.
	This will fail if the most recent edit on this page is by a different user.
*/
wToolCore.rollbackEdit = function(pageName, userName, editSummary) {
	var params = {
		watchlist: "nochange",
		tags: wToolCore.settings.EDIT_TAG_TO_USE
	};
	if (editSummary) params.summary = editSummary;
	return new mw.Api().rollback(pageName, userName, params);
}

/**
	Inserts a string into another string based on some defined rules.
	This is only really useful for modifying a page with config settings.
*/
wToolCore.handleStringEdit = function(string, appendMessageRules, insertText) {
	for (appendRuleIndex in appendMessageRules) {
		var appendRule = appendMessageRules[appendRuleIndex];

		var regex = appendRule.anchor ? RegExp("(" + appendRule.anchor + ")", appendRule.case_insensitive ? "i" : "") : false;

		if (appendRule.type === "before_text_anchor" && regex) {
			var match = string.match(regex);
			var match_string = match[0];
			var start_index = match.index;
			var end_index = start_index + match_string.length;
			if (string.match(regex)[0].length > 0) {
				return string.slice(0, start_index) + insertText + match_string + string.slice(end_index, string.length);
			}
		}
		if (appendRule.type === "after_text_anchor" && regex) {
			var match = string.match(regex);
			var match_string = match[0];
			var start_index = match.index;
			var end_index = start_index + match_string.length;
			if (string.match(regex)[0].length > 0) {
				return string.slice(0, start_index) + match_string + insertText + string.slice(end_index, string.length);
			}
		}
		if (appendRule.type === "bottom")
			return string + insertText;
		if (appendRule.type === "top")
			return insertText + string;
	};
	return string;
}

/**
	Deletes the target page, if they have permission to.
	@param {String} pageTitle The title of the page to delete.
	@param {String} reason The reason of the page deletion.
	@param {Boolean} deletetalk Whether or not to also delete the talkpage.
*/
wToolCore.deletePage = function(pageTitle, reason, deletetalk) {
	return new mw.Api().postWithToken('csrf', {
		"action": "delete",
		"title": pageTitle,
		"reason": reason,
		"tags": wToolCore.settings.EDIT_TAG_TO_USE,
		"deletetalk": deletetalk ? 1 : 0
	})
}