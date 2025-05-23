document.addEventListener('DOMContentLoaded', () => {
	// Элементы
	const taskInput   = document.getElementById('taskIds');
	const addBtn      = document.getElementById('addBtn');
	const openWorkBtn  = document.getElementById('openWorkBtn');
	const pauseWorkBtn  = document.getElementById('pauseWorkBtn');
	const reopenWorkBtn = document.getElementById('reopenWorkBtn');
	const closeWorkBtn  = document.getElementById('closeWorkBtn');

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

	document.querySelectorAll('button[data-action]').forEach(button => {
		button.addEventListener('click', () => {
			const action = button.dataset.action;
			chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
				if (!tabs[0]) return;
				const tabId = tabs[0].id;
				chrome.tabs.sendMessage(tabs[0].id, {
					action: 'workTime',
					workAction: action
				},()=> {

					setTimeout(() => {
						chrome.tabs.sendMessage(tabId, {
							action: 'getState'
						}, response => {
							console.log('[popup] getState response after action:', response);
							const state = response?.STATE;
							const info = response?.INFO;
							updateButtons(state, info);
						});
					}, 600);
				});
			});
		});
	});
	const textarea = document.getElementById('reportText');

	function updateButtons(state, info) {
		// console.log('[popup] Updating buttons for state:', state);
		// console.log('[popup] Info:', info);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayTimestamp = Math.floor(today.getTime() / 1000);

		const dateStart = parseInt(info?.DATE_START || '0', 10);
		const hadShiftToday = dateStart >= todayTimestamp;

		// Скрыть всё по умолчанию
		[openWorkBtn, pauseWorkBtn, reopenWorkBtn, closeWorkBtn].forEach(btn => btn.style.display = 'none');

		if (state === 'OPENED') {
			pauseWorkBtn.style.display = 'block';
			closeWorkBtn.style.display = 'block';
		} else if (state === 'PAUSED') {
			reopenWorkBtn.style.display = 'block';
			closeWorkBtn.style.display = 'block';
		} else if (state === 'CLOSED') {
			if (!hadShiftToday) {
				openWorkBtn.style.display = 'block';
			}
			    reopenWorkBtn.style.display = 'block';
		} else if (state === 'EXPIRED') {
			openWorkBtn.style.display = 'block';
		}
	}

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

		chrome.tabs.sendMessage(tabs[0].id, {
			action: 'getState'
		}, response => {
			console.log('[popup] getState response:', response);
			const state = response?.STATE;
			const info  = response?.INFO;
			const tasks = response?.TASKS || [];
			updateButtons(state, info);
			renderTasks(tasks);
		});
	});


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

	function formatSeconds(seconds) {
		if (!seconds || isNaN(seconds)) return '';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		return `${h}ч ${m}м`;
	}


	function getCurrentDomain(callback) {
		chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
			if (!tabs[0]) return;
			try {
				const url = new URL(tabs[0].url);
				callback(`${url.origin}`);
			} catch {
				callback('');
			}
		});
	}

	function renderTasks(tasks) {
		const container = document.getElementById('taskList');
		container.innerHTML = '';

		getCurrentDomain(domain => {
			tasks.forEach(task => {
				const el = document.createElement('div');
				el.className = 'task-item';

				const left = document.createElement('div');
				left.className = 'task-left';

				const title = document.createElement('a');
				title.href = `${domain}/company/personal/user/${task.RESPONSIBLE_ID}/tasks/task/view/${task.ID}/`;
				title.textContent = task.TITLE;
				title.className = 'task-title';
				title.target = '_blank';


				const time = document.createElement('div');
				time.className = 'task-time';
				const spent = formatSeconds(parseInt(task.TIME_SPENT_IN_LOGS || '0'));
				time.textContent = spent || '';

				left.appendChild(title);
				if (spent) left.appendChild(time);

				el.appendChild(left);

				if (task.PRIORITY === '2') {
					const icon = document.createElement('img');
					icon.src = 'fire.svg';
					icon.alt = '🔥';
					icon.className = 'task-priority';
					el.appendChild(icon);
				}

				container.appendChild(el);
			});
		});
	}



	textarea.addEventListener('blur', sendUpdatedReport);
	window.addEventListener('unload', sendUpdatedReport);
});
