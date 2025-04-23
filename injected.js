(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const raw = urlParams.get('set_to_plan');
  
    if (!raw) return;
  
    const taskIds = raw
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));
  
    if (taskIds.length === 0) {
      console.warn('[Bitrix Planner Inject] Неверный список задач');
      return;
    }
  
    const run = async () => {
      const sessid = BX.bitrix_sessid();
      const currentUserId = parseInt(BX.message('USER_ID'), 10);
      const taskInfoList = [];
  
      for (const id of taskIds) {
        try {
          const result = await BX.ajax.runAction('tasks.task.get', {
            data: { taskId: id }
          });
          const task = result.data.task;
          if (parseInt(task.responsibleId, 10) === currentUserId) {
            taskInfoList.push({
              id: task.id,
              title: task.title,
              responsible: task.responsibleId
            });
          } else {
            console.log(`[Bitrix Planner Inject] Пропущена задача ${task.id} — ответственный другой пользователь`);
          }
        } catch (err) {
          console.warn(`[Bitrix Planner Inject] Не удалось получить задачу ${id}`, err);
        }
      }
  
      if (taskInfoList.length === 0) {
        console.log('[Bitrix Planner Inject] Нет задач для добавления (ни одна не принадлежит текущему пользователю)');
        removeSetToPlanFromUrl();
        return;
      }
  
      const postData = new URLSearchParams();
      taskInfoList.forEach((task, i) => postData.append(`add[${i}]`, task.id));
  
      fetch(`/bitrix/tools/intranet_planner.php?action=task&site_id=s1&sessid=${sessid}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: postData.toString()
      })
        .then(async resp => {
          const contentType = resp.headers.get("Content-Type") || "";
          if (resp.ok && contentType.includes("application/json")) {
            console.log('[Bitrix Planner Inject] Добавлены задачи:', taskInfoList);
            showToast(taskInfoList);
            removeSetToPlanFromUrl();
          } else {
            const text = await resp.text();
            console.warn('[Bitrix Planner Inject] Не-JSON ответ:', text);
          }
        })
        .catch(err => {
          console.error('[Bitrix Planner Inject] Ошибка запроса:', err);
        });
    };
  
    function showToast(taskList) {
      const content = taskList.map(t => `• ${t.title} (ID: ${t.id})`).join('<br>');
      if (BX && BX.UI && BX.UI.Notification && BX.UI.Notification.Center) {
        BX.UI.Notification.Center.notify({
          content: `Добавлены задачи в план:<br>${content}`,
          autoHideDelay: 5000,
          position: "top-right"
        });
      } else {
        console.log('[Bitrix Planner Inject] Toast fallback:\n', content);
      }
    }
  
    function removeSetToPlanFromUrl() {
      const url = new URL(window.location.href);
      url.searchParams.delete('set_to_plan');
      window.history.replaceState({}, document.title, url.toString());
    }
  
    if (typeof BX !== 'undefined' && typeof BX.ready === 'function') {
      BX.ready(run);
    } else {
      console.warn('[Bitrix Planner Inject] BX не определён');
    }
  })();
  