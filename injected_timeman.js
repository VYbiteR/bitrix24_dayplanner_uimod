;(function(){
    const SITE_ID   = 's1';
    const BASE      = '/bitrix/tools/timeman.php';
    let RECORD_ID = 1076;

    function fetchUpdateAndReturnReport(messageId) {
        const sessid = BX.bitrix_sessid();
        BX.ajax({
            url: `${BASE}?action=update&site_id=${SITE_ID}&sessid=${sessid}`,
            method: 'POST',
            dataType: 'text',
            data: {
                recordId: RECORD_ID,
                device: 'browser'
            },
            onsuccess(text) {
                let data;
                try { data = JSON.parse(text); }
                catch { data = eval('(' + text + ')'); }
                //console.log('timeman:update → REPORT:', data.REPORT);
                RECORD_ID=data.ID;

                window.postMessage({
                    from: 'injected_timeman',
                    _messageId: messageId,
                    payload: { report: data.REPORT, recordId: data.ID }
                }, '*');
            },
            onfailure(err) {
                // console.error('timeman:update error', err);
            }
        });
    }

    function sendReportManually(report) {
        const sessid = BX.bitrix_sessid();
        const safeReport = String(report);

       // console.log('Value:', safeReport, '| Type:', typeof safeReport);
        BX.ajax({
            url: `${BASE}?action=report&site_id=${SITE_ID}&sessid=${sessid}`,
            method: 'POST',
            dataType: 'text',
            data: {
                entry_id:  RECORD_ID,
                report:    safeReport,
                report_ts: Math.floor(Date.now() / 1000)+25180,
                device:    'browser'
            },
            onsuccess(res) {
                // console.log('timeman:report отправлен ', report);
                // console.log('Ответ сервера:', res);
            },
            onfailure(err) {
               // console.error('timeman:report ошибка', err);
            }
        });
    }

    function performWorkTimeAction(action) {
        if (!['open', 'pause', 'reopen', 'close'].includes(action)) {
            console.warn('Неверное действие:', action);
            return;
        }

        const sessid = BX.bitrix_sessid();
        BX.ajax({
            url: `${BASE}?action=${action}&site_id=${SITE_ID}&sessid=${sessid}`,
            method: 'POST',
            dataType: 'text',
            data: {
                entry_id: RECORD_ID,
                device: 'browser'
            },
            onsuccess(res) {
                console.log(`timeman:${action} выполнено`, res);
            },
            onfailure(err) {
                console.error(`Ошибка timeman:${action}`, err);
            }
        });
    }


    window.addEventListener('message', e => {
        if (!window.BX || !BX.bitrix_sessid) return;
        if (!e.data?.action) return;

        if (e.data.action === 'getReport') {
            fetchUpdateAndReturnReport(e.data._messageId);
        }

        if (e.data.action === 'sendReport') {
            sendReportManually(e.data.report);
        }

        if (e.data.action === 'workTime') {
            performWorkTimeAction(e.data.workAction);
        }

        if (e.data.action === 'getState') {
            const sessid = BX.bitrix_sessid();
            BX.ajax({
                url: `${BASE}?action=update&site_id=${SITE_ID}&sessid=${sessid}`,
                method: 'POST',
                dataType: 'text',
                data: {
                    recordId: RECORD_ID,
                    device: 'browser'
                },
                onsuccess(text) {
                    let data;
                    try { data = JSON.parse(text); }
                    catch { data = eval('(' + text + ')'); }
                    window.postMessage({
                        from: 'injected_timeman',
                        _messageId: e.data._messageId,
                        payload: {
                            STATE: data.STATE,
                            INFO: data.INFO,
                            TASKS: data.PLANNER.TASKS
                        }
                    }, '*');
                },
                onfailure(err) {
                    console.error('timeman:getState error', err);
                }
            });
        }

        if (e.data.action === 'getDomain') {
            window.postMessage({
                from: 'injected_timeman',
                _messageId: e.data._messageId,
                payload: {
                    domain: window.location.origin
                }
            }, '*');
        }

    });
})();
