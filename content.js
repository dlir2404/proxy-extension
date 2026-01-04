// Content script - inject fingerprint spoofing
(function() {
  // Get fingerprint from background
  chrome.runtime.sendMessage({ action: 'getFingerprint' }, (response) => {
    if (response && response.fingerprint) {
      // Inject script to page context
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('injected.js');
      script.onload = function() {
        this.remove();
        
        // Send fingerprint to injected script
        window.postMessage({
          type: 'FINGERPRINT_DATA',
          fingerprint: response.fingerprint
        }, '*');
      };
      (document.head || document.documentElement).appendChild(script);
    }
  });
})();