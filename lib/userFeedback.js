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