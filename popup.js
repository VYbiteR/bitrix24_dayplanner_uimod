document.addEventListener('DOMContentLoaded', () => {
	const input = document.getElementById('taskIds');
	chrome.storage.local.get('setToPlanIds', data => {
		   if (data.setToPlanIds) {
			     document.getElementById('taskIds').value = data.setToPlanIds;
			   }
		  });
	input.addEventListener('input', () => {
		chrome.storage.local.set({ setToPlanIds: input.value });
	});

	document.getElementById('addBtn').addEventListener('click', () => {
	const ids = document.getElementById('taskIds').value.trim();
	if (!ids) {
		alert('Введите хотя бы один ID задачи');
		return;
	}
	chrome.storage.local.set({ setToPlanIds: ids });
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const tab = tabs[0];
			try {
				const url = new URL(tab.url);
				url.searchParams.set('set_to_plan', ids);
				chrome.tabs.update(tab.id, { url: url.toString() });
			} catch (err) {
				console.error('Не удалось обработать URL:', tab.url, err);
				alert('Это не страница Bitrix24');
			}
		});

		window.close();
	});
});