document.addEventListener('DOMContentLoaded', () => {
	// Элементы
	const recordInput = document.getElementById('recordIdInput');
	const taskInput   = document.getElementById('taskIds');
	const addBtn      = document.getElementById('addBtn');

	// 1) Логика записи и загрузки Task IDs
	chrome.storage.local.get('setToPlanIds', data => {
		if (data.setToPlanIds) {
			taskInput.value = data.setToPlanIds;
		}
	});
	taskInput.addEventListener('input', () => {
		chrome.storage.local.set({ setToPlanIds: taskInput.value });
	});
	addBtn.addEventListener('click', () => {
		const ids = taskInput.value.trim();
		if (!ids) {
			alert('Введите хотя бы один ID задачи');
			return;
		}
		chrome.storage.local.set({ setToPlanIds: ids });
		chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
			const tab = tabs[0];
			try {
				const url = new URL(tab.url);
				url.searchParams.set('set_to_plan', ids);
				chrome.tabs.update(tab.id, { url: url.toString() });
			} catch {
				alert('Это не страница Bitrix24');
			}
		});
		window.close();
	});

	// 2) Функция-триггер для timeman:update
	function sendTrigger() {
		const recordId = recordInput.value.trim();
		console.log('>>> Отправляем recordId из input:', recordId);
		chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
			if (!tabs[0]) return;
			chrome.tabs.sendMessage(tabs[0].id, {
				action:   'triggerUpdate',
				recordId: recordId
			});
		});
	}

	// 3) Повесить sendTrigger на blur и при закрытии попапа
	recordInput.addEventListener('blur', sendTrigger);
	window.addEventListener('unload', sendTrigger);
});
