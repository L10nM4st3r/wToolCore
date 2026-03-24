// <nowiki>

/*
	Main script
*/
// Dependancies: core/settings.js, modules/__importer__.js


var W_TOOLS_VERSION_ID = 1;
var W_TOOLS_VERSION_STRING = "2.0";
var W_TOOLS_CHANGELOG = [
	"Complete code refactor.",
	"Fixed several bugs with a few of the tools.",
	"Added this little changelogs button you see here.",
	"This button will be used to open a settings GUI once I code that in.",
	"Meaning no more having to set settings by editing your user script.",
	"Added a Vote for delete button.",
	"Settings GUI update coming in October 19th 2035."
];

/*
   TODO LIST

   * Add checkbox to delete page to delete all redirects
   * Add GUI settings screen
   * Add the vs code extension as an extension
   * Integrate the template remover. It should be a button a user presses on a UI, and it loads the script seperatly with a large GUI editor (ensure to save all parameters as JSON in user storage).

*/


console.log("Loaded wTools");
var wToolCore = {
	settings: {},
	DEBUG: false
}
window.wToolCore = wToolCore;
var do_default = function(value, default_value) {
	return value === null || value === undefined ? default_value : value;
}


mw.loader.using(["mediawiki.util", "mediawiki.storage", "mediawiki.api", "oojs"]).done(function() {
	console.log("Loaded wTools dependencies.");
////// +++++++ IMPORT SCRIPTS HERE +++++++ //////
})



var wikEdDiffConfig = {
	clipLinesRightMax: 4,
	clipLinesLeftMax: 2
};
if (wToolCore.settings.USE_NEW_DIFF_SCREEN && (location.href.indexOf("&diff=") !== -1 || location.href.indexOf("&oldid=") !== -1)) {
	// WikEdDiff extension
	mw.loader.load('https://en.wikipedia.org/w/index.php?title=User:Cacycle/wikEdDiff.js&action=raw&ctype=text/javascript');
}



// No mobile view
if(window.location.href.match(/^https?:\/\/[^.]+\.m\./)) {
	var desktopUrl = $('#mw-mf-display-toggle').attr('href');
	if(desktopUrl) window.location.href = desktopUrl;
}



// </nowiki>