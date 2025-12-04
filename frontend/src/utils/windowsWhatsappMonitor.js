// Windows WhatsApp app notification monitor
class WindowsWhatsAppMonitor {
  constructor(speakFunction) {
    this.speak = speakFunction;
    this.isMonitoring = false;
    this.notificationListener = null;
  }

  async startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('📱 Starting Windows WhatsApp monitoring...');
    
    // Method 1: Windows Toast Notifications
    await this.monitorWindowsNotifications();
    
    // Method 2: Windows Registry/Event monitoring (if available)
    this.monitorWindowsEvents();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.notificationListener) {
      this.notificationListener.disconnect();
    }
    console.log('📱 Stopped Windows WhatsApp monitoring');
  }

  async monitorWindowsNotifications() {
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }

    // Override Windows notification system
    const originalNotification = window.Notification;
    const self = this;
    
    if (originalNotification) {
      window.Notification = function(title, options = {}) {
        if (self.isWhatsAppNotification(title, options)) {
          self.handleWhatsAppNotification(title, options.body, options);
        }
        return new originalNotification(title, options);
      };
      
      Object.setPrototypeOf(window.Notification, originalNotification);
      Object.defineProperty(window.Notification, 'permission', {
        get: () => originalNotification.permission
      });
      window.Notification.requestPermission = originalNotification.requestPermission.bind(originalNotification);
    }

    // Listen for Windows Toast notifications via Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'windows-notification' && 
            this.isWhatsAppNotification(event.data.title, event.data)) {
          this.handleWhatsAppNotification(event.data.title, event.data.body, event.data);
        }
      });
    }
  }

  monitorWindowsEvents() {
    // Monitor Windows system events (requires elevated permissions)
    if (window.chrome && window.chrome.runtime) {
      // Chrome extension API for system notifications
      try {
        chrome.notifications.onClicked.addListener((notificationId) => {
          if (notificationId.includes('whatsapp')) {
            console.log('WhatsApp notification clicked:', notificationId);
          }
        });
      } catch (e) {
        console.log('Chrome notifications API not available');
      }
    }

    // Monitor focus events for WhatsApp window
    this.monitorWhatsAppWindow();
  }

  monitorWhatsAppWindow() {
    // Check if WhatsApp window is active
    let lastActiveWindow = null;
    
    const checkActiveWindow = () => {
      if (!this.isMonitoring) return;
      
      // Check document title for WhatsApp indicators
      if (document.title.includes('WhatsApp') || 
          document.title.match(/\(\d+\)/)) { // Unread count in title
        
        const unreadMatch = document.title.match(/\((\d+)\)/);
        if (unreadMatch && parseInt(unreadMatch[1]) > 0) {
          this.handleUnreadCount(parseInt(unreadMatch[1]));
        }
      }
    };

    // Check every 2 seconds
    setInterval(checkActiveWindow, 2000);
  }

  isWhatsAppNotification(title, options = {}) {
    if (!title) return false;
    
    const titleLower = title.toLowerCase();
    const body = (options.body || '').toLowerCase();
    const appId = options.tag || options.data?.appId || '';
    
    return titleLower.includes('whatsapp') ||
           appId.includes('whatsapp') ||
           appId.includes('5319275A.WhatsAppDesktop') || // Windows Store WhatsApp ID
           (title.includes(':') && !titleLower.includes('system') && !titleLower.includes('chrome'));
  }

  handleWhatsAppNotification(title, body, options = {}) {
    if (!this.isMonitoring) return;
    
    console.log('📱 Windows WhatsApp notification:', { title, body, options });
    
    const senderName = this.extractSenderName(title);
    const message = this.cleanMessage(body || 'New message');
    
    // Speak the notification
    const announcement = `WhatsApp message from ${senderName}: ${message}`;
    this.speak(announcement, null, 'en-US');
  }

  handleUnreadCount(count) {
    if (count > 0) {
      const message = count === 1 ? 
        'You have 1 unread WhatsApp message' : 
        `You have ${count} unread WhatsApp messages`;
      this.speak(message, null, 'en-US');
    }
  }

  extractSenderName(title) {
    if (!title) return 'Unknown contact';
    
    // Remove WhatsApp prefix
    let name = title.replace(/^WhatsApp\s*[-:]?\s*/i, '');
    
    // Extract name before colon
    if (name.includes(':')) {
      name = name.split(':')[0];
    }
    
    // Remove unread count indicators
    name = name.replace(/\(\d+\)/, '').trim();
    
    return name || 'Unknown contact';
  }

  cleanMessage(message) {
    if (!message) return 'New message';
    
    return message
      .replace(/^New message:?\s*/i, '')
      .replace(/^\d+\s+new messages?:?\s*/i, '')
      .trim()
      .substring(0, 100);
  }

  // Windows-specific: Check if WhatsApp Desktop is running
  async checkWhatsAppProcess() {
    try {
      // This would require a native module or Electron
      // For now, we'll use a workaround
      const processes = await this.getRunningProcesses();
      return processes.some(p => p.includes('WhatsApp') || p.includes('whatsapp'));
    } catch (e) {
      return false;
    }
  }

  async getRunningProcesses() {
    // This would require native access - placeholder
    return [];
  }
}

export default WindowsWhatsAppMonitor;