//<nowiki>

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
/*

	Config script

	This script handles wiki-dependant settings

*/

// Dependancies: lib/filePaths.js





// PAGE_NAME = mw.config.get("wgRelevantPageName")

// NAMESPACE = mw.config.get("wgNamespaceNumber")





// Relevant page namespace

wToolCore.settings.VIEWING_NAMESPACE = !mw.config.get("wgRelevantPageName") ? -1 : mw.config.get("wgNamespaceIds")[mw.config.get("wgRelevantPageName").slice(0, mw.config.get("wgRelevantPageName").indexOf(":")).toLowerCase()];



// Page name, but with underscores replaced with spaces

//wToolCore.settings.PAGE_TITLE = mw.config.get("wgRelevantPageName").replace(/_/g, " ").replace(mw.config.get("wgFormattedNamespaces")[mw.config.get("wgNamespaceNumber")] + ":", "");



// This does not include every special page, just certain ones which have a related page or user.

//const IS_SPECIAL_PAGE = !(wTools.namespace >= 0 || [

//	"contributions", "userrights", "protectpage", "purge",

//	"deletepage", "pageinfo", "permamentlink"

//].includes(mw.config.get("wgCanonicalSpecialPageName").toLowerCase()));



/*

	The tag to use for this wiki.

	If null, this wiki does not have a tag for this tool.

*/

wToolCore.settings.EDIT_TAG_TO_USE = {

	"en.uncyclopedia.co": "1337 H4X"

}[mw.config.get("wgServerName")];

if (!wToolCore.settings.EDIT_TAG_TO_USE) wToolCore.settings.EDIT_TAG_TO_USE = "";





//var wTools = {

	//isPageWatched: document.getElementById("ca-watch") !== null,

	//canProtectPage: mw.config.get("wgRestrictionEdit") !== null,

//};









wToolCore.perWikiConfig = {

	"en.uncyclopedia.co": {

		VFD: {

			target_page: "Uncyclopedia:Votes_for_deletion",

			message: "\n\n== [[:{{{PAGE}}}]]{{{REDIRECTS}}} ==\n{{Votervfd|time=~~~~~\n|scoretext={{{SCORETEXT}}}\n|keepnumber=0\n|keep=\n|delnumber=1\n|delete=\n# {{Nom}} {{{REASON}}} ~~~~\n|comments=\n}}",

			redirect_append_start: " | REDIRECT(S): {{ShortRedirect|{{{PAGE}}}}}",

			redirect_append: ", {{ShortRedirect|{{{PAGE}}}}}",

			send_page_notice: "{{VFD}}\n\n{{{CONTENT}}}",

			append_message_rules: [

				{

					"type": "bottom"

				}

			]

		},

		speedyDelete: {

			target_page: "Uncyclopedia:QuickVFD",

			message: "\n [[:{{{PAGE}}}]]{{{REDIRECTS}}} \u0026#8212; {{{REASON}}}",

			message_redirect: "\n {{redirect|{{{PAGE}}}}}{{{REDIRECTS}}} \u0026#8212; {{{REASON}}}",

			redirect_append: ", {{redirect|{{{PAGE}}}}}",

			send_page_notice: "{{QVFD|{{{REASON}}}}}\n\n{{{CONTENT}}}",

			append_message_rules: [

				{

					"type": "after_text_anchor",

					"anchor": "\=* *QVFD *articles *\=*",

					"case_insensitive": true

				},

				{

					"type": "bottom"

				}

			]

		},

		userTemplating: [

			{

				category_name: "Welcoming Templates",

				tooltip: "Welcome this user",

				templates: [

					{

						template_name: "Welcome",

						tooltip: "A basic welcome message.",

						formHeader: "Welcome {user}",

						description: "A basic welcome message.\nIncludes helpful links for new users.",

						message: "{{subst"+":welcome}} ~~~~",

						editSummary: "Welcome to Uncyclopedia!"

					},

					{

						template_name: "Welcome-Anon",

						tooltip: "A basic welcome message for anonymous users.",

						formHeader: "Welcome {user}",

						description: "A basic welcome message for anonymous users.\nIncludes helpful links for new users.",

						message: "{{subst"+":welcome-anon}} ~~~~",

						editSummary: "Welcome to Uncyclopedia!"

					},

					{

						template_name: "Welcome Back",

						tooltip: "A welcome back message for old users.",

						formHeader: "Welcome-back {user}",

						description: "A basic welcome-back message.\nIncludes helpful reminders for older users.",

						message: "{{subst"+":welcomeback}} ~~~~",

						editSummary: "Welcome back!"

					}

				]

			},

			{

				"category_name": "Warning Templates",

				"tooltip": "Warn this user",

				"templates": [

					{

						template_name: "Warning Level 1",

						tooltip: "Warn this user.",

						formHeader: "Warn {user}",

						description: "For when they make an edit that\ndoes not appear constructive.",

						sectionTitle: "Hey there",

						message: "{{subst"+":Huggle/warn-1}}",

						editSummary: "Maybe time to stop and think?"

					},

					{

						template_name: "Warning Level 2",

						tooltip: "Warn this user.",

						formHeader: "Warn {user}",

						description: "For when they make an edit that\nappear to be vandalism.",

						sectionTitle: "We don't like what you are doing",

						message: "{{subst"+":Huggle/warn-2}}",

						editSummary: "We're not a fan of what you are doing."

					},

					{

						template_name: "Warning Level 3",

						tooltip: "Warn this user.",

						formHeader: "Warn {user}",

						description: "For when a user has continued\nvandalizing despite warning level 2.",

						sectionTitle: "It's probably time to stop now.",

						message: "{{subst"+":Huggle/warn-3}}",

						editSummary: "You should probably stop now."

					},

					{

						template_name: "Warning Level 4",

						tooltip: "Warn this user.",

						formHeader: "Warn {user}",

						description: "For when they are about to\nget banned for vandalism.",

						sectionTitle: "Stop",

						message: "{{subst"+":Huggle/warn-4}}",

						editSummary: "Ok, no more games. It's time to stop."

					},

					{

						template_name: "Oh Dear",

						formHeader: "Oh dear, {user}!",

						tooltip: "Oh deary deary me.",

						description: "Oh dear.",

						sectionTitle: "Oh Dear...",

						message: "{{subst"+":Oh Dear|header=}}\n~~~~",

						editSummary: "Oh dear."

					},

					{

						template_name: "Blocked Notice",

						formHeader: "Blocked Notice!",

						tooltip: "Oh noes!",

						description: "Oh noes!",

						sectionTitle: "Oh noes! You were blocked!",

						message: "{{blocked|{{{DURATION}}}|{{{REASON}}}|~~~~}}",

						editSummary: "You have been blocked, oh noes!",

						arguments: [

							{

								name: "DURATION",

								type: "textbox",

								placeholder: "Duration"

							},

							{

								name: "REASON",

								type: "textbox",

								placeholder: "Reason"

							}

						]

					}

				]

			},

			{

				"category_name": "Jokes",

				"tooltip": "Miscellaneous/joke templates",

				"templates": [

					{

						template_name: "Trout",

						formHeader: "Trout {user}",

						tooltip: "Slap this user with a wet trout.",

						description: "Ooh no, they did something silly.",

						sectionTitle: "Trout",

						message: "{{trout|" + mw.config.get("wgUserName") + "|2={{{REASON}}} ~~~~}}",

						editSummary: "Get [[Bitch slap|slapped]] with a wet trout!",

						arguments: [

							{

								name: "REASON",

								type: "textbox",

								placeholder: "Reason"

							}

						]

					},

					{

						template_name: "Whale",

						formHeader: "Whale {user}",

						tooltip: "Smash this user with a whale.",

						description: "Ooh no, they did something super silly.",

						sectionTitle: "Get smashed",

						message: "{{whale|" + mw.config.get("wgUserName") + "|2={{{REASON}}} ~~~~}}",

						editSummary: "Get smashed by a whale!",

						arguments: [

							{

								name: "REASON",

								type: "textbox",

								placeholder: "Reason"

							}

						]

					},

					{

						template_name: "JIMBO Whale",

						formHeader: "JIMBO Whale {user}",

						tooltip: "Smash this user with a fucking Jimbo whale.",

						description: "Ooh no, they did something super silly.\n\nSmash them with the most worst-ly photoshopped\nwhale with the head of Jimbo Whales.",

						sectionTitle: "THE JUMBO WHALE RISES! Then falls to smash you.",

						message: "{{The jimbo whale|" + mw.config.get("wgUserName") + "|2={{{REASON}}} ~~~~}}",

						editSummary: "Get smashed by the most worst-ly photoshopped whale with the head of Jimbo Whales!",

						arguments: [

							{

								name: "REASON",

								type: "textbox",

								placeholder: "Reason"

							}

						]

					},

					{

						template_name: "STUPID DUMBASSARY USER",

						formHeader: "Tell {user} how to speel",

						tooltip: "Make it known to {user} that they're stupid dumbass who needs to learn how to fucking speel.",

						description: "{user} is a stupid dumbass who needs to learn how to fucking speel.",

						sectionTitle: "You '''STUPID ''DUMBASSARY'' USER'''!",

						message: "{{subst:"+"User:Turb0-Sunrise/Stupid|" + mw.config.get("wgRelevantUserName") + "|{{{CORRECT_WORD}}}|{{{WRONG_WORD}}}}} ~~~~",

						editSummary: "You STUPID DUMBASSARY USER!",

						arguments: [

							{

								name: "WRONG_WORD",

								type: "textbox",

								placeholder: "Mis-typed word"

							},

							{

								name: "CORRECT_WORD",

								type: "textbox",

								placeholder: "Correct spelling (with a Single capital letter)"

							}

							//{

							//	name: "CORRECT_WORD_UPPERCASE",

							//	type: "variable_mutation",

							//	mutation: function(dialouge) {

							//		return dialouge.CORRECT_WORD.value.toUpperCase();

							//	}

							//}

						]

					}

				]

			},

			{

				category_name: "Congratumulations Templates",

				tooltip: "Congratumulate this user",

				templates: [

					{

						template_name: "Extended Confirmed",

						tooltip: "For when a user becomes extended confirmed.",

						formHeader: "Congratumulate {user} on becoming extended confirmed",

						description: "Congratumulate this user on becoming extended confirmed.",

						sectionTitle: "Congratumulations",

						message: "{{subst:"+"extended confirmed welcome|header=}} ~~~~",

						editSummary: "Congratumulations on becoming extended confirmed!"

					}

				]

			}

		]

	}

}[mw.config.get("wgServerName")]



// TODO: have option to load settings from a file if settings are not entered here.

// The following scripts will need to be hooked into a function or something to run once loaded:

// voteForDelete, speedyDelete. Just do it for all the buttons maybe.

wToolCore.perWikiConfigReady = true
/*

	Library script

	This script handles querying pages and the wiki

*/





/**

 * Will send a get diff query to the server.

 * @param {Object} revid The revid to get.

 * @param {Object} query The base query to modify.

 */

wToolCore.getRevisionQuery = function(revid, query) {

	query.revids = revid;

	return wToolCore.getQuery(query);

};



/**

 * Will send a query request to the server.

 * @param {Object} properties The properties of the query.

 */

wToolCore.getQuery = function(properties) {

	var query = {

		action: 'query',

		format: 'json',

		formatversion: '2'

	};

	var keys = Object.keys(properties);

	for (var i = 0; i < keys.length; i++) {

		query[keys[i]] = properties[keys[i]];

	}

	console.log("Sending request:", query);

	return new mw.Api().get(query);

};









/**

 * Returns all the results of an api query.

 * @param {Object} request The query to request.

 * @param {Function} then The function to call on complete. Should take in one parameter, an array of all return values.

 * @param {Function} getArrayProcessor Processed each individual query, and used to extract the important data. Must return an array, only return null once you have all the results or are ready to stop the loop. The returned array is appended to the output.

 */

wToolCore.getEntireApiRequest = function(request, then, getArrayProcessor) {

	var allPages = [];

	function getNextPageBatch() {

		new mw.Api().get(request).then(function(ret) {

			var arr = getArrayProcessor(ret.query);

			if (arr == null) {

				then(allPages);

				return;

			}



			allPages = allPages.concat(arr);



			if ("continue" in ret) {

				Object.keys(ret.continue).forEach(function(k) {request[k] = ret.continue[k];});

				getNextPageBatch();

			} else {

				then(allPages);

			}

		}, function(e) {

			getNextPageBatch();

		});

	}

	getNextPageBatch();

};



/*

/**

 * Returns the raw wikitext for multiple pages.

 * @param {Object} pageNames A list of all page names.

 * @param {Function} then The function to call on complete. Should take in one parameter, an array of all return values.

 *

wToolCore.getWikitextForPages = function(pageNames, then) {

	var gotPagesIndex = 0;

	var pageContent = [];



	function getWikitextForPage(pageName) {

		simpleAjaxRequest('GET', `https://${mw.config.get("wgServerName")}/w/index.php?title=${wToolCore.makeStringPathSafe(pageName)}&action=raw&ctype=text/plain`, {}, 'text/plain', function(ret) {

			pageContent.push(ret.responseText);

			gotPagesIndex ++;



			if (gotPagesIndex < pageNames.length)

				getWikitextForPage(pageNames[gotPagesIndex]);

			else if(then) then(pageContent);

		});

	}

	if (pageNames.length > 0)

		getWikitextForPage(pageNames[0]);

	else if(then) then([]);

}

*/



/**

 * Returns the raw wikitext for a single page.

 * @param {Object} pageName The name of the page.

 * @returns the text of a page.

 */

wToolCore.getWikitextForPage = function(pageName, then) {

	return fetch(

		"https://"+mw.config.get("wgServerName")+

		"/w/index.php?title="+

		wToolCore.makeStringPathSafe(pageName)+

		"&action=raw&ctype=text/plain"

	).then(function(ret) {

		ret.text().then(then);

	});

};





/**

 * Returns the url of a page.

 * @param {String} pageName The name of the page to get the url of.

 */

wToolCore.getArticlePath = function(pageName) {

	return "https://"+mw.config.get("wgServerName")+"/wiki/"+wToolCore.makeStringPathSafe(pageName);

};





/**

 * Returns the url of a page with parameters.

 * @param {String} pageName The name of the page to get the url of.

 * @param {Object} params A list of all the parameters.

 */

wToolCore.getPathWithParams = function(pageName, params) {

	var url = "https://"+mw.config.get("wgServerName")+"/w/index.php?title="+wToolCore.makeStringPathSafe(pageName);

	var keys = Object.keys(params);

	for (var i = 0; i < keys.length; i++) {

		var param = keys[i];

		url += "&" + param + "=" + params[param];

	}

	return url;

};





/**

 * Returns the html link for a page.

 * @param {String} pageName The name of the page to get the link to.

 */

wToolCore.getHtmlPageLink = function(pageName) {

	return '<a href="' + wToolCore.getArticlePath(pageName) + '">' + pageName + '</a>';

};
/*

	Library script

	This script contains random helper functions

*/

// Dependancies: lib/queryTools.js









/**

 * Thanks a suer for an edit.

 * @param {Number} revid the id of the revision to thank.

 */

wToolCore.thank_edit = function(revid) {

	return new mw.Api().postWithEditToken({action: "thank", format: "json", rev: revid})

}







/**

 * Returns whether or not `arr1` contains any value from `arr2`.

 * @param {Object} arr1 The first array.

 * @param {Object} arr2 the second array.

 * @returns {Boolean}

 */

wToolCore.containsAny = function(arr1, arr2) {

	for( var i=0; i<arr1.length; i++ ) {

        if(arr2.indexOf(arr1[i])!==-1) return true;

    }

    return false;

}





/**

 * Escapes regex from a string.

 * @param {String} text The text to escape the regex of.

 * @returns {String}

 */

wToolCore.escapeRegex = function(text) {

	return text.replace(/([^\\]|^)\\n/g, "$1\n").replace(/([^\\]|^)\\t/g, "$1\t")

		.replace(/\\\\n/g, "\\n").replace(/\\\\t/g, "\\t")

		.replace(/\\/g, "\\\\").replace(/\//g, "/").replace(/\[/g, "\\[")

		.replace(/\]/g, "\\]").replace(/\{/g, "\\{").replace(/\}/g, "\\}")

		.replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\-/g, "\\-")

		.replace(/\^/g, "\\^").replace(/\>/g, "\\>").replace(/\*/g, "\\*")

		.replace(/\./g, "\\.").replace(/\,/g, "\\,").replace(/\*/g, "\\*")

		.replace(/\?/g, "\\?").replace(/\$/g, "\\$").replace(/\|/g, "\\|")

		.replace(/\+/g, "\\+");

}





/**

 * A helper function for sending an asynchronous request to the website.

 * This can be slightly faster than using an API call, depending on the situation, and be more reliable.

 * @param {String} requestMethod The request method to use. Must be either "POST" or "GET".

 * @param {String} requestUrl The URL to fetch from.

 * @param {Object} postFields When using the POST request method, send this data to the server.

 * @param {String} overrideMimeType The data type to get.

 * @param {function} ResponseHandler The function to be called on success. Has one parameter, the response from the server.

 * @param {function} FailHandler The function to be called on fail. Has one parameter, the error that occurred.

 */

wToolCore.simpleAjaxRequest = function(requestMethod, requestUrl, postFields, overrideMimeType, ResponseHandler, FailHandler) {

	var request;

	var headers = {};

	var formData;



	// prepare POST request

	if (requestMethod === 'POST') {



		// assemble string body

		if (typeof FormData != 'function') {



			// create boundary

			var boundary = wEditor_CreateRandomString(12);



			// POST header, charset: WebKit workaround http://aautar.digital-radiation.com/blog/?p=1645

			headers['Content-Type'] = 'multipart/form-data; charset=UTF-8; boundary=' + boundary;



			// assemble body data

			formData = '';

			for (var i = 0; i < postFields.length; i++) {

				var fieldName = postFields[i];

				if (Object.prototype.hasOwnProperty.call(postFields, fieldName) === true) {

					formData += '--' + boundary + '\r\n';

					formData += 'Content-Disposition: form-data; name="' + fieldName + '"\r\n\r\n' + postFields[fieldName] + '\r\n';

				}

			}

			formData += '--' + boundary + '--\r\n';

		}



		// use FormData object

		else {

			formData = new window.FormData();

			for (var fieldNameIndex in postFields) {

				var fieldName = postFields[fieldNameIndex];

				if (Object.prototype.hasOwnProperty.call(postFields, fieldName) === true)

					formData.append(fieldName, postFields[fieldName]);

			}

		}

	}



	// create new XMLHttpRequest object

	request = new window.XMLHttpRequest();



	// open the request

	request.open(requestMethod, requestUrl, true);



	// set the headers

	for (var headerNameIndex in headers) {

		var headerName = headers[headerNameIndex];

		if (Object.prototype.hasOwnProperty.call(headers, headerName) === true) {

			request.setRequestHeader(headerName, headers[headerName]);

		}

	}



	// set the mime type

	if ( (request.overrideMimeType !== undefined) && (typeof overrideMimeType == 'string') ) {

		request.overrideMimeType(overrideMimeType);

	}



	// send the request, catch security violations Opera 0.9.51

	try {

		request.send(formData);

	}

	catch (exception) {

		FailHandler();

		return;

	}



	// wait for the data

	request.onreadystatechange = function() {

		if (request.readyState != 4)

			return;

		ResponseHandler(request);

	};

}





/**

 * Creates a progress bar.

 * @param {String} style The CSS styling of the outside container of the progress bar.

 * @param {String} id The id to give to the progress bar, so you can get it with document.getElementById().

 * @param {Number} height The height of the progress indicator.

 * @returns {Object} Returns the progress bar element. You can add this to the document.

 * The progress bar has the following functions:

 * setMaxValue(maxValue: Number): Sets the maximum value of the progress bar, and updates the progress based on the value in relation to the maxValue.

 * setValue(maxValue: Number, animated: boolean): Sets the current value of the progress bar, and updates the progress based on the value in relation to the maxValue.

 * setCompletion(maxValue: Number): Sets the percentage of completion for the progress bar. Should be a number between 0 and 100.

 */

wToolCore.createProgressBar = function(style, id, height) {

	var div = document.createElement("div");

	div.id = id;

	div.style = "width: 100%; background: #5e5d5d; height:" + height +"px";



	var progress = document.createElement("div");

	progress.name = "progress";

	progress.style = style;

	progress.style.width = "0%";

	progress.style.height = "100%";

	progress.style.transition = "width 0.1s linear";



	div.maxValue = 100;

	div.currentValue = 100;

	div.lastSetTime = Date.now();

	div.lastDelayTime = 0;



	div.setMaxValue = function(maxValue) {

		div.maxValue = maxValue;

		div.setCompletion((div.currentValue / div.maxValue) * 100);

	};



	div.setValue = function(currentValue, animated) {

		animated = do_default(animated, true);

		

		div.currentValue = currentValue;

		div.setCompletion((div.currentValue / div.maxValue) * 100);



		// Set the animation to be the amount of time since the last progress change

		if (animated) {

			var thisTime = Date.now();

			var newDelayTime = (thisTime - div.lastSetTime) / 1000;



			var averageDelayTime = (newDelayTime + div.lastDelayTime) / 2;

			div.lastDelayTime = averageDelayTime;

			progress.style.transition = "width "+ (averageDelayTime * 1.3).toString() +"s linear";



			div.lastSetTime = thisTime;

		} else

			progress.style.transition = null;

	};



	div.setCompletion = function(amount) {

		progress.style.width = amount.toString() + "%";

	};



	div.appendChild(progress);

	return div;

}





/**

 * Returns all the redirects to a given page.

 * @param {String} pageName The string to escape.

 * @param {function} then The function to call on complete. Should take in one parameter, an array of all redirects.

 * Each item in the array is an Object, which has the following values: `ns` (the namespace number), and `title`.

 */

wToolCore.getAllReidrectsToPage = function(pageName, then) {

	var output = [];

	wToolCore.getEntireApiRequest({

		"action": "query",

		"prop": "redirects",

		"titles": pageName,

		"formatversion": 2

	}, then,

	function(query) {

		if (query.pages[0] == null)

			return;

		return query.pages[0].redirects;

	});

}





/**

 * Adds a tool button.

 * @param {String} id The id of the button.

 * @param {String} text The text of the button.

 * @param {String} tooltip The tooltip to show to the user when hovering the button.

 * @param {function} onclick The function to call when clicking the button.

 */

wToolCore.addToolButton = function(id, text, tooltip, onclick) {

	mw.util.addPortletLink('p-cactions', '#', text, id, tooltip);

	$("#" + id).click(function(e) {

		e.preventDefault();

		onclick();

	});

}





/*

// Adds action buttons to the top of the screen

wToolCore.toolbarDiv = $('<div>').prependTo($('#bodyContent'));

wToolCore.toolbarButtonCount = 0;

wToolCore.addToolbarButton = function(text, tooltip = "", id = "") {

	wToolCore.toolbarButtonCount ++;

	return $(`<span id="${id}" title="${tooltip}">${wToolCore.toolbarButtonCount > 1 ? " / " : ""}<a>${text}</a></span>`).appendTo(wToolCore.toolbarDiv);

}

*/



// Calls a method/function in a loop.

wToolCore.methodCallLoop = function(items, settings) {

	settings = do_default(settings, {});



	var callOnDone = do_default(settings.callOnDone, function(){});

	var callFunction = settings.callFunction;

	var autoContinue = do_default(settings.autoContinue, false);

	var loopTimeout = do_default(settings.loopTimeout, 0);



	var currentIndex = 0;



	if (items.length === 0 || !callFunction) {

		if (callOnDone) callOnDone();

		return;

	}



	function loopProcess(settings) {

		settings = do_default(settings, {});

		var retryPrevious = do_default(settings.retryPrevious, false);



		if (retryPrevious) {

			currentIndex -= 1;

		}



		if (currentIndex >= items.length || settings.stop) {

			if (callOnDone) callOnDone();

			return;

		}



		if (autoContinue) {

			callFunction(items[currentIndex]);

			setTimeout(loopProcess, loopTimeout)

		}

		else {

			callFunction(items[currentIndex], function() {setTimeout(loopProcess, loopTimeout)});

		}

		currentIndex += 1;

	}

	loopProcess();

}



/**

 * Returns the numerical id of the page title.

 * @param {String} pageTitle The page title to get it from.

 * @returns {String} The return value.

 */

wToolCore.namespaceNameToId = function(pageTitle) {

	 return mw.config.get("wgNamespaceIds")[wToolCore.namespaceNameToNSN(pageTitle).toLowerCase()]

}



/**

 * Returns the namespace title.

 * @param {String} pageTitle The page title to get it from.

 * @returns {String} The return value.

 */

wToolCore.namespaceNameToNSN = function(pageTitle) {

	 return pageTitle.slice(0, pageTitle.indexOf(":"))

}





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

/*

	Module script

	This module adds a "template user" button to the tools dropdown

*/

// Dependancies: core/settings.js





if (!wToolCore.settings.DISABLE_LIVE_NOTIFICATIONS) {

	var documentTitle = document.title;

	var crossWiki = mw.user.options.get('echo-cross-wiki-notifications');

	var count = Number($('#pt-notifications-alert a').attr('data-counter-num')) + Number($('#pt-notifications-notice a').attr('data-counter-num'));

	document.title = (count > 0 ? "(" + count.toString() + ") " : "") + documentTitle;



	function updateIcon(id, data) {

		$('#' + id + ' a')

			.toggleClass('mw-echo-unseen-notifications', data.latest > data.seen)

			.toggleClass('mw-echo-notifications-badge-all-read', !data.count)

			.attr('data-counter-num', data.count)

			.attr('data-counter-text', data.count);

	}



	function updateCount(status) {

		count = status.alert.count + status.message.count;

		document.title = (count > 0 ? "(" + count.toString() + ") " : "") + documentTitle;

		updateIcon('pt-notifications-alert', status.alert);

		updateIcon('pt-notifications-notice', status.message);

	}



	function getData() {

		var lastUpdated = mw.storage.get("wToolCore:liveNotificationData:lastUpdate");

		if (lastUpdated == null || parseInt(lastUpdated) <= Date.now()) {

			mw.storage.set("wToolCore:liveNotificationData:lastUpdate", JSON.stringify(Date.now() + 5000), 5500);

			

			new mw.Api().get({

				action: 'query',

				format: 'json',

				meta: 'notifications',

				notprop: 'list|count|seenTime',

				notlimit: 1,

				notgroupbysection: true,

				notalertunreadfirst: true,

				notmessageunreadfirst: true,

				notcrosswikisummary: crossWiki

			}).then(function(ret) {

				var info = ret.query.notifications,

					status = {

						alert: {

							seen: Date.parse(info.alert.seenTime),

							latest: info.alert.list[0].timestamp.utcunix,

							count: info.alert.rawcount

						},

						message: {

							seen: Date.parse(info.message.seenTime),

							latest: info.message.list[0].timestamp.utcunix,

							count: info.message.rawcount

						}

					};

				mw.storage.set("wToolCore:liveNotificationData:data", JSON.stringify(status), 5500);



				updateCount(status);

			});

		}

		else {

			var data = mw.storage.get("wToolCore:liveNotificationData:data");

			if (data != null)

				updateCount(JSON.parse(data));

		}

	}

	setInterval(function() {

		getData();

	}, 5000);

	getData();

}

/*

	Library script

	This script handles showing the user feedback for their actions, whether they succeded or failed.

*/





wToolCore.displayErrorJSON = function(error, e) {

	if (error === "missingparam") {

		wToolCore.displayError("API error. Please send a screenshot of this error to L10nM4st3r. Make sure to explain what you were doing at the time.");

		if (e !== undefined) {

			console.log(e);

			wToolCore.displayError("Error for debugging: " + e.error.info);

		}

		else wToolCore.displayError("No info given.");

	}

	else if (error === "protectedpage") {

		wToolCore.displayError("You do not have permission to edit this page, it is protected.");

		console.error("Page protected error: ", e);

	}

	else {

		console.error("Unknown error: ", error, e);

		mw.notify("Unknown error: "+ JSON.stringify(error), {type: 'error'});

	}

}



wToolCore.displayError = function(message) {

	console.error(message);

	mw.notify(message, {type: 'error'});

}



wToolCore.displaySuccess = function(message) {

	console.log(message);

	mw.notify(message, {type:'success'});

}



wToolCore.displayInfo = function(message) {

	console.log(message);

	mw.notify(message);

}



wToolCore.displaySuccessAfterReload = function(message) {

	console.log("Delaying message until after reload: " + message);

	mw.storage.set("wToolCore:successMessage", message, 1000);

}



if (mw.storage.get("wToolCore:successMessage")) {

	wToolCore.displaySuccess(mw.storage.get("wToolCore:successMessage"))

	mw.storage.remove("wToolCore:successMessage")

}
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
/*

	Library script

	This script contains the handler for creating forms

*/





// Creates a form dialouge menu.

wToolCore.createForm = function(title, form_content, settings) {

	settings = do_default(settings, {});



	mw.loader.using( [ 'oojs-ui-windows', 'oojs-ui-widgets', 'oojs-ui-core', 'oojs-ui', 'oojs' ] ).then(function() {

		var windowManager = new OO.ui.WindowManager();

		$('body').append( windowManager.$element);

		

		function FormMenu( config ) {

			FormMenu.super.call( this, config );

		}

		OO.inheritClass(FormMenu, OO.ui.ProcessDialog);

	

		var formMenuName = 'lion-formMenu' + toString(Math.random())

		FormMenu.static.name = formMenuName;

		FormMenu.static.title = title;



		FormMenu.static.actions = settings.onSubmit != null ? [

			{ action: 'submit', label: settings.submitText ? settings.submitText : 'Submit', flags: 'primary' },

			{ label: settings.cancelText ? settings.cancelText : 'Cancel', flags: 'safe' }

		] : [{ label: settings.cancelText ? settings.cancelText : 'Cancel', flags: 'safe' }];

		

		FormMenu.prototype.initialize = function() {

			FormMenu.super.prototype.initialize.apply( this, arguments );

			

			this.panel = new OO.ui.PanelLayout({padded: true, expanded: false});

			this.content = new OO.ui.FieldsetLayout();

			this.on_submit_variables = [];

			

			var field;



			function doOnclickFunction(dialouge, item) {

				return function(){

					item.onclick(dialouge, item.pass_click_params)

				}

			}

			

			for (var itemIndex in form_content) {

				var item = form_content[itemIndex];



				var element;

				var importantElement;

				

				if (typeof item === "string") {

					if (item === "field start") {

						field = new OO.ui.FieldsetLayout();

						this.content.addItems([field]);

					}

					else if (item === "field end") {

						field = null;

					}

				}

				else {



					if (item.type === "label")

						element = new OO.ui.LabelWidget({label: item.text});

					else if (item.type === "link")

						element = new OO.ui.LabelWidget({label: $('<a>').attr('href', item.href).text(item.text)});

					else if (item.type === "button") {

						element = new OO.ui.ButtonWidget({label: item.text, title: item.tooltip});

						if ("onclick" in item) element.on("click", doOnclickFunction(this, item));

					}

					else if (item.type === "checkbox") {

						importantElement = new OO.ui.CheckboxInputWidget({selected: item.value});

						element = new OO.ui.FieldLayout(importantElement, { label: item.text, align: 'inline' });

						if ("onclick" in item) importantElement.on("change", doOnclickFunction(this, item));

						if (item.disabled) importantElement.setDisabled(true);

					}

					else if (item.type === "textarea") {

						importantElement = new OO.ui.MultilineTextInputWidget({value: item.value, placeholder: item.placeholder ? item.placeholder : ""});

						if ("text" in item) {

							var label = new OO.ui.LabelWidget({label: item.text});

							element = new OO.ui.FieldsetLayout().addItems([label, importantElement])

						} else element = importantElement;

					}

					else if (item.type === "textbox") {

						importantElement = new OO.ui.TextInputWidget({value: item.value, placeholder: item.placeholder ? item.placeholder : ""});

						if ("text" in item) {

							var label = new OO.ui.LabelWidget({label: item.text});

							element = new OO.ui.FieldsetLayout().addItems([label, importantElement])

						} else element = importantElement;

					}

					else if (item.type === "header2")

						element = new OO.ui.LabelWidget({label: $( '<b>' ).text(item.text)});

					else if (item.type === "list") {

						element = new OO.ui.SelectWidget();

						for (i in item.items) {

							element.addItems([new OO.ui.OptionWidget({

								data: "",

								label: "> " + item.items[i]

							})]);

						}

					}

					else if (item.type === "variable_mutation") {

						this.on_submit_variables.push({

							name: item.name,

							variable: item.variable,

							mutation: item.mutation,

						})

					}

					

					if ("name" in item) this[item.name] = importantElement ? importantElement : element;

					if (field) field.addItems([element]);

					else this.content.addItems([element]);

				}

			}

			

			this.panel.$element.append(this.content.$element);

			this.$body.append(this.panel.$element);

		};

		

		FormMenu.prototype.getActionProcess = function(action) {

			var dialog = this;

			

			// Trigger Submit button Action

			if (action === 'submit' && settings.onSubmit != null)

				return new OO.ui.Process(function() {



					try{

					if (settings.submitTextPressed) {

						windowManager.windows[formMenuName].$primaryActions[0].childNodes[0].childNodes[0].childNodes[1].innerText = settings.submitTextPressed;

					}

					} catch(e) {

						console.error(e)

						console.error(windowManager)

					}

					



					console.log(dialog.on_submit_variables);

					for (var i in dialog.on_submit_variables) {

						var submit_variable_data = dialog.on_submit_variables[i];

						dialog[submit_variable_data.name] = {value: submit_variable_data.mutation(dialog)};

					}

					settings.onSubmit(dialog, settings.pass_submit_params);

				});

			

			else if (settings.onCancel != null)

				settings.onCancel();

			

			return new OO.ui.Process(function() {

				dialog.close();

			});

		};

	

		var menu = new FormMenu({

			size: 'medium'

		});

	

		windowManager.addWindows([menu]);

		windowManager.openWindow(menu);

	});

}

/*

	Module script

	This module add helpful tools for page moving.

*/

// Dependancies: core/settings.js, lib/userFeedback.js, lib/helpers.js, lib/editTools.js, lib/form.js, lib/queryTools.js, core/settings_wiki_dependant.js





var wTools_pagesMoved = [];



function wTools_postMovePageRequest(oldTitle, newTitle, reason, movetalk, watch, supressRedirect) {

	console.log("Moving page "+oldTitle+" to "+newTitle);

	return new mw.Api().post({

		action: "move",

		from: oldTitle,

		to: newTitle,

		reason: reason,

		movetalk: movetalk,

		watchlist: watch,

		noredirect: supressRedirect ? "1" : false,

		token: mw.user.tokens.get('csrfToken'),

		format: "json",

		tags: wToolCore.settings.EDIT_TAG_TO_USE ? wToolCore.settings.EDIT_TAG_TO_USE : ""

	});

}

function wTools_MovePage(oldTitle, newTitle, reason, movetalk, watch, supressRedirect, then) {

	wTools_postMovePageRequest(oldTitle, newTitle, reason, movetalk, watch, supressRedirect).then(function(response) {

		if (response.move) {

			wTools_pagesMoved.push({

				from: response.move.from,

				to: response.move.to,

				ns: wToolCore.namespaceNameToId(response.move.to)

			});

		}

		then(response);

	},

	function(error) {

		if (error === "articleexists") {

			if (wToolCore.settings.USER_IS_ADMIN) {

				wToolCore.createForm("Cannot move page", [

					{

						type: "label",

						text: 'Cannot move the page "' + oldTitle + '" to "' + newTitle + '": target page already exists.'

					}

				], {onSubmit: function(dialog) {

					wToolCore.deletePage(newTitle, "Deleting to make way for page move.", true).then(function() {

						dialog.close({ action: "submit" });

						wTools_MovePage(oldTitle, newTitle, reason, movetalk, watch, supressRedirect, then);

					}, function(error2) {

						dialog.close({ action: "submit" });

						wToolCore.createForm("Failed to delete page", [

							{

								type: "label",

								text: "Failed to delete " + newTitle + ": " + error2 + "."

							}

						]);

					});

				}, submitText: "Delete & Move", submitTextPressed: "Working..."})

			}

			else {

				wToolCore.createForm("Cannot move page", [

					{

						type: "label",

						text: 'Cannot move the page "' + oldTitle + '" to "' + newTitle + '": target page already exists. Ask an admin to delete it.'

					}

				])

			}

		}

		else {

			wToolCore.createForm("Cannot move page", [

				{

					type: "label",

					text: 'Cannot move the page "' + oldTitle + '" to "' + newTitle + '": ' + error + '.'

				}

			])

		}

	});

}



var wTools_PageLink_index = 0;

function wTools_fixPageLinks(pageName, onCompleted, isCategory, fixLinks, fixTransclusions) {

	var request = {action:"query", format:"json", prop:(fixLinks ? "linkshere" : "")+"|"+(fixTransclusions ? "transcludedin" : "")+"|"+(wToolCore.settings.VIEWING_NAMESPACE === 6 ? "fileusage" : ""), titles : pageName, formatversion:"2"};

	if (isCategory) request = {action:"query", format:"json", list:"categorymembers", cmtitle: pageName, cmlimit:"250"};



	wToolCore.getEntireApiRequest(request, function(pages) {

		console.log("Got "+pages.length+" page(s) to fix.")



		// No pages to fix, instead move to the next page.

		if (pages.length === 0) {

			wTools_PageLink_index += 1;

			if (wTools_PageLink_index < wTools_pagesMoved.length) wTools_fixPageLinks(wTools_pagesMoved[wTools_PageLink_index].from, onCompleted, isCategory, fixLinks, fixTransclusions);

			else onCompleted();

			return;

		}



		$('#renameCategories-log').remove();

		$('#progressWarning-log').remove();



		var inProgressWarning = $('<span>')

			.appendTo($('#movepage'))

			.text('Changing links. If you see this, do not close the tab.')

			.css('color', 'red')

			.attr('id', 'progressWarning-log');



		var log = $('<span>')

			.appendTo($('#movepage'))

			.append('<br/><hr/>')

			.attr('id', 'renameCategories-log');

		

		var logMessage = function(message, colour) {

			log.append(

				"<p>" + message + "</p>"

			).css('color', colour);

			console.log(message);

		}





		var loopComplete = function() { // Check the next pages for new links

			wTools_PageLink_index += 1;

			if (wTools_PageLink_index < wTools_pagesMoved.length) wTools_fixPageLinks(wTools_pagesMoved[wTools_PageLink_index].from, onCompleted, isCategory, fixLinks, fixTransclusions);

			else {

				onCompleted();

				inProgressWarning.remove();

			}

		};

		var loopProcess = function(pageTitle, then) {

			var changesWereMade = false;

			new mw.Api().edit(pageTitle.title, function(revision) {

				var output = {

					text: revision.content,

					summary: "Moving page [[" + wTools_pagesMoved[wTools_PageLink_index].from + "]] to [[" + wTools_pagesMoved[wTools_PageLink_index].to + "]] - updating links" + wToolCore.settings.EDIT_AD_TO_USE,

					minor: true,

					bot: true,

					watchlist: "nochange",

					tags: wToolCore.settings.EDIT_TAG_TO_USE

				};

				// Replace all links to the new page, as well as template transclusions.

				for (var moveIndex in wTools_pagesMoved) {

					var move = wTools_pagesMoved[moveIndex];

					// Has a namespace

					var fromPage = move.from.charAt(0).toUpperCase() + move.from.slice(1);

					if (move.ns != null) {

						var colonIndex = move.from.indexOf(":");

						fromPage = move.from.slice(0, colonIndex + 1) + move.from.charAt(colonIndex + 1).toUpperCase() + move.from.slice(colonIndex + 2);

					}

					output.text = fixPage(fixPage(output.text, fromPage, move.to), fromPage, move.to);

				}

				changesWereMade = output.text !== revision.content;

				return output;

			}).then(function() {

				logMessage(

					(changesWereMade ? "Successfully changed link for" : "No changes made to")+" "+(wToolCore.getHtmlPageLink(pageTitle.title)) + ".",

					changesWereMade ? 'green' : 'gray'

				)



				if (wToolCore.settings.USER_IS_ADMIN) {

					setTimeout(then, 250);

				}

				else {

					setTimeout(then, 500);

				}

			}, function(error) {

				console.error(error)

				if (error === "ratelimited") {

					logMessage(

						"Hit rate limit while editing "+wToolCore.getHtmlPageLink(pageTitle.title)+". Waiting 2 seconds to retry.",

						'red'

					)

					clearTimeout();

					setTimeout(function(){then({retryPrevious: true})}, 2000);

				}

				else {

					logMessage(

						"Failed to update link for " + wToolCore.getHtmlPageLink(pageTitle.title)+": "+error+".",

						'red'

					)

					if (wToolCore.settings.USER_IS_ADMIN) {

						setTimeout(function(){then({retryPrevious: true})}, 2000);

					}

					else {

						setTimeout(function(){then({retryPrevious: true})}, 2000);

					}

				}

			});

		};

		wToolCore.methodCallLoop(pages, {

			callOnDone: loopComplete,

			callFunction: loopProcess

		});

	}, function(query) {

		// Turn query into an array of pages to edit

		var output = [];

		if ("categorymembers" in query) output = query.categorymembers;

		if ("pages" in query && query.pages.length > 0) {

			if ("linkshere" in query.pages[0]) output = output.concat(query.pages[0].linkshere);

			if ("transcludedin" in query.pages[0]) output = output.concat(query.pages[0].transcludedin);

			if ("fileusage" in query.pages[0]) output = output.concat(query.pages[0].fileusage);

		}



		return output;

	});

}

function wTools_doPostMoveStuff(fromTitle, toTitle, redirectUrl) {

	redirectUrl = do_default(redirectUrl, true);



	console.log("Now changing page links (if settings enabled).")

	getFixPagecache();

	var index = 0;



	// If this page is a category

	if (wToolCore.settings.VIEWING_NAMESPACE === 14) {

		var changeCategoryLinks = $('input[name=changeCategoryLinks]').prop('checked');



		if (changeCategoryLinks) {

			index = 0;

			wTools_fixPageLinks(wTools_pagesMoved[index].from, function() {

				location.href = wToolCore.getArticlePath(toTitle);

			}, true);

		}

		else location.href = wToolCore.getArticlePath(toTitle);

	}

	else {

		var changeTransclusions = $('input[name=changeTransclusions]').prop('checked');

		var changeLinks = $('input[name=changeLinks]').prop('checked');



		if (changeLinks || changeTransclusions) {

			index = 0;

			wTools_fixPageLinks(wTools_pagesMoved[index].from, function() {

				if (redirectUrl) location.href = wToolCore.getArticlePath(toTitle);

			}, false, changeLinks, changeTransclusions);

		}

		else {

			if (redirectUrl) location.href = wToolCore.getArticlePath(toTitle);

		}

	}

}

function wTools_movePagePressed() {

	var oldTitle = mw.config.get("wgRelevantPageName"),

		to_ns = mw.config.get('wgFormattedNamespaces')[$('select[name=wpNewTitleNs]').val()].replace(' ', '_'),

		to_page = $('input[name=wpNewTitleMain]').val(),

		newTitle = (to_ns === '' ? to_page : to_ns + ':' + to_page),

		reason = $('input[name=wpReason]').val(),

		talk = $('input[name=wpMovetalk]').prop('checked') ? 'yes' : void 0,

		watch = $('input[name=wpWatch]').prop('checked') ? 'watch' : void 0,

		supressRedirect = $('input[name=wpLeaveRedirect]').prop('checked') ? false : true;



	document.getElementById("new-movePage").style.display = "none";

	if (document.getElementById("new-moveSubPages")) document.getElementById("new-moveSubPages").style.display = "none";

	document.getElementById("new-changeLinksOnly").style.display = "none";

	

	wTools_MovePage(oldTitle, newTitle, reason, talk, watch, supressRedirect, function(response) {

		if (response.move) {

			wTools_doPostMoveStuff(response.move.from, response.move.to);

		} else {

			document.getElementById("new-movePage").style.display = "inline";

			if (document.getElementById("new-moveSubPages")) document.getElementById("new-moveSubPages").style.display = "inline";

			mw.notify("Cannot move page: " + response.error.info, {type: "error"});

		}

	});

}

function wTools_moveSubpagesPressed() {

	document.getElementById("new-movePage").style.display = "none";

	if (document.getElementById("new-moveSubPages")) document.getElementById("new-moveSubPages").style.display = "none";

	document.getElementById("new-changeLinksOnly").style.display = "none";



	var oldTitle = mw.config.get("wgRelevantPageName"),

		to_ns = mw.config.get('wgFormattedNamespaces')[$('select[name=wpNewTitleNs]').val()].replace(' ', '_'),

		to_page = $('input[name=wpNewTitleMain]').val(),

		newTitle = (to_ns === '' ? to_page : to_ns + ':' + to_page),

		reason = $('input[name=wpReason]').val(),

		talk = $('input[name=wpMovetalk]').prop('checked') ? 'yes' : void 0,

		watch = $('input[name=wpWatch]').prop('checked') ? 'watch' : void 0,

		supressRedirect = $('input[name=wpLeaveRedirect]').prop('checked') ? false : true;



	wToolCore.getEntireApiRequest({

		action: 'query',

		list: 'prefixsearch',

		pssearch: oldTitle + '/',

		pslimit: 'max',

		format: 'json'

	}, function(subpageList) {

		$('#moveSubpages-log').remove();



		var log = $('<span>')

			.appendTo($('#movepage'))

			.append('<br/><hr/>')

			.attr('id', 'moveSubpages-log');



		function doMovePage(oldTitle, newTitle, noerror, reason, onerror) {

			reason = do_default(reason, "");

			onerror = do_default(onerror, null);



			wTools_MovePage(oldTitle, newTitle, reason, talk, watch, supressRedirect, function(response) {

				if (response.move) {

					if (response.move['talkmove-errors']) {

						var talkpage = oldTitle.match(':') ? oldTitle.replace(':', ' talk:') : 'Talk:' + oldTitle;



						logMessage(

							talkpage + ' could not be moved.',

							'red'

						)

					} else if (response.move.talkfrom) {

						logMessage(

							'Successfully moved ' + response.move.talkfrom + ' to ' + response.move.talkto + '.',

							'green'

						)

					}

				}



				if (response.error) {

					logMessage(

						oldTitle + ' could not be moved.',

						'red'

					)

					logMessage(

						'&bull; Reason: ' + response.error.info,

						'red'

					)

					if (onerror) onerror();

				} else {

					logMessage(

						"Successfully moved " + wToolCore.getHtmlPageLink(response.move.from) + " to " + wToolCore.getHtmlPageLink(response.move.to) + ".",

						'green'

					)

					noerror();

				}

			});

		}



		var subpageIndex = 0;

		function doMoveNextPage(){

			while (subpageIndex < subpageList.length){

				doMovePage(subpageList[subpageIndex].title, subpageList[subpageIndex].title.replace(oldTitle, newTitle), doMoveNextPage, "[Moving Subpages] " + reason + wToolCore.settings.EDIT_AD_TO_USE);

				subpageIndex += 1;

				return;

			}

			wTools_doPostMoveStuff(oldTitle, newTitle);

		}

		doMovePage(oldTitle, newTitle, function() {

			doMoveNextPage();

		}, reason, function() {

			document.getElementById("new-movePage").style.display = "inline";

			if (document.getElementById("new-moveSubPages")) document.getElementById("new-moveSubPages").style.display = "inline";

		});

	}, function(query) {return query.prefixsearch;});

}

function wTools_changeLinksOnly() {

	document.getElementById("new-movePage").style.display = "none";

	if (document.getElementById("new-moveSubPages")) document.getElementById("new-moveSubPages").style.display = "none";

	document.getElementById("new-changeLinksOnly").style.display = "none";

	

	

	$('#moveSubpages-log').remove();



	var log = $('<span>')

		.appendTo($('#movepage'))

		.append('<br/><hr/>')

		.attr('id', 'moveSubpages-log');

	

	

	var oldTitle = mw.config.get("wgRelevantPageName"),

		to_ns = mw.config.get('wgFormattedNamespaces')[$('select[name=wpNewTitleNs]').val()].replace(' ', '_'),

		to_page = $('input[name=wpNewTitleMain]').val(),

		newTitle = (to_ns === '' ? to_page : to_ns + ':' + to_page);

	

	pagesMoved.push({from: oldTitle, to: newTitle, ns: wToolCore.namespaceNameToId(newTitle)});

	wTools_doPostMoveStuff(oldTitle, newTitle, false);

}





if (typeof mw.config.get("wgCanonicalSpecialPageName") === "string" && mw.config.get("wgCanonicalSpecialPageName").toLowerCase() === "movepage") {

	console.log("Is on move page, loading advanced UI.");

	new OO.ui.ButtonWidget({

		label: 'Move page',

		id: 'new-movePage',

		flags: ['primary', 'progressive']

	}).$element

		.on('click', wTools_movePagePressed)

		.appendTo($('button[name=wpMove]').parent().parent());



	if (!$('p:contains(\'This page has no subpages.\')')[0]) {

		var canUseSubpageMover = mw.config.get("wgUserGroups").filter(function(value, index, array) {

			return ["extendedconfirmed", "extendedconfirmeduser", "rollbacker", "admin", "interface-admin", "reviewer", "suppressredirect", "suppress-redirect", "bureaucrat", "steward", "sysop", "bot"].indexOf(value) !== -1;

		}) !== undefined;



		if (canUseSubpageMover) {

			new OO.ui.ButtonWidget({

				label: 'Move page and subpages',

				id: 'new-moveSubPages',

				flags: ['primary', 'progressive']

			}).$element

				.on('click', wTools_moveSubpagesPressed)

				.appendTo($('button[name=wpMove]').parent().parent());

		}

	}

	

	new OO.ui.ButtonWidget({

		label: 'Change links only',

		id: 'new-changeLinksOnly',

		flags: ['primary', 'progressive']

	}).$element

		.on('click', wTools_changeLinksOnly)

		.appendTo($('button[name=wpMove]').parent().parent());





	// If this page is a category

	if (wToolCore.settings.VIEWING_NAMESPACE === 14) {

		var changeCategoryLinks = new OO.ui.CheckboxInputWidget({

			name: 'changeCategoryLinks',

			selected: false

		});

		new OO.ui.FieldLayout( changeCategoryLinks, { label: 'Change category links for pages which use this category', align: 'inline'}).$element

			.appendTo($('input[name=wpWatch]').parent().parent().parent().parent());

	}

	else {

		var changeLinks = new OO.ui.CheckboxInputWidget({

			name: 'changeLinks',

			selected: false

		});

		new OO.ui.FieldLayout( changeLinks, { label: 'Change links to the new page.', align: 'inline'}).$element

			.appendTo($('input[name=wpWatch]').parent().parent().parent().parent());





		var changeTransclusions = new OO.ui.CheckboxInputWidget({

			name: 'changeTransclusions',

			selected: true

		});

		new OO.ui.FieldLayout( changeTransclusions, { label: 'Change transclusions to the new page.', align: 'inline'}).$element

			.appendTo($('input[name=wpWatch]').parent().parent().parent().parent());

	}





	// Remove the default move button, and do some general ui cleanup

	$('button[name=wpMove]').parent().remove();

	if ($('#wpMovesubpages')) $('#wpMovesubpages').parent().parent().parent().remove();



	var fixPage_fixCategories = false;

	var fixPage_fixLinks = false;

	var fixPage_fixTransclusions = true;

	function getFixPagecache() {

		if (wToolCore.settings.VIEWING_NAMESPACE === 14) {

			fixPage_fixCategories = $('input[name=changeCategoryLinks]').prop('checked');

        }

		else {

			fixPage_fixCategories = false;

			fixPage_fixLinks = $('input[name=changeLinks]').prop('checked');

			fixPage_fixTransclusions = $('input[name=changeTransclusions]').prop('checked');

		}

	}



	var templatePrefix = mw.config.get("wgFormattedNamespaces")[10] + ":";

	var namespaceIds = mw.config.get("wgNamespaceIds");



	function fixPage(content, fromTitle, toTitle) {

		var safeFromTitle = wToolCore.escapeRegex(fromTitle).replace(/[ _]/g, "[ _]").replace("File:", "(?:File:|Image:|file:|image:)");

		var safeToTitle = wToolCore.escapeRegex(toTitle).replace(/[ _]/g, "[ _]").replace("File:", "(?:File:|Image:|file:|image:)");



		var whitespaces = "[‎ \n]*";

		var toTitleNamespace = toTitle.split(":", 1)[0];



		// If we are fixing categories, just fix all the links.

		if (fixPage_fixCategories) {

			if (!content.indexOf("#REDIRECT") == 0 || !content.indexOf("__STATICREDIRECT__") !== -1) {

				if (":" in toTitle && toTitleNamespace in namespaceIds) {

					// We are moving to a page with a namespace

					content = content.replace(

						RegExp(

							"\\[\\["+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\]\\]",

							'g'

						),

						"[["+toTitle+"|$1]]"

					);

				}

				else {

					content = content.replace(

						RegExp(

							"\\[\\["+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\]\\]",

							'g'

						),

						"[[:"+toTitle+"|$1]]"

					);

				}

				content = content

					.replace(

						RegExp(

							"\\[\\["+whitespaces+"("+safeFromTitle+")"+whitespaces+"\\]\\]",

							'g'

						),

						"[["+toTitle+"]]"

					)

					.replace(

						RegExp(

							"\\[\\["+whitespaces+safeFromTitle+whitespaces+"\\|"+whitespaces+"(.+?)"+whitespaces+"\\]\\]",

							'g'

						),

						"[["+toTitle+"]]"

					)

					.replace(

						RegExp(

							"\\[\\["+whitespaces+":"+safeFromTitle+""+whitespaces+"\\|"+whitespaces+"(.+?)"+whitespaces+"\\]\\]",

							'g'

						),

						"[[$1"+toTitle+"|$2]]"

					);

			}

			content = content

					.replace(

						RegExp(

							"(?:^|[^{])\\{\\{"+whitespaces+"(:?)"+safeFromTitle+whitespaces+"\\}\\}",

							'g'

						),

						"{{$1"+toTitle+"}}"

					)

					.replace(

						RegExp(

							"(?:^|[^{])\\{\\{"+whitespaces+"(:?)"+safeFromTitle+whitespaces+"\\|"+whitespaces+"(.+?)"+whitespaces+"\\}\\}",

							'g'

						),

						"{{$1"+toTitle+"|$2}}"

					);

		}



		else {

			// Has the side effect of also fixing redirects

			if (fixPage_fixLinks) {

				if (!content.indexOf("#REDIRECT") == 0 || !content.indexOf("__STATICREDIRECT__") !== -1)

					if (":" in toTitle && toTitleNamespace in namespaceIds) {

						// We are moving to a page with a namespace

						content = content.replace(RegExp("\\[\\["+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\]\\]", 'g'), "[["+toTitle+"|$1]]");

					}

					else {

						content = content.replace(

							RegExp(

								"\\[\\["+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\]\\]",

								'g'

							),

							"[[:"+toTitle+"|$1]]"

						);

					}

					content = content

						.replace(

							RegExp(

								"\\[\\["+whitespaces+"(:?)("+safeFromTitle+")"+whitespaces+"\\]\\]",

								'g'

							),

							"[[$1"+toTitle+"|$2]]"

						)

						.replace(

							RegExp(

								"\\[\\["+whitespaces+"(:?)"+safeFromTitle+whitespaces+"\\|"+whitespaces+"(.+?)"+whitespaces+"\\]\\]",

								'g'

							),

							"[[$1"+toTitle+"|$2]]"

						)

						// If undoing a move, this makes sure it fixes things like [[Apple|Apple]] to [[Apple]]

						.replace(

							RegExp(

								"\\[\\["+whitespaces+"(:?)"+safeToTitle+whitespaces+"\\|"+whitespaces+safeToTitle+whitespaces+"\\]\\]",

								'g'

							),

							"[[$1"+toTitle+"]]"

						);

				

				if (wToolCore.settings.VIEWING_NAMESPACE === 6) { // File namespace, make sure to process the usage of <gallery>

					content = content.replace(RegExp(safeFromTitle, 'g'), toTitle);

				}

			}



			if (fixPage_fixTransclusions) {

				// Make sure to cut out the "Template:" prefix

				if (toTitle.indexOf(templatePrefix) == 0) toTitle = toTitle.replace(templatePrefix, "");

				else if (!toTitle.slice(0, toTitle.indexOf(":")).toLowerCase() in namespaceIds)

					// No namespace defined, it is in mainspace

					toTitle = ":" + toTitle;

				

				if (":" in toTitle && toTitleNamespace in namespaceIds) {

					// We are moving to a page with a namespace

					content = content

						.replace(

							RegExp(

								"\\{\\{"+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\}\\}", 'g'

							),

							"{{"+toTitle+"}}"

						)

						.replace(

							RegExp(

								"\\{\\{"+whitespaces+"\\:("+safeFromTitle+")"+whitespaces+"\\|", 'g'

							),

							"{{"+toTitle+"|"

						);

				}

				else {

					// We are moving to a page without a namespace, make sure templates include a colon

					content = content

						.replace(

							RegExp(

								"\\{\\{"+whitespaces+"\\("+safeFromTitle+")"+whitespaces+"\\}\\}", 'g'

							),

							"{{:"+toTitle+"}}"

						)

						.replace(

							RegExp(

								"\\{\\{"+whitespaces+"\\("+safeFromTitle+")"+whitespaces+"\\|", 'g'

							),

							"{{:"+toTitle+"|"

						);

				}



				if (wToolCore.settings.VIEWING_NAMESPACE === 10) {

					var shortFromTitle = wToolCore.escapeRegex(fromTitle.replace(templatePrefix, "")).replace(/[ _]/g, "[ _]");

					content = content

						.replace(

							RegExp(

								"(?:^|[^{])\\{\\{"+whitespaces+"(:?)"+shortFromTitle+whitespaces+"\\}\\}", 'g'

							),

							"{{$1"+toTitle+"}}"

						)

						.replace(

							RegExp(

								"(?:^|[^{])\\{\\{"+whitespaces+"(:?)"+shortFromTitle+whitespaces+"\\|"+whitespaces+"(.+?)"+whitespaces+"\\}\\}",

								'g'

							),

							"{{$1"+toTitle+"|$2}}"

						);

				}



				content = content.replace(

					RegExp(

						'(?:^|[^{])\\{\\{' + whitespaces + '(:?)' + safeFromTitle + whitespaces + '\\}\\}',

						'g'

					),

					'{{$1' + toTitle + '}}'

				)

				.replace(

					RegExp(

						'(?:^|[^{])\\{\\{' + whitespaces + '(:?)' + safeFromTitle + whitespaces + '\\|' + whitespaces + '(.+?)' + whitespaces + '\\}\\}',

						'g'

					),

					'{{$1' + toTitle + '|$2}}'

				);

			}

		}

		return content;

	}

};
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
/*

	Module script

	This module adds a "template user" button to the tools dropdown

*/

// Dependancies: lib/editTools.js, core/settings.js, lib/userFeedback.js, lib/form.js



wToolCore.showTemplateUserPageUI = function() {

	function onSubmitPressed(dialog, pass_submit_params) {

		var template = pass_submit_params[0];

		// Send the actual template to the user

		var pageTitle = "User_talk:" + mw.config.get("wgRelevantUserName");



		var message = template.message;

		if (template.sectionTitle) {

			message = "== " + template.sectionTitle + " ==\n\n" + message;

		}



		var editSummary = template.editSummary;



		if (template.arguments) {

			template.arguments.forEach(function(arg) {

				if (arg.type === "textbox") {

					message = message.replace("{{{" + arg.name + "}}}", dialog[arg.name].value.trim());

					editSummary = editSummary.replace("{{{" + arg.name + "}}}", dialog[arg.name].value.trim());

				}

			});

		}



		wToolCore.editPage({

			title: pageTitle,

			appendtext: "\n\n\n" + message,

			summary: editSummary

		}).then(

			function() {

				dialog.close();

				wToolCore.displaySuccessAfterReload("Successfuly sent message!");

				location.href = wToolCore.getArticlePath(pageTitle) + "#footer";

				location.reload();

			},

			function(error, e) {

				dialog.close();

				wToolCore.displayErrorJSON(error, e);

			}

		);

	}





	if (!wToolCore.perWikiConfigReady) return

    var configData = wToolCore.perWikiConfig.userTemplating;

	var redirectData = [];





	if (configData === null) {

		mw.notify("User templating not configured on this wiki!", {type: "error", tag: "err-sp-delete"});

		return;

	}



	// Generates the form

	var formOutput = [];

	for (var categoryIndex in configData) {

		var category = configData[categoryIndex];



		if (formOutput) formOutput.push("field start");

		formOutput.push(

			"field start",

			{type: "header2", text: category.category_name},

			"field start",

			{type: "label", text: category.tooltip.replace("{user}", mw.config.get("wgRelevantUserName")) + "."},

			"field end"

		);



		for (var templateIndex in category.templates) {

			var template = category.templates[templateIndex];



			formOutput.push(

				{type: "button", text: template.template_name, tooltip: template.tooltip, pass_click_params: [categoryIndex, templateIndex], onclick: function(dialog, pass_click_params) {

					var template_data = configData[pass_click_params[0]].templates[pass_click_params[1]];

					

					dialog.close();

					var output = [

						{type: "label", text: template_data.description.replace("{user}", mw.config.get("wgRelevantUserName"))}

					];

					if (template_data.arguments) for (var argIndex in template_data.arguments) {

						output.push(template_data.arguments[argIndex]);

					}

					wToolCore.createForm(template_data.formHeader.replace("{user}", mw.config.get("wgRelevantUserName")), output, {

						onSubmit: onSubmitPressed,

						cancelText: "Back",

						pass_submit_params: [template_data],

						onCancel: wToolCore.showTemplateUserPageUI

					});

				}

				}

			);

		}

	}

	wToolCore.createForm("Template this user", formOutput);

}







if (mw.config.get("wgRelevantUserName")) {

	wToolCore.addToolButton("ca-templateUser", "Template this user", "Template this user.", wToolCore.showTemplateUserPageUI);

}

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
/*

	Module script

	This module adds a "vote for delete" button to the tools dropdown

*/

// Dependancies: lib/editTools.js, core/settings.js, lib/userFeedback.js, lib/form.js, modules/speedyDelete.js



wToolCore.showVoteForDeletePageUI = function() {

	var configData = wToolCore.perWikiConfig.VFD;

	var redirectData = [];



	function makeRequest(dialog, onComplete) {

		wToolCore.displayInfo("Posting to " + configData.target_page + ".")

		var reportReason = dialog.reason.value.trim();

		var scoretext = dialog.scoretext.value.trim();

		var pageName = mw.config.get('wgPageName');

		var redirectsDeleting = 0;

		var additionalRedirectText = "";

		var setVars = (function(string, content) {return string.replace("{{{PAGE}}}", pageName).replace("{{{SCORETEXT}}}", scoretext).replace("{{{REASON}}}", reportReason).replace("{{{CONTENT}}}", content).replace("{{{REDIRECTS}}}", additionalRedirectText)});





		var redirectCheckbox = dialog.deleteredirects;

		if (redirectCheckbox != null && redirectCheckbox.isSelected()) {

			for (var redirectIndex in redirectData) {

				var redirect = redirectData[redirectIndex];

				if (dialog["redirectoption_" + redirect.title].isSelected()) {

					redirectsDeleting ++;

					if (!additionalRedirectText) additionalRedirectText += setVars(configData.redirect_append_start);

					else additionalRedirectText += setVars(configData.redirect_append);

				}

			}

		}



		var editSummary = '[Starting a vote to delete [[' + pageName + ']]' +

			(redirectsDeleting > 0 ?

			' (And [[Special:WhatLinksHere/' + pageName + '|' +

				redirectsDeleting + ' Redirect' + (redirectsDeleting !== 1 ? 's' : '') + ']])' :

			'') +

		'] ' + reportReason;



		var shortEditSummary = '[Starting a vote to delete [[' + pageName + ']]] ' + reportReason;

		var message = setVars(mw.config.get("wgIsRedirect") ? configData.redirect_append : configData.message);





		// If there is no message to send to a page, assume that we must put the templates on all redirects.

		if (!configData.send_page_notice && redirectsDeleting > 0) for (var redirect in redirectData) {

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

				wToolCore.displaySuccessAfterReload("Successfuly started vote!");



				// Posting the template is required if there is no target page.

				if (configData.send_page_notice) {

					wToolCore.displayInfo("Adding VFD template to page.")



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

			},

			{

				type: "textbox",

				name: "scoretext",

				text: "Score Text:",

				placeholder: "Score Text"

			}

		];

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





if (wToolCore.perWikiConfigReady && mw.config.get("wgNamespaceNumber") >= 0 && mw.config.get('wgPageName').replace(/_/g, " ") !== wToolCore.perWikiConfig.VFD.target_page.replace(/_/g, " ")) {

	wToolCore.addToolButton("ca-VFD", "Vote for delete", "Add this page to VFD.", wToolCore.showVoteForDeletePageUI);

}

// Dependancies: modules/liveNotifications.js, modules/moveTools.js, modules/restoreTools.js, modules/GUIPanel.js, modules/makePageNonShort.js, modules/purgePage.js, modules/userTemplating.js, modules/speedyDelete.js, modules/voteForDelete.js////// +++++++ IMPORT SCRIPTS HERE +++++++ //////

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

//</nowiki>