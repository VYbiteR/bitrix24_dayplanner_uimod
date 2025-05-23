// Переключение табов
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
	tab.addEventListener('click', () => {
		const target = tab.dataset.tab;
		tabs.forEach(t => t.classList.remove('active'));
		tab.classList.add('active');

		contents.forEach(c => {
			c.id === target ? c.classList.add('active') : c.classList.remove('active');
		});
	});
});