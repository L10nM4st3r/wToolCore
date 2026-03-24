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