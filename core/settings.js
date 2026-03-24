/*
	Config script
	This script handles user settings
*/
// Dependancies: core/settings_wiki_dependant.js,  lib/helpers.js




// Setup configuration settings
var wTools_config = window.wTools_config;
window.wTools_config = undefined;
if (wTools_config === undefined) wTools_config = {};


/*
	Whether or not to use an edit tag. User defined.
*/
wToolCore.settings.USE_EDIT_TAG = true;


/*
	The edit ad to use. User defined.
*/
wToolCore.settings.EDIT_SUMMARY_AD = do_default(wTools_config.editAd, " [Using [[w:meta:User:L10nM4st3r/wToolCore|wTools]]]");


/*
	Whether or not to use an edit ad. User defined.
*/
wToolCore.settings.EDIT_SUMMARY_AD_DISABLED = false;


/*
	Whether or not to use an edit ad. System defined.
*/
wToolCore.settings.USE_EDIT_SUMMARY_AD = true && Boolean(wToolCore.settings.EDIT_SUMMARY_AD) && wToolCore.settings.EDIT_TAG_TO_USE === undefined && !wToolCore.settings.EDIT_SUMMARY_AD_DISABLED;
wToolCore.settings.EDIT_AD_TO_USE = wToolCore.settings.USE_EDIT_SUMMARY_AD ? wToolCore.settings.EDIT_SUMMARY_AD : ""

/*
	Whether or not to use WikEdDiff. User defined.
*/
wToolCore.settings.USE_NEW_DIFF_SCREEN = true;


/*
	Whether or not speedy delete will redirect the user to the speedy delete page. User defined.
*/
wToolCore.settings.SPEEDY_DELETE_REDIRECTS = do_default(wTools_config.speedyDeleteShouldRedirect, false);


/*
	Whether or not the editor is enabled. User defined.
*/
wToolCore.settings.EDITOR_ENABLED = do_default(wTools_config.editorEnabled, true);


/*
	The edit summary for mass rollback. User defined.
*/
wToolCore.settings.ROLLBACK_ALL_EDIT_SUMMARY = do_default(wTools_config.rollbackAllEditSummary, "Reverted edits by [[Special:Contributions/$2|$2]] ([[User talk:$2|talk]]) to last version by $1 {reason} (Mass Rollback)");


/*
	The default reason for mass rollback. User defined.
*/
wToolCore.settings.ROLLBACK_ALL_DEFAULT_REASON = do_default(wTools_config.rollbackAllDefaultReason, "Vandalism");


/*
	Whether or not to show the diff after restoring a version. User defined.
*/
wToolCore.settings.ROLLBACK_SHOW_DIFF_AFTER_RESTORE = do_default(wTools_config.showDiff, true);


/*
	The text size of the editor. User defined.
*/
wToolCore.settings.EDITOR_TEXT_SIZE = do_default(wTools_config.editorTextSize, 12);


/*
	Whether or not the editor wraps text. User defined.
*/
wToolCore.settings.EDITOR_TEXT_WRAP = do_default(wTools_config.editorTextWrap, true);


/*
	Whether or not the editor highlights only text, and not the entire line. User defined.
*/
wToolCore.settings.EDITOR_HIGHLIGHTING_ONLY_TEXT = do_default(wTools_config.editorHighlightingOnlyText, true);


/*
	Whether or not to highlight the current line. User defined.
*/
wToolCore.settings.EDITOR_HIGHLIGHT_CURRENT_LINE = do_default(wTools_config.editorHighlightCurrentLine, true);


/*
	Whether or not to disable line numbers. User defined.
*/
wToolCore.settings.EDITOR_DISPLAY_LINE_NUMBERS = do_default(wTools_config.editorDisplayLineNumbers, true);


/*
	The scroll speed for the editor. User defined.
*/
wToolCore.settings.EDITOR_SCROLL_SPEED = do_default(wTools_config.editorScrollSpeed, 2.6);


/*
	Whether or not dragging text is enabled for the editor. User defined.
*/
wToolCore.settings.EDITOR_DRAG_ENABLED = do_default(wTools_config.editorDragEnabled, true);


/*
	Whether or not to show invisible characters in the editor. User defined.
*/
wToolCore.settings.EDITOR_SHOW_INVISIBLE_CHARACTERS = do_default(wTools_config.editorShowInvisibleCharacters, false);


/*
	Whether or not to show indent guides in the editor. User defined.
*/
wToolCore.settings.EDITOR_SHOW_INDENT_GUIDES = do_default(wTools_config.editorShowIndentGuides, false);


/*
	Whether or not to disable the live notifications. User defined.
*/
wToolCore.settings.DISABLE_LIVE_NOTIFICATIONS = do_default(wTools_config.disableLiveNotifications, false);


/*
	Whether or not to simulate being an admin. User defined. Debug only,
	this will show ui which are only displayed to admins, but they will not function.
*/
wToolCore.settings.SIMULATE_IS_ADMIN = do_default(wTools_config.debugSimulateAdmin, false);


/*
	Whether or not to simulate not being an admin. User defined. Debug only,
	this will show ui as if the user is not an admin, enabling options such as
	"mark for speedy delete" and disabling some other features.
*/
wToolCore.settings.SIMULATE_NOT_ADMIN = do_default(wTools_config.debugSimulateNotAdmin, false);

wToolCore.settings.USER_IS_ACTUALLY_ADMIN = wToolCore.containsAny(mw.config.get("wgUserGroups"), ["admin", "sysop", "bureaucrat", "steward", "global-admin", "global-sysop", "bot"])
wToolCore.settings.USER_IS_ADMIN = (wToolCore.settings.SIMULATE_IS_ADMIN || wToolCore.settings.USER_IS_ACTUALLY_ADMIN) && !wToolCore.settings.SIMULATE_NOT_ADMIN;

// Remove this from memory
wTools_config = undefined;
