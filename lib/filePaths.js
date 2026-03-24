/*
	Library script
	This script handles file paths
*/

//wToolCore.settings.SCRIPT = mw.config.get("wgScript");
//wToolCore.settings.SCRIPT_PATH = mw.config.get("wgServer") + wToolCore.settings.SCRIPT;


wToolCore.makeStringPathSafe = function(string) {
	return string.replace(/&/g, "%26").replace(/=/g, "%3D").replace(/\+/g, "%2B").replace(/\?/g, "%3F").replace(/'/g, "%27");
}


wToolCore.getArticlePath = function(title) {
	return (mw.config.get("wgServer") + mw.config.get("wgArticlePath")).replace("$1", wToolCore.makeStringPathSafe(title));
}


wToolCore.settings.PATH_SAFE_PAGE_NAME = wToolCore.makeStringPathSafe(mw.config.get("wgRelevantPageName"));