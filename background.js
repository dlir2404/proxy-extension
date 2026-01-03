let proxyEnabled = false;
let proxyConfig = null;

// Load cấu hình khi extension khởi động
chrome.storage.local.get(['proxyEnabled', 'proxyConfig'], (result) => {
  proxyEnabled = result.proxyEnabled || false;
  proxyConfig = result.proxyConfig || null;
  
  if (proxyEnabled && proxyConfig) {
    setProxy(proxyConfig);
  }
});

// Lắng nghe tin nhắn từ popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleProxy') {
    proxyEnabled = request.enabled;
    proxyConfig = request.config;
    
    chrome.storage.local.set({ 
      proxyEnabled: proxyEnabled,
      proxyConfig: proxyConfig 
    });
    
    if (proxyEnabled && proxyConfig) {
      setProxy(proxyConfig);
      sendResponse({ success: true, message: 'Proxy đã bật' });
    } else {
      clearProxy();
      sendResponse({ success: true, message: 'Proxy đã tắt' });
    }
    return true;
  }
  
  if (request.action === 'getStatus') {
    sendResponse({ 
      enabled: proxyEnabled,
      config: proxyConfig 
    });
    return true;
  }
});

// Thiết lập proxy
function setProxy(config) {
  const proxyRules = {
    mode: "fixed_servers",
    rules: {
      singleProxy: {
        scheme: config.protocol || "http",
        host: config.host,
        port: parseInt(config.port)
      },
      bypassList: ["localhost", "127.0.0.1"]
    }
  };
  
  chrome.proxy.settings.set(
    { value: proxyRules, scope: 'regular' },
    () => {
      console.log('Proxy đã được thiết lập:', config);
    }
  );
  
  // Xử lý authentication
  if (config.username && config.password) {
    chrome.webRequest.onAuthRequired.addListener(
      (details, callback) => {
        callback({
          authCredentials: {
            username: config.username,
            password: config.password
          }
        });
      },
      { urls: ["<all_urls>"] },
      ['blocking']
    );
  }
}

// Xóa proxy
function clearProxy() {
  chrome.proxy.settings.clear({ scope: 'regular' }, () => {
    console.log('Proxy đã được tắt');
  });
  
  // Xóa listener authentication
  if (chrome.webRequest.onAuthRequired.hasListeners()) {
    chrome.webRequest.onAuthRequired.removeListener();
  }
}