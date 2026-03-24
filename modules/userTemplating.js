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
