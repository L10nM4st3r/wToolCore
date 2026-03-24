/*
	Module script
	This module adds a button which makes the page be excluded from [[Special:ShortPages]]
*/
// Dependancies: lib/editTools.js, core/settings.js, lib/userFeedback.js, lib/form.js, lib/helpers.js


if ((location.href.indexOf("&diff=") !== -1 || location.href.indexOf("?diff=") !== -1) || mw.config.get("wgAction") === "history") {
	function addLink(item, revid, isDiffPage, isThanked, showThankLink, showRollback) {
		isDiffPage = do_default(isDiffPage, false);
		isThanked = do_default(isThanked, false);
		showThankLink = do_default(showThankLink, false);
		showRollback = do_default(showRollback, false);

		// Add a rollback link, if the user can rollback
		if (mw.config.get('wgAction') !== 'history' && showRollback) {
			$('<span>').text(" | ").append(
				$('<a>').click(function(e) {
					var button = $(e.target);
					button.addClass('restorer-loading');
					wToolCore.rollbackRevid(revid).then(
						function(diff) {
							console.log(diff)
							wToolCore.displaySuccessAfterReload('Rolled-back revision successfully.');
							if (wToolCore.settings.ROLLBACK_SHOW_DIFF_AFTER_RESTORE) {
								location.href = wToolCore.getPathWithParams(mw.config.get("wgRelevantPageName"), {
									diff: mw.config.get('wgCurRevisionId'), // The diff to view (the current version)
									oldid: revid // The old version to compare it to
								})
							} else location.reload();
						}, function(_, data) {
							mw.notify(mpAPI.getErrorMessage(data), {type: 'error'});
							button.removeClass('restorer-loading');
						});
				}).text('rollback').attr('title', 'Rollback this edit')
			).appendTo(item);
		}
		if (revid != mw.config.get('wgCurRevisionId')) {
			$('<span>').text(" | ").append(
				$('<a>').click(function(e) {
					var button = $(e.target);
					button.addClass('restorer-loading');
					wToolCore.restoreRevid(revid).always(function() {
						wToolCore.displaySuccessAfterReload('Restored revision successfully.');
						if (wToolCore.settings.ROLLBACK_SHOW_DIFF_AFTER_RESTORE) {
							location.href = wToolCore.getPathWithParams(mw.config.get("wgRelevantPageName"), {
								diff: 0, // The diff to view (the current version)
								oldid: revid // The old version to compare it to
							})
						} else location.reload();
						button.removeClass('restorer-loading');
					});
				}).text('restore').attr('title', 'Restore revision ' + revid)
			).appendTo(item);
		}

		// Also create the "Thank user" button
		if (isDiffPage) {
			if (showThankLink) {
				$('<span>').text(" | ").append(
					$(isThanked ? "<strong>" : '<a>').click(function(e) {
						var thank_button = $(e.target)
						thank_button.addClass('restorer-loading');
						wToolCore.thank_edit(revid).then(function(e) {
							thank_button.parent().html(" | <strong>thanked</strong>");
						}, function(e) {
							thank_button.removeClass('restorer-loading');
						});

					}).text(isThanked ? 'thanked' : 'thank').attr('title', isThanked ? "User already thanked." : "Thank user for this edit.")
				).appendTo(item);
			}
		}
	}

	var serverName = mw.config.get("wgServerName");
	var script = mw.config.get("wgScript");
	var pageName = mw.config.get("wgPageName");
	var pathSafePageName = wToolCore.makeStringPathSafe(pageName);


	// For diff pages. Some wikis are inconsistant with the UI, so I will create my own here.
	element = document.getElementById("mw-diff-ntitle1");
	if (element) {
		var elementChild = element.childNodes[0];
		if (elementChild.nodeName === "STRONG") elementChild = elementChild.childNodes[0];

		var viewRevisionLink = elementChild.href;
		var viewRevisionText = elementChild.textContent;
		var diffId = viewRevisionLink;
		if (diffId.indexOf("&oldid=") !== -1) {
			diffId = diffId.slice(diffId.indexOf("&oldid=") + 7);
			var isThanked = document.getElementsByClassName("mw-thanks-thank-confirmation").length > 0;
			var hadThankButton = document.getElementsByClassName("mw-thanks-thank-link").length > 0;

			var rollbackLink = document.getElementsByClassName("mw-rollback-link")[0];
			if (rollbackLink) { rollbackLink.remove(); rollbackLink = true;} // We have a custom rollback link, we don't need this one

			element.innerHTML ='<strong>' +
				'<a href="' + viewRevisionLink + '" title="' + pageName + '">' + viewRevisionText +
				'</a> (' + '<a href="' +
				wToolCore.getPathWithParams(pageName, {
					action: 'edit',
					oldid: diffId,
					summary:
					diffId != mw.config.get('wgCurRevisionId') ?
						'Editing old version [[Special:diff/' + diffId + '|' + diffId + ']]' :
						''
				}) +
				'" title="Edit revision ' + diffId + ' of ' + pageName + '">' + 'edit</a> ' + '<span id="rev-1"></span> )</strong>';

			addLink(document.getElementById("rev-1"), diffId, true, isThanked, isThanked || hadThankButton, rollbackLink);
		}
	}

	element = document.getElementById("mw-diff-otitle1");
	if (element) {
		var elementChild = element.childNodes[0];
		if (elementChild.nodeName === "STRONG") elementChild = elementChild.childNodes[0];

		var viewRevisionLink = elementChild.href;
		var viewRevisionText = elementChild.textContent;
		var diffId = viewRevisionLink;

		if (diffId.indexOf("&oldid=") !== -1) {
			diffId = diffId.slice(diffId.indexOf("&oldid=") + 7);

			element.innerHTML = '<strong>' +
				'<a href="' + viewRevisionLink + '" title="' + pageName + '">' + viewRevisionText + '</a> (' +
				'<a href="' +
				wToolCore.getPathWithParams(pageName, {
					action: 'edit',
					oldid: diffId,
					summary:
					diffId != mw.config.get('wgCurRevisionId') ?
						'Editing old version [[Special:diff/' + diffId + '|' + diffId + ']]' :
						''
				}) +
				'" title="Edit revision ' + diffId + ' of ' + pageName + '">' + 'edit</a>' +
				'<span id="rev-2"></span> )</strong>';

			addLink(document.getElementById('rev-2'), diffId, true, false, false);

        }
	}


	if (mw.config.get("wgAction") == "history") {
		// For history pages
		var allElements = document.getElementsByClassName("mw-history-undo");
		
		for (var elementIndex in allElements) {
			var element = allElements[elementIndex];
			if (element.childNodes) {
				var link = element.childNodes[0].href;
				if (link.indexOf("&undo=") === -1) continue;
				link = link.slice(link.indexOf("&undo=") + 6);
				addLink(element, link);
			}
		}
	}

	mw.loader.addStyleTag(
		'@keyframes restorer-loading {' +
		'0%, 100% {content: " ⡁"} 16% {content: " ⡈"} 33% {content: " ⠔"} 50% {content: " ⠒"} 66% {content: " ⠢"} 83% {content: " ⢁"}}' +
		'.restorer-loading::after {white-space: pre; content: ""; animation: restorer-loading 0.5s infinite}'
	);
};
