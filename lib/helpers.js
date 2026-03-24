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


