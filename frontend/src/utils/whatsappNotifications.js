// WhatsApp notification monitor
class WhatsAppNotificationMonitor {
  constructor(speakFunction) {
    this.speak = speakFunction;
    this.isMonitoring = false;
    this.observer = null;
  }

  async startMonitoring() {
    if (this.isMonitoring) return;
    
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
    
    this.isMonitoring = true;
    console.log('📱 Starting WhatsApp notification monitoring...');
    
    // Monitor browser notifications
    this.monitorBrowserNotifications();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('📱 Stopped WhatsApp notification monitoring');
  }

  monitorBrowserNotifications() {
    // Listen for notification events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'whatsapp-notification') {
          this.handleWhatsAppNotification(event.data.title, event.data.body);
        }
      });
    }

    // Override Notification for WhatsApp Web
    const originalNotification = window.Notification;
    const self = this;
    
    if (originalNotification) {
      window.Notification = function(title, options = {}) {
        // Check if it's a WhatsApp notification
        if (self.isWhatsAppNotification(title, options)) {
          self.handleWhatsAppNotification(title, options.body);
        }
        
        return new originalNotification(title, options);
      };
      
      // Copy static properties
      Object.setPrototypeOf(window.Notification, originalNotification);
      Object.defineProperty(window.Notification, 'permission', {
        get: () => originalNotification.permission
      });
      window.Notification.requestPermission = originalNotification.requestPermission.bind(originalNotification);
    }
  }

  isWhatsAppNotification(title, options) {
    const titleLower = (title || '').toLowerCase();
    const body = (options?.body || '').toLowerCase();
    const icon = options?.icon || '';
    
    return titleLower.includes('whatsapp') || 
           icon.includes('whatsapp') ||
           options?.tag?.includes('whatsapp') ||
           (title && title.includes(':') && !titleLower.includes('system'));
  }

  handleWhatsAppNotification(title, body) {
    if (!this.isMonitoring) return;
    
    console.log('📱 WhatsApp notification detected:', { title, body });
    
    const senderName = this.extractSenderName(title);
    const message = this.cleanMessage(body || 'New message received');
    
    // Speak the notification
    const announcement = `WhatsApp message from ${senderName}: ${message}`;
    this.speak(announcement, null, 'en-US');
  }

  extractSenderName(title) {
    if (!title) return 'Unknown contact';
    
    // Remove WhatsApp prefix
    let name = title.replace(/^WhatsApp\s*[-:]?\s*/i, '');
    
    // Extract name before colon or dash
    if (name.includes(':')) {
      name = name.split(':')[0];
    } else if (name.includes(' - ')) {
      name = name.split(' - ')[0];
    }
    
    return name.trim() || 'Unknown contact';
  }

  cleanMessage(message) {
    // Remove common notification prefixes and clean up
    return message
      .replace(/^New message:?\s*/i, '')
      .replace(/^\d+\s+new messages?:?\s*/i, '')
      .trim()
      .substring(0, 100); // Limit message length
  }
}

export default WhatsAppNotificationMonitor;