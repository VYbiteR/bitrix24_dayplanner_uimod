(function () {
    ['injected.js', 'injected_timeman.js'].forEach(file => {
        const s = document.createElement('script');
        s.src = chrome.runtime.getURL(file);
        s.onload = () => s.remove();
        (document.head || document.documentElement).appendChild(s);
    });
  })();
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'triggerUpdate') {
        window.postMessage({
            action:   'triggerUpdate',
            recordId: msg.recordId
        }, '*');
    }
});