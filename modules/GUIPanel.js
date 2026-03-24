/*
	Module script
	This module adds the "GUI Panel"
*/
// Dependancies: core/settings.js, lib/form.js


var wToolCore_hasChangeNotes = false;

wToolCore.onGUIPanelPressed = function() {
	// Remove this `true` part once I add the full settings UI.
	if (wToolCore_hasChangeNotes || true) {
		wToolCore_hasChangeNotes = false;
		mw.storage.set("wToolsVersionData", W_TOOLS_VERSION_ID);
		document.getElementById("wToolCore_GUI_BUTTON_IMAGE").setAttribute("src", 'https://upload.wikimedia.org/wikipedia/commons/4/49/QuickQuokka%27s_bluelink_file_test.svg');
		

		wToolCore.createForm(
			"Changelog for wTools",
			[
				{
					type: "label",
					text: "Version: " + W_TOOLS_VERSION_STRING + " (build ID : " + W_TOOLS_VERSION_ID + ")"
				},
				{
					type: "list",
					items: W_TOOLS_CHANGELOG
				}
			]
		)
	}

}



{
	// wTools GUI
	var lastUsedVersion = mw.storage.get("wToolsVersionData");

	if (lastUsedVersion == undefined || lastUsedVersion < W_TOOLS_VERSION_ID) {
		wToolCore_hasChangeNotes = true;
	}
	else {
		// Make sure the cookies dont expire
		mw.storage.set("wToolsVersionData", W_TOOLS_VERSION_ID);
	}




	var wToolGUIPanel = document.createElement("div");
	wToolGUIPanel.id = "wToolCore_GUI_BUTTON";
	wToolGUIPanel.style = "cursor:pointer;position:fixed;right:0px;bottom:0px;background:white;border:solid 1px black;";
	wToolGUIPanel.title = "wTool Menu";

	wToolGUIPanel.innerHTML = '<img id="wToolCore_GUI_BUTTON_IMAGE" style="pointer-events:none" width="32" alt="wTools" src="' +
					(wToolCore_hasChangeNotes ? 
						'https://upload.wikimedia.org/wikipedia/commons/4/41/Red_circle.gif' :
						'https://upload.wikimedia.org/wikipedia/commons/4/49/QuickQuokka%27s_bluelink_file_test.svg')
			+ '">';
	document.body.appendChild(wToolGUIPanel);
	wToolGUIPanel.addEventListener("click", function(){wToolCore.onGUIPanelPressed()});
}