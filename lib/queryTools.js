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