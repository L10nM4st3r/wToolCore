/*
	Module script
	This module adds a "speedy delete" button to the tools dropdown
*/
// Dependancies: lib/userFeedback.js, modules/makePageNonShort.js


if (mw.config.get("wgNamespaceNumber") >= 0) {
	wToolCore.addToolButton("ca-purge", "Purge", "Purge this page's cache.", function() {
		new mw.Api().post({ action:"purge", titles:mw.config.get("wgRelevantPageName") }).then(function() {
			location.reload();
		}, function(error) {
			wToolCore.displayErrorJSON(error);
		});
	});
}
