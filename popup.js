// Load trạng thái hiện tại
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (response.enabled && response.config) {
    updateStatus(true);
    fillForm(response.config);
  }
});

// Nút Bật Proxy
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

// Nút Tắt Proxy
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

// Nút Xóa Form
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('protocol').value = 'http';
  document.getElementById('host').value = '';
  document.getElementById('port').value = '';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  showMessage('Form đã được xóa', 'success');
});

// Quick Load Proxy
document.querySelectorAll('.proxy-item').forEach(item => {
  item.addEventListener('click', () => {
    const proxyString = item.getAttribute('data-proxy');
    const parts = proxyString.split(':');
    
    if (parts.length === 4) {
      document.getElementById('protocol').value = 'http';
      document.getElementById('host').value = parts[0];
      document.getElementById('port').value = parts[1];
      document.getElementById('username').value = parts[2];
      document.getElementById('password').value = parts[3];
      showMessage('Proxy đã được load!', 'success');
    }
  });
});

// Hàm cập nhật trạng thái
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

// Hàm hiển thị thông báo
function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 3000);
}

// Hàm điền form
function fillForm(config) {
  document.getElementById('protocol').value = config.protocol || 'http';
  document.getElementById('host').value = config.host || '';
  document.getElementById('port').value = config.port || '';
  document.getElementById('username').value = config.username || '';
  document.getElementById('password').value = config.password || '';
}