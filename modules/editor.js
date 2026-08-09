/*
	Module script
	This module add helpful tools for page moving.
*/
// Dependancies: core/settings.js, lib/userFeedback.js, lib/helpers.js, lib/editTools.js, lib/form.js, lib/queryTools.js, core/settings_wiki_dependant.js


var autocompletions;
var mwAPI = new mw.Api();

var wEditData = {
	// Is the user creating a new page
	is_new_page: false,
	// Is viewing source code, cannot edit
	is_viewing_source: false,
	// Used for showing changes
	old_text: "",
	// The section the user is editing. Will be -1 if editing the entire page.
	edit_section: "-1",

	// Used to decide edit conflicts
	currentRevId: mw.config.get("wgCurRevisionId"),
	currentRevTimestamp: "",
	editConflictText: "",
	thisText: "",
	editor: null,
	pageMetadata: "",
	isOldEditorMode: false
};



function wEditor_updateTimestamps(updateRevid) {
	updateRevid = do_default(updateRevid, true);
  
	var request = {
		action: "query",
		format: "json",
		prop: "revisions",
		titles: mw.config.get("wgPageName"),
		formatversion: "2"
	};
	if (!updateRevid) request.revids = wEditData.currentRevId;
	mwAPI.get(request).then(function(ret) {
		if (updateRevid) wEditData.currentRevId = ret.query.pages[0].revisions[0].revid;
		wEditData.currentRevTimestamp = ret.query.pages[0].revisions[0].timestamp;
	});
}


wToolCore.wEditor_textContent = function(value) {
	if (value) wEditData.editor.setValue(value);
	else return wEditData.editor.getValue();
};

if(wToolCore.settings.USE_EDITOR && (mw.config.get("wgAction") === "edit" || mw.config.get("wgAction") === "submit")) {
	{ // Setup for the wEditData values.
		var pageName = mw.config.get("wgPageName").toLowerCase().replace(/ /g, "_");
		
		if(wToolCore.pageTitle.toLowerCase().startsWith("view source for " + pageName))
			wEditData.is_viewing_source = true;
		if(wToolCore.pageTitle.toLowerCase().replace(/ /g, "_") === "creating_" + pageName)
			wEditData.is_new_page = true;
		
		if(location.href.includes("&section=")) {
			var href = location.href;
			href = href.slice(href.indexOf("&section=") + 9, href.length);
		
			// Make sure to strip additional arguments, such as "summary="
			if(href.includes("&")) href = href.slice(0, href.indexOf("&"));
			wEditData.edit_section = href;
		}
		
		
		if (wEditData.edit_section !== "new" && !wEditData.is_new_page) wEditor_updateTimestamps(false);
	}

	// Load the diff.js library.
	mw.loader.load("https://en.wikipedia.org/w/index.php?title=User:Cacycle/diff.js&action=raw&ctype=text/javascript");


	function wordDistance(word, typedWord, idx, totalWords) {
		if (!word || word === typedWord) return 0;
		var distance = Math.abs(typedWord.length - idx);
		var score = totalWords.length - distance;
		return score;
	}

	var autocompleteInsert = {
		insertMatch: function(editor, data) {
			var pos = editor.getSelectionRange().end;
			var typedLine = editor.session.getTextRange({start: pos, end: {row: pos.row, column: 0}});
			var prefix = getTypingPrefix(typedLine, pos.column);
			var trimRange = {start: {row: pos.row, column: typedLine.length - prefix.length}, end: {row: pos.row, column: typedLine.length}};
			
			var indentValue = language === "mediawiki" ?  " ".repeat(typedLine.length - prefix.length) : /^( |\t)*/.exec(typedLine)[0];
			
			// Remove the old text
			editor.session.remove(trimRange);
			editor.insert(data.insert.replace("$cursor", "").replace(/\$indent/g, indentValue !== undefined ? indentValue : ""));
			if (data.insert.includes("$cursor")) {
				var selectionIndex = data.insert.indexOf("$cursor") + (typedLine.length - prefix.length);
				editor.selection.setSelectionRange({start: {row: pos.row, column: selectionIndex}, end: {row: pos.row, column: selectionIndex}});
			}
		}
	};
	var linkAutocompleteInsert = {
		insertMatch: function(editor, data) {
			var pos = editor.getSelectionRange().end;
			var typedLine = editor.session.getTextRange({start: pos, end: {row: pos.row, column: 0}});
			var postCaret = editor.session.getLine(pos.row).slice(pos.column);
			
			var prefix = getTypingPrefix(typedLine, pos.column, /[=+-_\?\: \#\{\[a-zA-Z_0-9\.\$\-\u00A2-\uFFFF]/);
			
			
			var trimRange = {start: {row: pos.row, column: typedLine.length - prefix.length}, end: {row: pos.row, column: typedLine.length}};
					
			// Remove the old text
			editor.session.remove(trimRange);
			editor.insert(data.insert);
			
			if (postCaret.length === 0 || !data.insertExclude.includes(postCaret.charAt(0)))
				editor.insert(data.insertAppend);
		}
	};

	function getTypingPrefix(text, pos, regex) {
		if (!regex) regex = weditorPrefixRegex;
		var buf = [];
		for (var i = pos-1; i >= 0; i--) {
			if (!regex) return "";
			// Use custom regex to allow for custom auto-completion prefixes
			if (regex.test(text[i]))
				buf.push(text[i]);
			else break;
		}
		var output = buf.reverse().join("");
		
		if (language === "mediawiki") {
			var outputTest = output.toLowerCase();
			if (output.includes("[[") && !output.startsWith("[[")) output = output.slice(output.lastIndexOf("[["));
			if (output.includes("{{") && !output.startsWith("{{")) output = output.slice(output.lastIndexOf("{{"));
			if (output.includes("__") && !output.startsWith("__")) output = output.slice(output.lastIndexOf("__"));
			if (output.includes("<") && !output.startsWith("<")) output = output.slice(output.lastIndexOf("<"));
			if (outputTest.includes("#re") && !outputTest.startsWith("#re")) output = output.slice(outputTest.lastIndexOf("#re"));
		}
		
		return output;
	}

	function checkForLinkAutocomplete() {
		var pos = wEditData.editor.getSelectionRange();
		var output = getTypingPrefix(wEditData.editor.session.getTextRange({start: pos, end: {row: pos.row, column: 0}}), pos.column, /[=+\-\?\: \#\{\[a-zA-Z_0-9\.\$\/\-\u00A2-\uFFFF]/);
		if (output.length === 0 || !(output.includes("{{") || output.includes("[[")))
			return false;
		
		// Get the text after the opening link brackets
		var isTemplate = false;
		if (output.includes("[[")) output = output.slice(output.lastIndexOf("[[") + 2);
		if (output.includes("|") || (output.includes("{{{") && output.lastIndexOf("{{{") > output.lastIndexOf("{{") - 2)) // This is an argument..
			return false;
		
		if (output.includes("{{")) {
			output = output.slice(output.lastIndexOf("{{") + 2);
			isTemplate = true;
		}
		
		// Now get the actual link we are trying to type, namespace and all
		// Trim tags to allow proper linking of the page.
		output = output.replace(/<noinclude\/>/gi, "").replace(/<nowiki\/>/gi, "").replace(/<oncludeonly\/>/gi, "").replace(/<onlyinclude\/>/gi, "").trim();
		
		// Trim the semi-colon
		var hasColon = output.charAt(0) === ":";
		if (hasColon) output = output.slice(1);
		return output && output.charAt(0) !== ":";
	}
	function getWikilinkAutoCompletions(editor, session, pos, _prefix, callback) {
		var output = getTypingPrefix(session.getTextRange({start: pos, end: {row: pos.row, column: 0}}), pos.column, /[\/=+\-\?\: \#\{\[a-zA-Z_0-9\.\$\-\u00A2-\uFFFF]/);
		if (output.length === 0 || !(output.includes("{{") || output.includes("[["))) {
			callback(null, []);
			return;
		}
		// Get the text after the opening link brackets
		var isTemplate = false;
		if (output.includes("[[")) output = output.slice(output.lastIndexOf("[[") + 2);
		if (output.includes("|") || (output.includes("{{{") && output.lastIndexOf("{{{") > output.lastIndexOf("{{") - 2)) { // This is an argument..
			callback(null, []);
			return;
		}
		if (output.includes("{{")) {
			output = output.slice(output.lastIndexOf("{{") + 2);
			isTemplate = true;
		}
		
		// Now get the actual link we are trying to type, namespace and all
		// Trim tags to allow proper linking of the page.
		output = output.replace(/<noinclude\/>/gi, "").replace(/<nowiki\/>/gi, "").replace(/<oncludeonly\/>/gi, "").replace(/<onlyinclude\/>/gi, "").trim();
		
		// Trim the semi-colon
		var hasColon = output.charAt(0) === ":";
		if (hasColon) output = output.slice(1);
		if (!output || output.charAt(0) === ":") { // Invalid link
			callback(null, []);
			return;
		}
		
		var searchFor = output,
			searchForNamespace = getNamespaceFromText(output.slice(0, output.indexOf(":")));
		if (!output.includes(":")) searchForNamespace = -1;
		if (searchForNamespace === -1) { // No namespace specified
			if (isTemplate && !hasColon) searchForNamespace = 10;
			else searchForNamespace = 0;
		}
		else if (searchForNamespace !== 0) searchFor = searchFor.slice(searchFor.indexOf(":") + 1);
		
		var prefixTyped = (!output.includes(":") && searchForNamespace === 0 ? "" : output.slice(0, output.indexOf(":"))),
			isLowerCaseFirstBeforeColon = /^[a-z]/.test(searchFor) && searchForNamespace !== 0;

		mwAPI.get({
			"action": "query",
			"format": "json",
			"list": "allpages",
			"apprefix": searchFor,
			"apnamespace": searchForNamespace,
			"aplimit": 35
		}).then(function(ret) {
			var outputList = [];
			
			for (var i = 0; i < ret.query.allpages.length; i++) {
        var page = ret.query.allpages[i];
				var display = page.title;
        
				if (isTemplate && page.ns === 10) // This is a template, it may be undesirable for the "Template:" prefix to show in the results
					display = display.slice(display.indexOf(":") + 1);
				else if (page.ns !== 0) // Make sure to keep preserved the way namespaces were typed
					display = prefixTyped + ":" + display.slice(display.indexOf(":") + 1);
				
				if (hasColon) display = ":" + display;
				if (isLowerCaseFirstBeforeColon) display = display.slice(0, display.indexOf(":") + 1) + display.charAt(display.indexOf(":") + 1).toLowerCase() + display.slice(display.indexOf(":") + 2);
				
				if (!display.endsWith("/doc") || !isTemplate) outputList.push({
					value: (isTemplate ? "{{" : "[[") + display + (isTemplate ? "}}" : "]]"),
					meta: isTemplate ? "wikitemplate" : "wikilink",
					insert: (isTemplate ? "{{" : "[[") + display,
					insertExclude: isTemplate ? "|}" : "|]",
					insertAppend: (isTemplate ? "}}" : "]]"),
					completer: linkAutocompleteInsert,
					score: 500 - display.length
				});
			}
			
			callback(null, outputList);
		}, function(e) {
			callback(null, []);
		});
		return [];
	}
	function getAutoCompletions(editor, session, pos, prefix, callback) {
		if ((language === "mediawiki" && !(prefix.length === 0 || prefix.startsWith("__") || prefix.startsWith("{{") || prefix.startsWith("<") || prefix.toLowerCase().startsWith("#re"))) || !autocompletions) {
			callback(null, []);
			return;
		}
		
		var check = autocompletions;
		var output = [];
		
		var dotStack = prefix.split(".");
		var stackIndex = 0;
		var stackCheck = check;
		var identifierPrefix = "";
		if (dotStack.length > 1 && ["javascript", "lua"].includes(language)) {
			while (dotStack.length - 1 > stackIndex) {
				var val = dotStack[stackIndex];
				if (val in stackCheck && "inheritance" in stackCheck[val]) {
					stackCheck = stackCheck[val].inheritance;
					identifierPrefix += val + ".";
					stackIndex++;
				} else
					break;
			}
			if (dotStack.length - 1 === stackIndex)
				check = stackCheck;
		}
		
		var index = 0;
		var keys = Object.keys(check);
		for (var i = 0; i < keys.length; i++) {
      var checkItem = keys[i];
			var value = "value" in check[checkItem] ? check[checkItem].value : identifierPrefix + checkItem;
			var thisOut = {
				value: value,
				score: wordDistance(value, identifierPrefix + prefix, index, keys.length),
				meta: check[checkItem].meta
			};
			if ("insert" in check[checkItem]) {
				thisOut.completer = autocompleteInsert;
				thisOut.insert = check[checkItem].insert;
			}
			output.push(thisOut);
			index ++;
		}
		callback(null, output);
	}
	function getNamespaceFromText(text) {
		var DATA = mw.config.get("wgNamespaceIds");
		if(text.toLowerCase() in DATA)
			return DATA[text.toLowerCase().replace(/ /g, "_")];
		return -1;
	}


	////////////////////////////////////////
	// Load the editor UI
	function loadAll(files, done) {
		var index = 0;
		function doNext(){
			if (index >= files.length)
				done();
			else
				mw.loader.getScript(files[index]).then(doNext);
			index ++;
		}
		doNext();
	}

	var language = mw.config.get("wgPageContentModel");
	if (language === "sanitized-css") language = "css";
	else if (language === "Scribunto") language = "lua";
	// Default value
	else if (!["css", "javascript", "json"].includes(language)) language = "mediawiki";

	mw.loader.load("https://meta.wikimedia.org/w/index.php?title=User:L10nM4st3r/wToolCore/editor/" + language + "Autocomplete.js&action=raw&ctype=text/javascript");


	if(!wEditData.is_viewing_source) loadAll([
		"https://cdnjs.cloudflare.com/ajax/libs/ace/1.37.2/ace.js",
		"https://cdnjs.cloudflare.com/ajax/libs/ace/1.37.2/ext-language_tools.js",
		"https://cdnjs.cloudflare.com/ajax/libs/ace/1.37.2/ext-statusbar.js",
	], function() {
		var editTextBoxValue = document.getElementById("wpTextbox1").value;
		var actualEditBoxValue = editTextBoxValue;

		var editSummaryValue = document.getElementsByName('wpSummary')[0].value;
		if (mw.storage.get("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section + ":summary") != null)
			editSummaryValue = mw.storage.get("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section + ":summary");

		var sectionsEditedOnThisPage = (function() {try{return JSON.parse(mw.storage.get("wToolCore:editorCache-page:" + wToolCore.pageName + ":sections"));}catch(e){return [];}})();
		if (sectionsEditedOnThisPage == null || typeof sectionsEditedOnThisPage !== "object") sectionsEditedOnThisPage = [];
		

		if (!sectionsEditedOnThisPage.includes(wEditData.edit_section))
			sectionsEditedOnThisPage.push(wEditData.edit_section);
		
		mw.storage.set("wToolCore:editorCache-page:" + wToolCore.pageName + ":sections", JSON.stringify(sectionsEditedOnThisPage), 172800);


		var editform = document.getElementById("editform");
		editform.style.display = "none";

		// Adding autocompletion
		var autocompletion = window.require("ace/autocomplete/util");
		//var StatusBar = require("ace/ext/statusbar").StatusBar;
		autocompletion.retrievePrecedingIdentifier = getTypingPrefix;
		
		var langTools = window.require("ace/ext/language_tools");
		langTools.setCompleters([
			{
				getCompletions: getAutoCompletions
			},
			{
				getCompletions: getWikilinkAutoCompletions
			}
		]);
		
		wEditorContainer = document.createElement("div");
		wEditorContainer.innerHTML = wEditor_generateEditor();
		editform.parentNode.insertBefore(wEditorContainer, editform.nextNode);
		
		var tmp = getPageMetadata(editTextBoxValue);
		editTextBoxValue = tmp[0];
		wEditData.pageMetadata = tmp[1];
		wEditData.old_text = actualEditBoxValue;
		
		wEditData.editor = ace.edit("wedit-content", {
			mode: "ace/mode/" + language,
			autoScrollEditorIntoView: true,
			useSoftTabs: false,
			animatedScroll: false,
			scrollPastEnd: 0.5,
			wrap: wToolCore.settings.EDITOR_TEXT_WRAP,
			wrapMethod: "auto",
			selectionStyle: wToolCore.settings.EDITOR_HIGHLIGHTING_ONLY_TEXT ? "text" : "line",
			highlightActiveLine: wToolCore.settings.EDITOR_HIGHLIGHTING_ONLY_TEXT,
			showLineNumbers: wToolCore.settings.EDITOR_DISPLAY_LINE_NUMBERS,
			fontSize: wToolCore.settings.EDITOR_TEXT_SIZE,
			scrollSpeed: wToolCore.settings.EDITOR_SCROLL_SPEED,
			dragEnabled: wToolCore.settings.EDITOR_DRAG_ENABLED,
			showIndentGuides: wToolCore.settings.EDITOR_SHOW_INDENT_GUIDES,
			showInvisibles: wToolCore.settings.EDITOR_SHOW_INVISIBLE_CHARACTERS,
			enableBasicAutocompletion: true,
			enableLiveAutocompletion: true,
			enableSnippets: false
		});
		wEditData.editor.setValue(editTextBoxValue);
		wEditData.editor.gotoLine(0); // Unselects the text
		
		wEditData.editor.session.setUndoManager(new ace.UndoManager()); // Clear undo so it doesn't have some weird behaviour
		
		window.addEventListener("keydown", function(e) {
			if (e.key === "f" && e.altKey && !wEditData.isOldEditorMode) {
				e.preventDefault();
				wToolCore.wEditor_FullscreenToggle();
			}
			if (e.key === "o" && e.altKey) {
				e.preventDefault();
				wToolCore.wEditor_OldEditorToggle();
			}
			if (e.key === "w" && e.altKey && !wEditData.isOldEditorMode) {
				e.preventDefault();
				mw.notify("Trimmed trailing whitespace.");
				var value = wToolCore.wEditor_textContent().split("\n");
				
				for (var line = 0; line < value.length; line++)
					value[line] = value[line].trimEnd();
				
				wEditData.editor.setValue(value.join("\n"));
			}
		});
		
		setTimeout(function() {
			// Load the folding metadata
			for (var i = 0; i < wEditData.pageMetadata.folding.length; i++) {
				var foldData = wEditData.pageMetadata.folding[i];
						wEditData.editor.session.$toggleFoldWidget(foldData - 1, {});
			}
					
			if (mw.storage.get("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section + ":cursorPos") != null) {
				var cursorPos = mw.storage.get("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section + ":cursorPos").split(",");
				wEditData.editor.gotoLine(parseInt(cursorPos[1]));
				wEditData.editor.moveCursorTo(parseInt(cursorPos[0]), parseInt(cursorPos[1]));
			}
			wEditData.editor.focus();



			// Also use this to load the text backup
			if (mw.storage.get("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section) != null){
				mw.notify("There is text stored in the local backup!");
				document.getElementById("wEditor-restore-text-backup").style.display = "inline";

				document.getElementById("wEditor-restore-text-backup").onclick = function(){
					document.getElementById("wEditor-restore-text-backup").style.display = "none";

					wEditData.editor.setValue(mw.storage.get("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section));
				}

			}

		}, 500); // Wait half a second to update code folding
		wEditData.editor.session.selection.on('changeCursor', function() {
			var cursorPos = wEditData.editor.getCursorPosition();
			mw.storage.set("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section + ":cursorPos", cursorPos.row + "," + cursorPos.column, 172800); // Expires in 2 days
		});
		wEditData.editor.on("change", function(obj) {
			setTimeout(function() {
				try{

				mw.storage.set("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section, wEditor_getPageMetadataValue(wToolCore.wEditor_textContent()), 172800); // Expires in 2 days

				if (obj.action === "insert" && obj.lines.length === 1 && obj.lines[0].length === 1) {
					if (
						// Check that the user is typing a link or template
						(obj.lines[0] === " " && checkForLinkAutocomplete()) ||
						// Check that the user is typing sutable characters for an autocompletion
						(language === "mediawiki" ? /[<\:a-zA-Z\{\[\#]/ : /[\.a-zA-Z]/).test(obj.lines[0])
					) {
						if(!obj.lines[0].endsWith(":") || language !== "mediawiki") wEditData.editor.execCommand("startAutocomplete");
					}
				}
				else if (obj.action === "remove") {
					// TODO: make this only happen if the user is typing a link
					if (checkForLinkAutocomplete() && obj.start.row === obj.end.row && obj.start.column > 0 && obj.start.column === obj.end.column - 1)
						wEditData.editor.execCommand("startAutocomplete");
				}
				}catch(e){mw.notify("Error during text change: " + e);}
			}, 15);
		});
		
		document.getElementById("wedit-summary").value = editSummaryValue;
		document.getElementById("wedit-summary").addEventListener("keydown", wEditor_summaryOnKeyPress);
		document.getElementById("wedit-templatesUsed").appendChild(document.getElementsByClassName("templatesUsed")[0]);
	});


	function wEditor_generateEditor() {
		var header = '<style>' +
'.unselectable{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;}' +
'.checkbox{margin-left:10px;margin-right:7px}' +
'.ace_status-indicator{color:#2e2e2e;position:absolute;right:1em;border-left:#ebebeb 1px solid}' +
'.status_indicator_background{height:1.1em;padding-top:0.1em}' +
'.editorTextboxBackground{border-top:1px double black;border-bottom:1px double black;flex:1}' +
'.wEditorEditorBackground{background:#ebebeb;padding:3px 0 4px 0;width:100%;height:100%;display:flex;flex-direction:column}</style>';

		var textbox = '<div class="editorTextboxBackground"><div id="wedit-content" style="height:100%;min-height:15em"></div></div><div class="status_indicator_background"><div id="statusBar"></div></div>';

		var output = "";

		if(wEditData.edit_section === "new")
			output = header + wEditor_generateSubjectBar() + textbox + wEditor_generateSubmitBar();
		else
			output = header + textbox + wEditor_generateSubmitBar();

		return '<div id="wEditor_fullEditor" style="height:45em"><div class="wEditorEditorBackground"><div style="display:static"><button onclick="wToolCore.wEditor_FullscreenToggle()" title="Toggle fullscreen. Shortcut: Alt+F">Fullscreen</button><button onclick="wToolCore.wEditor_OldEditorToggle()" title="Open old editor. Shortcut: Alt+O">Open Old Editor</button><button id="wEditor-restore-text-backup" style="display:none">Restore text backup</button></div>' + output + '</div><div id="wedit-editConflictContent"></div><div style="min-height:160px" id="wedit-previewContent"></div><div id="wedit-templatesUsed"></div>';
	}
	function wEditor_generateSubmitBar() {
		if(wEditData.is_viewing_source) return "";

		var editSummaryInput = '<input style="flex:1" id="wedit-summary" title="Enter a short summary" placeholder="' + (wEditData.is_new_page ? "Summary" : "Edit Summary") + '" type="text" maxlength="400"></input>';

		var editSummaryClear = '<input style="cursor:pointer; display:inline; width:2em" id="wedit-summary-clear" title="Clear summary" type="button" value="X" onclick="document.getElementById(\'wedit-summary\').value=\'\'; document.getElementById(\'wedit-summary\').focus();"></input>';

		var minorEdit = document.getElementById("wpMinoredit") == undefined ? "" : '<label class="unselectable" for="wedit-minor"><input id="wedit-minor" name="wedit-minor"' + (document.getElementById("wpMinoredit").checked ? " checked=true" : "") + ' class="checkbox" type="checkbox"></input>Minor Edit</label>';

		var watchPageToggle = '<label class="unselectable" for="wedit-watch"><input id="wedit-watch" name="wedit-watch"' + (document.getElementById("wpWatchthis").checked ? " checked=true" : "") + ' class="checkbox" type="checkbox"></input>Watch This Page</label>';


		var saveEdit = '<input style="cursor:pointer; background: linear-gradient(0.99turn, #6daafc, #ebeef2); display:inline; flex:1; height: 2em" id="wedit-save-edit" title="' + (wEditData.is_new_page ? "Save this page" : "Save your changes") + '" type="button" value="Save' + (wEditData.is_new_page ? "" : " Changes") + '" onclick="wToolCore.wEditor_saveEdit();"></input>';

		var previewPage = '<input style="cursor:pointer; display:inline; flex:1; height: 2em" id="wedit-show-preview" title="Preview your changes" type="button" value="Show Preview" onclick="wToolCore.wEditor_showPreview();"></input>';

		var viewChanges = wEditData.is_new_page ? "" : '<input style="cursor:pointer; display:inline; flex:1; height: 2em" id="wedit-show-showChanges" title="Show which changes you made to the text" type="button" value="Show Changes" onclick="wToolCore.wEditor_showChanges();"></input>';


		var editSummaryBar = '<div style="display:flex; margin: 6px 3px 6px 3px;">' + editSummaryClear + editSummaryInput + '</div>';
		var saveButtonsBar = '<div style="display:flex; margin: 6px 3px 6px 3px;">' + saveEdit + previewPage + viewChanges + '</div><p><a style="margin-left:10px" onclick="wToolCore.wEditor_cancelPressed();" title="Cancel this edit. Note: all unsaved changes will not be saved in the local backup!">Cancel</a></p>';

		if(wEditData.edit_section === "new") return '<div style="static">' + minorEdit + watchPageToggle + "</div>" + saveButtonsBar;
		return editSummaryBar + '<div style="static">' + minorEdit + watchPageToggle + "</div>" + saveButtonsBar;
	}
	function wEditor_generateSubjectBar() {
		var editSummaryInput = '<input style="flex:1" id="wedit-summary" title="What subject you are talking about" placeholder="Subject" type="text" maxlength="400"></input>';

		var editSummaryClear = '<input style="cursor:pointer; display:inline; width:2em" id="wedit-summary-clear" title="Clear summary" type="button" value="X" onclick="document.getElementById(\'wedit-summary\').value=\'\'; document.getElementById(\'wedit-summary\').focus();"></input>';
		return '<div style="display:flex; margin: 6px 3px 6px 3px;">' + editSummaryClear + editSummaryInput + '</div>';
	}
	function getPageMetadata(text) {
		var output = {folding: []};
		
		if (language === "json") return [text, output];
		
		var commentContent = ""; // The content to parse into the output
		var prefix = "";
		var suffix = "";
		
		// Grab the metadata comment.
		if (/^<noinclude><!--%data%.*--><\/noinclude>/.test(text)) { // Grab comment as wikitext comment
			commentContent = text.match(/^<noinclude><!--%data%(.*)--><\/noinclude>/)[1];
			text = text.replace(/^<noinclude><!--%data%.*--><\/noinclude>/, "");
			prefix = "<noinclude><!--";
			suffix = "--></noinclude>";
		} else if (/^\/\*%data%.*\*\//.test(text)) { // Grab comment as wikitext comment
			commentContent = text.match(/^\/\*%data%(.*)\*\//)[1];
			text = text.replace(/^\/\*%data%.*\*\//, "");
			prefix = "/*";
			suffix = "*/";
		} else if (/^--\[\[%data%.*\]\]--/.test(text)) { // Grab comment as lua comment
			commentContent = text.match(/^--\[\[%data%(.*)\]\]--/)[1];
			text = text.replace(/^--\[\[%data%.*\]\]--/, "");
			prefix = "--[[";
			suffix = "]]--";
		}

		if (!prefix) {
		if (/^<noinclude><!--%fold%--><\/noinclude>/m.test(text)) { // Grab comment as wikitext comment
				prefix = "<noinclude><!--";
				suffix = "--></noinclude>";
			} else if (/^\/\*%fold%\*\//m.test(text)) { // Grab comment as wikitext comment
				prefix = "/*";
				suffix = "*/";
			} else if (/^--\[\[%fold%\]\]--/m.test(text)) { // Grab comment as lua comment
				prefix = "--[[";
				suffix = "]]--";
			}
		}

		
		if (prefix) while (text.includes(prefix + "%fold%" + suffix)) {
			var preText = text.slice(0, text.indexOf(prefix + "%fold%" + suffix));
			output.folding.push(preText.split("\n").length);
			text = text.replace(prefix + "%fold%" + suffix, "");
		}
		
		if (!commentContent) return [text, output];
		commentContent += ";";
		var key = "";
		while (commentContent.length > 0 && commentContent.includes(";")) {
			commentContent = commentContent.trim();
			
			/*if (commentContent.startsWith("%folding%")) {
				commentContent = commentContent.slice(9);
				key = "folding";
			}*/
			if (key in output) {
				var nextValue = commentContent.slice(0, commentContent.indexOf(";")).trim();
				commentContent = commentContent.slice(commentContent.indexOf(";") + 1).trim();
				if (nextValue) output[key].push(nextValue);
			}
			
			// Remove all invalid values
			else if (commentContent.startsWith("%")) {
				commentContent = commentContent.slice(commentContent.indexOf("%", 1) + 1).trim();
				key = "";
			} else {
				commentContent = commentContent.slice(commentContent.indexOf(";") + 1).trim();
			}
		}
		return [text, output];
	}
}


wToolCore.wEditor_showChanges = function() {
	var wikEdDiff = new WikEdDiff();
	document.getElementById('wedit-previewContent').innerHTML = wikEdDiff.diff(wEditData.old_text, wToolCore.wEditor_textContent());
}
wToolCore.wEditor_showPreview = function() {
	document.getElementById("wedit-show-preview").disabled = true;
	// prepare ajax preview
	var bodyData = wToolCore.wEditor_textContent();
	// make the AJAX request
	AjaxPreview(bodyData, LocalPreviewAjaxHandler, function() {
		document.getElementById("wedit-show-preview").disabled = false;
	});
}
function wEditor_summaryOnKeyPress(event) {
	// If user pressed the enter key in the summary box, post the edit.
	// If this is a new section edit, instead focus onto the textbox
	if(event.key === "Enter") {
		if (wEditData.edit_section === "new")
			wEditData.editor.focus();
		else
			setTimeout(wToolCore.wEditor_saveEdit, 1);
	}
	else {
		setTimeout(function() {mw.storage.set("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section + ":summary", document.getElementById("wedit-summary").value, 172800);}, 1);
	}
}
function wEditor_getPageMetadataValue(text) {
	if (language === "json") return text;
	
	var output = "";
	var prefix = "";
	var suffix = "";
	if (language === "javascript" || wEditData.language === "css") {prefix = "/*"; suffix = "*/"}
	else if (language === "lua") {prefix = "--[["; suffix = "]]--"}
	else if (language === "mediawiki") {prefix = "<noinclude><!--"; suffix = "--></noinclude>"}

	var lines = text.split("\n");
	
	var folding = wEditData.editor.session.$foldData;
  
	for (var i = 0; i < folding.length; i++) {
    var fold = folding[i];
		// Insert a fold token at the line with the code folding.
		lines[fold.start.row] = prefix + "%fold%" + suffix + lines[fold.start.row];
	}
	
	text = lines.join("\n");

	if (!output) return text;
	return prefix + "%data%" + text + suffix;
}
wToolCore.wEditor_cancelPressed = function() {
	wToolCore.createForm("Unsaved changes will be lost", [{type:"label",text:"Changes you make are stored as a backup on your device, and removed when you press save or cancel. By pressing cancel, all the unsaved changes you have made to this page will be forgotten. Are you sure you want to proceed?"}], {cancelText: "Back", submitText: "Continue", onSubmit: function(dialog) {
		dialog.close({ action: "submit" });
		wEditor_returnToPage();
	}});
}
function wEditor_returnToPage(pageContent) {
	var sectionsEditedOnThisPage = JSON.parse(mw.storage.get("wToolCore:editorCache-page:" + wToolCore.pageName + ":sections"));
	if (sectionsEditedOnThisPage == null) sectionsEditedOnThisPage = [];
	
	if (wEditData.edit_section == "-1") {
		for (var i = 0; i < sectionsEditedOnThisPage.length; i++) {
      var section = sectionsEditedOnThisPage[i];
			mw.storage.remove("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + section);
			mw.storage.remove("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + section + ":summary");
			mw.storage.remove("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + section + ":cursorPos");
		}
		
		mw.storage.remove("wToolCore:editorCache-page:" + wToolCore.pageName + ":sections");
	} else {
		sectionsEditedOnThisPage = sectionsEditedOnThisPage.filter(function(item) {return item !== wEditData.edit_section});
		mw.storage.set("wToolCore:editorCache-page:" + wToolCore.pageName + ":sections", sectionsEditedOnThisPage, 172800);
		
		mw.storage.remove("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section);
		mw.storage.remove("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section + ":summary");
		mw.storage.remove("wToolCore:editorCache-page:" + wToolCore.pageName + "-section:" + wEditData.edit_section + ":cursorPos");
	}
	
	location.href = "https://" + mw.config.get("wgServerName") + "/w/index.php?redirect=no&title=" + wToolCore.makeStringPathSafe(wToolCore.pageName);
}

wToolCore.wEditor_saveEdit = function() {
	var pageContent = wEditor_getPageMetadataValue(wToolCore.wEditor_textContent());
	
	// Make sure the user can't spam the save button, which may cause unexpected behaviour.
	document.getElementById("wedit-save-edit").disabled = true;

	// Create this page
	if(wEditData.is_new_page) {
		mwAPI.create(mw.config.get("wgPageName"), {
			summary: document.getElementById('wedit-summary').value,
			watchlist: document.getElementById("wedit-watch").checked ? "watch" : "unwatch"
		}, pageContent).then(function() {wEditor_returnToPage(pageContent);}, function(e) {
			mw.notify("Cannot save page. Error: " + e);
		});
		// Editing the entire page
	} else {
		if(wEditData.edit_section === "new") {
			wEditor_doSaveEdit();
			return;
		}
		
		wEditor_doSaveEdit();
	}
}
function wEditor_doSaveEdit(forceEdit) {
	forceEdit = do_default(forceEdit, false);
  
	var pageContent = wEditor_getPageMetadataValue(wToolCore.wEditor_textContent());
	var isMinorEdit = document.getElementById("wedit-minor") == undefined ? false : document.getElementById("wedit-minor").checked;
	
	
	function handleEditConflict() {
		wEditor_updateTimestamps();
		var request = {
			action: "parse",
			format: "json",
			page: mw.config.get("wgPageName"),
			prop: "wikitext",
			formatversion: "2"
		};
		if (wEditData.edit_section !== "-1") request.section = wEditData.edit_section;
		
		mwAPI.get(request).then(function(ret) {
			if (ret.parse.wikitext.trim() === wEditData.old_text.trim()) {
				wEditor_doSaveEdit(true);
				return;
			}
			var wikEdDiff = new WikEdDiff();
			var wikEdDiff2 = new WikEdDiff();
			
			wEditData.editConflictText = ret.parse.wikitext;
			wEditData.thisText = wToolCore.wEditor_textContent();
			
			document.getElementById('wedit-editConflictContent').innerHTML = '<h2>Edit conflict! <a style="font-size:70%; float:right" onclick="document.getElementById(\'wedit-editConflictContent\').innerHTML=\'\'">hide</a></h2><div style="display:flex"><input type="button" style="flex:1" title="Replace edit box with my version" value="Replace with my version" onclick="wToolCore.wEditor_textContent(wEditData.thisText)"></input><input type="button" style="flex:1" title="Replace edit box with new version" value="Replace with new version" onclick="wToolCore.wEditor_textContent(wEditData.editConflictText)"></input></div><p>Difference between your version and new version:</p>' + wikEdDiff.diff(wEditData.thisText, wEditData.editConflictText) + '<p>Difference between old version and new version:</p>' + wikEdDiff2.diff(wEditData.old_text, wEditData.editConflictText);
			document.getElementById("wedit-save-edit").disabled = false;
		}, function(e) {
			document.getElementById("wedit-save-edit").disabled = false;
			mw.notify("Error getting edit conflict text: " + e);
		});
	}
	function handleError(error) {
		document.getElementById("wedit-save-edit").disabled = false;
		if (error === "editconflict") {
			handleEditConflict();
			return;
		}
		mw.notify("Cannot save page. Error: " + error);
	}
	
	var revisionOutput = {
		text: pageContent,
		summary: document.getElementById('wedit-summary').value,
		minor: isMinorEdit,
		watchlist: document.getElementById("wedit-watch").checked ? "watch" : "unwatch"
	};
	if (!forceEdit) {
		revisionOutput.basetimestamp = wEditData.currentRevTimestamp;
		revisionOutput.baserevid = wEditData.currentRevId;
	}
	
	if(wEditData.edit_section === "-1") {
		mwAPI.edit(mw.config.get("wgPageName"), function(revision) {
			return revisionOutput
		}).then(function() {wEditor_returnToPage(pageContent);}, function(e) {
			handleError(e);
		});
	// Editing a specific section - Do not save metadata
	} else {
		mwAPI.edit(mw.config.get("wgPageName"), function(revision) {
			revisionOutput.section = wEditData.edit_section;
			if (wEditData.edit_section === "new") {
				revisionOutput.sectiontitle = document.getElementById('wedit-summary').value;
				revisionOutput.summary = "/*" + document.getElementById('wedit-summary').value + "*/ New section";
			}
			return revisionOutput;
		}).then(function() {wEditor_returnToPage(pageContent);}, function(e) {
			handleError(e);
		});
	}
}
function AjaxPreview(textValue, ResponseHandler, FailHandler) {
	var pageName = mw.config.get("wgPageName");
	var editform = document.getElementById('editform');

	// prepare the url
	var requestUrl;
	if(editform != null) {
		requestUrl = editform.action.replace(/\?.*()/, '');
		if(/:\/\/()/.test(requestUrl) === false)
			requestUrl = window.location.protocol + '//' + window.location.host + requestUrl;
	} else if(mw.config.get("wgScriptPath") !== undefined)
		requestUrl = mw.config.get("wgScriptPath") + '/index.php';
	else {
		requestUrl = window.location.href;
		requestUrl = requestUrl.replace(/\?.*()/, '');
		requestUrl = requestUrl.replace(/\/[\w\.]*$/, '/index.php');
	}

	// prepare the form fields
	var postFields = {};
	if(pageName !== null && mw.config.get("wgNamespaceNumber") != -1)
		postFields.title = pageName;
	else
		postFields.title = 'wEditor_Preview';
	postFields.action = 'submit';
	postFields.wpTextbox1 = textValue;

	var starttime = document.getElementsByName('wpStarttime')[0];
	var edittime = document.getElementsByName('wpEdittime')[0];
	var edittoken = document.getElementsByName('wpEditToken')[0];
	var autosummary = document.getElementsByName('wpAutoSummary')[0];

	if(starttime != null)
		postFields.wpStarttime = starttime.value;
	if(edittime != null)
		postFields.wpEdittime = edittime.value;
	if(edittoken != null)
		postFields.wpEditToken = edittoken.value;
	if(autosummary != null)
		postFields.wpAutoSummary = autosummary.value;
	postFields.wpPreview = 'true';

	// AJAX non-API request
	simpleAjaxRequest('POST', requestUrl, postFields, 'text/plain', ResponseHandler, FailHandler);
}
function LocalPreviewAjaxHandler(ajax) {
	// get response
	var html = ajax.responseText;

	// API reponse
	if(html.indexOf('<api>') != -1)
		html = StringGetInnerHTML(html, 'text', '')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&amp;/g, '&');

	// full preview page
	else
		// get preview html
		html = StringGetInnerHTML(   StringGetInnerHTML(html, 'div', 'id', 'wikiPreview', true)   , 'div', 'class', 'previewnote', true, false, true)
			.replace(/<!--(.|\n)*?-->/g, '')
			.replace(/\s+$/g, '');

	// clean form elements as these could interfere with the submit buttons
	document.getElementById('wedit-previewContent').innerHTML = html.replace(/<\/?form\b[^>]*>/gi, '')
		.replace(/<input\b[^>]*?\btype\s*=\s*["']?hidden["']?[^>]*>/gi, '')
		.replace(/<input\b([^>]*)>/gi,
		function(p, p1) {
			p1 = p1.replace(/\bname\s*=\s*([^"'`=]+|\'[^'=]*\'|\"[^"=]*\")/gi, '');
			return p1;
		}
	)
	// remove cite errors for automatic section preview refs
		.replace(/(<div\b[^>]*?\bclass="wikEdPreviewRefs"[^>]*>(.|\n)*$)/gi,
		function(p, p1, p2) {
			p1 = p1.replace(/<strong\b[^>]*?\bclass="error"[^>]*>(.|\n)*?<\/strong>/g, '');
			return p1;
		}
	);
	document.getElementById("wedit-show-preview").disabled = false;

	// init sortable tables (wikibits.js)
	if(typeof window.sortables_init == 'function')
		window.sortables_init();

	// init collapsible tables (common.js)
	if(typeof window.createCollapseButtons == 'function')
		window.createCollapseButtons();

	// fire mediawiki hook to apply changes to preview content: <categorytree>, <math>
	if(window.mw !== undefined && window.mw.hook !== undefined && window.mw.hook('wikipage.content').fire !== undefined)
		window.mw.hook('wikipage.content').fire($('#wikEdPreviewArticle'));
}
function StringGetInnerHTML(html, tag, attrib, value, defaultToWholeHTML, getBeforeHTML, getAfterHTML) {
	var startPos;
	var startLength;
	var endPos;
	var endLength;
	var level = 0;
	var string;

	var attribValue = '';
	if(attrib !== '')
		attribValue = '[^>]*?' + attrib + '\\s*=\\s*("|\\\')?' + value + '\\1';
	var regExpStart = new RegExp('<' + tag + '\\b' + attribValue + '[^>]*>', 'gi');
	var regExpMatch;
	if((regExpMatch = regExpStart.exec(html)) !== null) {
		startPos = regExpMatch.index;
		startLength = regExpMatch[0].length;
		var regExpParse = new RegExp('<(\\/?)' + tag + '\\b[^>]*>', 'g');
		regExpParse.lastIndex = startPos;
		while((regExpMatch = regExpParse.exec(html)) !== null) {
			var p1 = regExpMatch[1] || '';
			if(p1 === '')
				level++;
			else {
				level--;
				if(level === 0) {
					endPos = regExpMatch.index;
					endLength = regExpMatch[0].length;
					break;
				}
			}
		}
	}

	// return whole html if node does not exist
	if(endPos === undefined && defaultToWholeHTML)
		string = html;

	// return text before node
	else if(getBeforeHTML === true)
		string = html.substr(0, startPos);

	// return text after node
	else if(getAfterHTML === true)
		string = html.substr(endPos + endLength);

	// return innerHTML of node
	else
		string = html.substring(startPos + startLength, endPos);

	return string;
}


var wEditor_isFullscreen = false;
var wEditorContainer;
wToolCore.wEditor_FullscreenToggle = function() {
	wEditor_isFullscreen = !wEditor_isFullscreen;
	var fullEditor = document.getElementById("wEditor_fullEditor");
	if (wEditor_isFullscreen) {
		document.documentElement.appendChild(fullEditor);
		fullEditor.style = "position:fixed; width: 100%; height: 100%; top: 0; left: 0; z-index: 50";
	} else {
		fullEditor.style = "height:45em";
		wEditorContainer.appendChild(fullEditor);
	}
}
wToolCore.wEditor_OldEditorToggle = function() {
	var editform = document.getElementById('editform');
	
	if (wEditData.isOldEditorMode) { // Open the new editor
		wEditData.isOldEditorMode = false;
		// Hide the old editor, move to the new one
		editform.style.display = "none";
		wEditorContainer.style.display = "block";
		
		// Load the old editor content into the new editor
		var editTextBoxValue = document.getElementById("wpTextbox1").value;
		editTextBoxValue = document.getElementById("wpTextbox1").value;
		var tmp = getPageMetadata(editTextBoxValue);
		editTextBoxValue = tmp[0];
		wEditData.pageMetadata = tmp[1];
		
		wEditData.editor.setValue(editTextBoxValue);
		wEditData.editor.gotoLine(0);
		
		setTimeout(loadMetadata, 150);
	}
	else { // Open the old editor (has a few benefits, such as spell-checking)
		wEditData.isOldEditorMode = true;
		// Exit fullscreen
		if (wEditor_isFullscreen) wToolCore.wEditor_FullscreenToggle();
		// Hide the new editor, move to the old one
		editform.style.display = "block";
		wEditorContainer.style.display = "none";
		
		// Set the old editor's content
		var pageContent = wEditor_getPageMetadataValue(wToolCore.wEditor_textContent());
		document.getElementById("wpTextbox1").value = pageContent;
		document.getElementById("wpTextbox1").selectionStart = 0;
		document.getElementById("wpTextbox1").selectionEnd = 0;
		document.getElementById("wpTextbox1").scrollTop = 0;
	}
}