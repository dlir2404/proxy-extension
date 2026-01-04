// Load status
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (response.enabled && response.config) {
    updateStatus(true);
    fillForm(response.config);
  }
  
  if (response.fingerprint) {
    displayFingerprint(response.fingerprint);
  }
  
  document.getElementById('fingerprintToggle').checked = response.fingerprintEnabled !== false;
});

// Proxy Enable
document.getElementById('enableBtn').addEventListener('click', () => {
  const config = {
    protocol: document.getElementById('protocol').value,
    host: document.getElementById('host').value.trim(),
    port: document.getElementById('port').value.trim(),
    username: document.getElementById('username').value.trim(),
    password: document.getElementById('password').value.trim()
  };
  
  if (!config.host || !config.port) {
    showMessage('Vui lòng nhập Host và Port!', 'error');
    return;
  }
  
  chrome.runtime.sendMessage({
    action: 'toggleProxy',
    enabled: true,
    config: config
  }, (response) => {
    if (response.success) {
      updateStatus(true);
      showMessage('✓ Proxy đã được BẬT!', 'success');
    }
  });
});

// Proxy Disable
document.getElementById('disableBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({
    action: 'toggleProxy',
    enabled: false,
    config: null
  }, (response) => {
    if (response.success) {
      updateStatus(false);
      showMessage('✓ Proxy đã được TẮT!', 'success');
    }
  });
});

// Fingerprint Toggle
document.getElementById('fingerprintToggle').addEventListener('change', (e) => {
  chrome.runtime.sendMessage({
    action: 'toggleFingerprint',
    enabled: e.target.checked
  }, (response) => {
    if (response.success) {
      showMessage(e.target.checked ? '✓ Fingerprint spoofing BẬT' : '✓ Fingerprint spoofing TẮT', 'success');
      if (response.fingerprint) {
        displayFingerprint(response.fingerprint);
      }
    }
  });
});

// Regenerate Fingerprint
document.getElementById('regenerateBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'regenerateFingerprint' }, (response) => {
    if (response.success && response.fingerprint) {
      displayFingerprint(response.fingerprint);
      showMessage('✓ Fingerprint mới đã được tạo!', 'success');
    }
  });
});

// Update status
function updateStatus(enabled) {
  const statusDiv = document.getElementById('status');
  if (enabled) {
    statusDiv.textContent = 'Proxy đang BẬT ✓';
    statusDiv.className = 'status enabled';
  } else {
    statusDiv.textContent = 'Proxy đang TẮT';
    statusDiv.className = 'status disabled';
  }
}

// Display fingerprint
function displayFingerprint(fp) {
  const infoDiv = document.getElementById('fingerprintInfo');
  infoDiv.innerHTML = `
    <div><strong>User-Agent:</strong> ${fp.userAgent.substring(0, 50)}...</div>
    <div><strong>Platform:</strong> ${fp.platform}</div>
    <div><strong>Language:</strong> ${fp.language}</div>
    <div><strong>Screen:</strong> ${fp.screenWidth}x${fp.screenHeight}</div>
    <div><strong>Cores:</strong> ${fp.hardwareConcurrency} | <strong>RAM:</strong> ${fp.deviceMemory}GB</div>
    <div><strong>Timezone:</strong> ${fp.timezone}</div>
    <div><strong>WebGL Vendor:</strong> ${fp.webgl.vendor}</div>
    <div><strong>WebGL Renderer:</strong> ${fp.webgl.renderer}</div>
  `;
}

// Show message
function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 3000);
}

// Fill form
function fillForm(config) {
  document.getElementById('protocol').value = config.protocol || 'http';
  document.getElementById('host').value = config.host || '';
  document.getElementById('port').value = config.port || '';
  document.getElementById('username').value = config.username || '';
  document.getElementById('password').value = config.password || '';
}