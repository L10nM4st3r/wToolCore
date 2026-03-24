/*
	Module script
	This module adds a button which makes the page be excluded from [[Special:ShortPages]]
*/
// Dependancies: lib/editTools.js, lib/queryTools.js, modules/userTemplating.js

wToolCore.makePageNonShort = function() {
	return wToolCore.getWikitextForPage(mw.config.get("wgRelevantPageName"), function(pageText) {
		if (pageText.length > 2000) {
			mw.notify("Page does not need lengthening, it is already large enough.");
			return;
		}
		
		var notShortText = ("THIS PAGE IS NOT SHORT FOR SHIT ".repeat(Math.ceil((2500 - pageText.length) / 32)));
		if (mw.config.get("wgRelevantPageName").slice(-4) === ".css" || mw.config.get("wgRelevantPageName").slice(-3) === ".js") {
			pageText += "\n\n/* " + notShortText + " */";
		}
		else {
			pageText += "<noinclude>\n\n<!-- " + notShortText + "--></noinclude>";
		}
		wToolCore.editPage({
			title: mw.config.get("wgRelevantPageName"),
			text: pageText,
			minor: true,
			summary: "[[Special:ShortPages|This page is not short for shit!]]",
			watchlist: "nochange"
		}).then(
			function() {wToolCore.displaySuccess("Successfuly lengthened page!");},
			function(error, e) {wToolCore.displayErrorJSON(error, e);}
		);
	});
}


if (mw.config.get("wgNamespaceNumber") >= 0 && ![1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,19,21,23,25,27,29].indexOf(mw.config.get("wgNamespaceNumber")) !== -1 && mw.config.get("wgRelevantPageName")) {
	wToolCore.addToolButton("ca-shortPages", "Not short for shit", "Removes this page from Special:ShortPages.", wToolCore.makePageNonShort);
}
