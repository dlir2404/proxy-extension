let proxyEnabled = false;
let proxyConfig = null;
let fingerprintEnabled = true;
let currentFingerprint = null;

// Load config
chrome.storage.local.get(['proxyEnabled', 'proxyConfig', 'fingerprintEnabled', 'currentFingerprint'], (result) => {
  proxyEnabled = result.proxyEnabled || false;
  proxyConfig = result.proxyConfig || null;
  fingerprintEnabled = result.fingerprintEnabled !== false;
  currentFingerprint = result.currentFingerprint || null;
  
  if (proxyEnabled && proxyConfig) {
    setProxy(proxyConfig);
  }
  
  if (fingerprintEnabled && !currentFingerprint) {
    generateFingerprint();
  }
});

// Message listener
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
  
  if (request.action === 'toggleFingerprint') {
    fingerprintEnabled = request.enabled;
    chrome.storage.local.set({ fingerprintEnabled: fingerprintEnabled });
    
    if (fingerprintEnabled) {
      generateFingerprint();
    }
    sendResponse({ success: true, fingerprint: currentFingerprint });
    return true;
  }
  
  if (request.action === 'regenerateFingerprint') {
    generateFingerprint();
    sendResponse({ success: true, fingerprint: currentFingerprint });
    return true;
  }
  
  if (request.action === 'getStatus') {
    sendResponse({ 
      enabled: proxyEnabled,
      config: proxyConfig,
      fingerprintEnabled: fingerprintEnabled,
      fingerprint: currentFingerprint
    });
    return true;
  }
  
  if (request.action === 'getFingerprint') {
    sendResponse({ fingerprint: currentFingerprint });
    return true;
  }
});

// Proxy setup
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
  
  chrome.proxy.settings.set({ value: proxyRules, scope: 'regular' });
  
  // Handle authentication - simplified version
  if (config.username && config.password) {
    chrome.webRequest.onAuthRequired.addListener(
      (details) => {
        return {
          authCredentials: {
            username: config.username,
            password: config.password
          }
        };
      },
      { urls: ["<all_urls>"] },
      ['asyncBlocking']
    );
  }
}

function clearProxy() {
  chrome.proxy.settings.clear({ scope: 'regular' });
}

// Generate random fingerprint
function generateFingerprint() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ];
  
  const languages = [
    'en-US,en;q=0.9',
    'en-GB,en;q=0.9',
    'vi-VN,vi;q=0.9,en;q=0.8',
    'zh-CN,zh;q=0.9,en;q=0.8',
    'ja-JP,ja;q=0.9,en;q=0.8'
  ];
  
  const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
  const vendors = ['Google Inc.', 'Apple Computer, Inc.', ''];
  
  const screens = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 2560, height: 1440 },
    { width: 1440, height: 900 }
  ];
  
  const timezones = [
    'America/New_York',
    'America/Los_Angeles', 
    'Europe/London',
    'Asia/Tokyo',
    'Asia/Ho_Chi_Minh'
  ];
  
  const screen = screens[Math.floor(Math.random() * screens.length)];
  
  currentFingerprint = {
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    language: languages[Math.floor(Math.random() * languages.length)],
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    vendor: vendors[Math.floor(Math.random() * vendors.length)],
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: 24,
    pixelRatio: Math.random() > 0.5 ? 1 : 2,
    hardwareConcurrency: [2, 4, 8, 16][Math.floor(Math.random() * 4)],
    deviceMemory: [2, 4, 8, 16][Math.floor(Math.random() * 4)],
    timezone: timezones[Math.floor(Math.random() * timezones.length)],
    webgl: generateWebGLFingerprint(),
    canvas: Math.random().toString(36).substring(7)
  };
  
  chrome.storage.local.set({ currentFingerprint: currentFingerprint });
  
  // Update headers using declarativeNetRequest
  updateHeaderRules();
}

function generateWebGLFingerprint() {
  const vendors = ['Intel Inc.', 'NVIDIA Corporation', 'AMD', 'Apple Inc.'];
  const renderers = [
    'Intel Iris OpenGL Engine',
    'ANGLE (NVIDIA GeForce GTX 1060)',
    'ANGLE (AMD Radeon HD 7900)',
    'Apple M1'
  ];
  
  return {
    vendor: vendors[Math.floor(Math.random() * vendors.length)],
    renderer: renderers[Math.floor(Math.random() * renderers.length)]
  };
}

// Update header modification rules
function updateHeaderRules() {
  if (!fingerprintEnabled || !currentFingerprint) return;
  
  const rules = [
    {
      id: 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          {
            header: 'user-agent',
            operation: 'set',
            value: currentFingerprint.userAgent
          },
          {
            header: 'accept-language',
            operation: 'set',
            value: currentFingerprint.language
          },
          {
            header: 'sec-ch-ua-platform',
            operation: 'set',
            value: `"${currentFingerprint.platform}"`
          }
        ]
      },
      condition: {
        urlFilter: '*',
        resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'other']
      }
    }
  ];
  
  // Remove old rules and add new ones
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const existingRuleIds = existingRules.map(rule => rule.id);
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: rules
    });
  });
}