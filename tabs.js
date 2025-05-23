document.addEventListener('DOMContentLoaded', () => {
	const tabs = document.querySelectorAll('.tab');
	const contents = document.querySelectorAll('.tab-content');

	// Загрузить сохранённый таб из localStorage
	const savedTab = localStorage.getItem('activeTab') || 'main';

	// Активировать сохранённый таб
	activateTab(savedTab);

	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const tabId = tab.dataset.tab;

			// Сохранить выбор
			localStorage.setItem('activeTab', tabId);

			activateTab(tabId);
		});
	});

	function activateTab(tabId) {
		tabs.forEach(t => t.classList.remove('active'));
		contents.forEach(c => c.classList.remove('active'));

		document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add('active');
		document.getElementById(tabId)?.classList.add('active');
	}
});
