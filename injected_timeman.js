;(function(){
    const SITE_ID = 's1';
    const BASE    = '/bitrix/tools/timeman.php';
    let recordId  = 0;

    // 4.1. Обновление учёта времени
    function fetchUpdate(){
        const sessid = BX.bitrix_sessid();
        BX.ajax({
            url:    `${BASE}?action=update&site_id=${SITE_ID}&sessid=${sessid}`,
            method: 'POST',
            dataType: 'text',
            data: {
                recordId: recordId,
                device:   'browser'
            },
            onsuccess(text){
                let data;
                try { data = JSON.parse(text); }
                catch { data = eval('('+text+')'); }
                console.log('timeman:update data', data);
                recordId = Number(data.entry_id) || recordId;
                sendReport(data, sessid);
            },
            onfailure(err){
                console.error('timeman:update error', err, err.xhr && err.xhr.responseText);
                scheduleNext();
            }
        });
    }

    // 4.2. Отправка отчёта
    function sendReport(data, sessid){
        BX.ajax({
            url:    `${BASE}?action=report&site_id=${SITE_ID}&sessid=${sessid}`,
            method: 'POST',
            dataType: 'text',
            data: {
                entry_id:  data.entry_id,
                report_ts: data.report_ts,
                report:    data.report,
                device:    'browser'
            },
            onsuccess(){
                console.log('timeman:report success');
                scheduleNext();
            },
            onfailure(err){
                console.error('timeman:report error', err, err.xhr && err.xhr.responseText);
                scheduleNext();
            }
        });
    }

    function scheduleNext(){
        setTimeout(fetchUpdate, 60_000);
    }

    // 4.3. Инициализация
    function init(){
        if (!window.BX || !BX.bitrix_sessid) {
            return setTimeout(init, 100);
        }
        fetchUpdate();
    }
    init();

    // 4.4. Триггер на внешнее сообщение
    window.addEventListener('message', e => {
        if (e.data && e.data.action === 'triggerUpdate') {
            if (e.data.recordId !== undefined) {
                recordId = Number(e.data.recordId) || recordId;
            }
            fetchUpdate();
        }
    });
})();
