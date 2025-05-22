document.addEventListener('DOMContentLoaded', () => {
	// Элементы
	const recordInput = document.getElementById('reportInput');
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


	const textarea = document.getElementById('reportText');

	// При открытии: запрашиваем REPORT по recordId=1076
	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		if (!tabs[0]) return;
		chrome.tabs.sendMessage(tabs[0].id, {
			action:   'getReport'
		}, response => {
			textarea.value = response?.report || '';
			const now = new Date();
			const hh = String(now.getHours()).padStart(2, '0');
			const mm = String(now.getMinutes()).padStart(2, '0');
			const timestamp = `${hh}:${mm}: `;

			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;

			const before = textarea.value.substring(0, start);
			const after = textarea.value.substring(end);

			textarea.value = before + "\n" + timestamp + after;

		});
	});

	// При закрытии попапа — отправляем REPORT
	function sendUpdatedReport() {
		const report = textarea.value.trim();
		chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
			if (!tabs[0]) return;
			chrome.tabs.sendMessage(tabs[0].id, {
				action: 'sendReport',
				report: report
			});
		});
	}

	textarea.addEventListener('blur', sendUpdatedReport);
	window.addEventListener('unload', sendUpdatedReport);
});
