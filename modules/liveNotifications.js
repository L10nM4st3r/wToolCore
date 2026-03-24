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
