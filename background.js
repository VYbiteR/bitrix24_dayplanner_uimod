chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

	if (
		changeInfo.status === 'loading' &&
		/^https:\/\/.*\.bitrix24\.ru\/company\/personal\/user\/\d+\/tasks/.test(tab.url)
	) {
		chrome.storage.local.remove('setToPlanIds');
	}
});
