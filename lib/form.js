/*
	Library script
	This script contains the handler for creating forms
*/



// Creates a form dialouge menu.
wToolCore.createForm = function(title, form_content, settings) {
	settings = do_default(settings, {});

	mw.loader.using( [ 'oojs-ui-windows', 'oojs-ui-widgets', 'oojs-ui-core', 'oojs-ui', 'oojs' ] ).then(function() {
		function FormMenu( config ) {
			FormMenu.super.call( this, config );
		}
		OO.inheritClass(FormMenu, OO.ui.ProcessDialog);
	
		FormMenu.static.name = 'lion-formMenu';
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
					else if (item === "field end")
						field = null;
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
		
		var windowManager = new OO.ui.WindowManager();
		$('body').append( windowManager.$element);
	
		var menu = new FormMenu({
			size: 'medium'
		});
	
		windowManager.addWindows([menu]);
		windowManager.openWindow(menu);
	});
}
