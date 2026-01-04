// Injected script - runs in page context to spoof JavaScript APIs
(function() {
  let fingerprint = null;
  
  // Listen for fingerprint data
  window.addEventListener('message', (event) => {
    if (event.data.type === 'FINGERPRINT_DATA') {
      fingerprint = event.data.fingerprint;
      applyFingerprint();
    }
  });
  
  function applyFingerprint() {
    if (!fingerprint) return;
    
    // Spoof Navigator
    try {
      Object.defineProperty(navigator, 'userAgent', {
        get: () => fingerprint.userAgent
      });
      
      Object.defineProperty(navigator, 'platform', {
        get: () => fingerprint.platform
      });
      
      Object.defineProperty(navigator, 'vendor', {
        get: () => fingerprint.vendor
      });
      
      Object.defineProperty(navigator, 'language', {
        get: () => fingerprint.language.split(',')[0]
      });
      
      Object.defineProperty(navigator, 'languages', {
        get: () => fingerprint.language.split(',').map(l => l.split(';')[0])
      });
      
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => fingerprint.hardwareConcurrency
      });
      
      if (navigator.deviceMemory !== undefined) {
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => fingerprint.deviceMemory
        });
      }
    } catch(e) {}
    
    // Spoof Screen
    try {
      Object.defineProperty(screen, 'width', {
        get: () => fingerprint.screenWidth
      });
      
      Object.defineProperty(screen, 'height', {
        get: () => fingerprint.screenHeight
      });
      
      Object.defineProperty(screen, 'availWidth', {
        get: () => fingerprint.screenWidth
      });
      
      Object.defineProperty(screen, 'availHeight', {
        get: () => fingerprint.screenHeight - 40
      });
      
      Object.defineProperty(screen, 'colorDepth', {
        get: () => fingerprint.colorDepth
      });
      
      Object.defineProperty(screen, 'pixelDepth', {
        get: () => fingerprint.colorDepth
      });
    } catch(e) {}
    
    // Spoof devicePixelRatio
    try {
      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => fingerprint.pixelRatio
      });
    } catch(e) {}
    
    // Spoof Timezone
    try {
      const originalDateTimeFormat = Intl.DateTimeFormat;
      Intl.DateTimeFormat = function(...args) {
        const instance = new originalDateTimeFormat(...args);
        const originalResolvedOptions = instance.resolvedOptions;
        instance.resolvedOptions = function() {
          const options = originalResolvedOptions.call(this);
          options.timeZone = fingerprint.timezone;
          return options;
        };
        return instance;
      };
      
      // Override Date methods
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = function() {
        // Calculate offset based on spoofed timezone
        const timezoneOffsets = {
          'America/New_York': 300,
          'America/Los_Angeles': 480,
          'Europe/London': 0,
          'Asia/Tokyo': -540,
          'Asia/Ho_Chi_Minh': -420
        };
        return timezoneOffsets[fingerprint.timezone] || originalGetTimezoneOffset.call(this);
      };
    } catch(e) {}
    
    // Spoof WebGL
    try {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(param) {
        if (param === 37445) {
          return fingerprint.webgl.vendor;
        }
        if (param === 37446) {
          return fingerprint.webgl.renderer;
        }
        return getParameter.call(this, param);
      };
      
      if (window.WebGL2RenderingContext) {
        const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(param) {
          if (param === 37445) {
            return fingerprint.webgl.vendor;
          }
          if (param === 37446) {
            return fingerprint.webgl.renderer;
          }
          return getParameter2.call(this, param);
        };
      }
    } catch(e) {}
    
    // Spoof Canvas Fingerprint
    try {
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
      
      const noise = () => Math.random() * 0.1 - 0.05;
      
      HTMLCanvasElement.prototype.toDataURL = function() {
        const context = this.getContext('2d');
        if (context) {
          const imageData = context.getImageData(0, 0, this.width, this.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = imageData.data[i] + noise();
            imageData.data[i + 1] = imageData.data[i + 1] + noise();
            imageData.data[i + 2] = imageData.data[i + 2] + noise();
          }
          context.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.apply(this, arguments);
      };
      
      CanvasRenderingContext2D.prototype.getImageData = function() {
        const imageData = originalGetImageData.apply(this, arguments);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] = imageData.data[i] + noise();
          imageData.data[i + 1] = imageData.data[i + 1] + noise();
          imageData.data[i + 2] = imageData.data[i + 2] + noise();
        }
        return imageData;
      };
    } catch(e) {}
    
    // Block WebRTC IP leak
    try {
      const originalRTCPeerConnection = window.RTCPeerConnection;
      window.RTCPeerConnection = function(...args) {
        const pc = new originalRTCPeerConnection(...args);
        
        const originalCreateOffer = pc.createOffer;
        pc.createOffer = function() {
          return originalCreateOffer.apply(this, arguments).then(offer => {
            // Remove real IP from SDP
            offer.sdp = offer.sdp.replace(/([0-9]{1,3}\.){3}[0-9]{1,3}/g, '0.0.0.0');
            return offer;
          });
        };
        
        return pc;
      };
    } catch(e) {}
    
    // Spoof Audio Context Fingerprint
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const originalCreateOscillator = AudioContext.prototype.createOscillator;
        AudioContext.prototype.createOscillator = function() {
          const oscillator = originalCreateOscillator.call(this);
          const originalStart = oscillator.start;
          oscillator.start = function(when) {
            // Add slight random variation
            return originalStart.call(this, when + Math.random() * 0.001);
          };
          return oscillator;
        };
      }
    } catch(e) {}
  }
})();