(function () {
    ['injected.js', 'injected_timeman.js'].forEach(file => {
        const s = document.createElement('script');
        s.src = chrome.runtime.getURL(file);
        s.onload = () => s.remove();
        (document.head || document.documentElement).appendChild(s);
    });
  })();
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    
    const messageId = Date.now() + Math.random().toString(36).slice(2);
    msg._messageId = messageId;

   
    window.postMessage(msg, '*');

    const timeout = setTimeout(() => {
        window.removeEventListener('message', onMessage);
        sendResponse({ error: 'Timeout: no response from injected_timeman.js' });
    }, 1000); 

    function onMessage(e) {
        const { data } = e;
        if (data?.from === 'injected_timeman' && data._messageId === messageId) {
            clearTimeout(timeout);
            window.removeEventListener('message', onMessage);
            sendResponse(data.payload);
        }
    }

    window.addEventListener('message', onMessage);
    return true;
});
