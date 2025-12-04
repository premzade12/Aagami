import express from 'express';
import windowsIntegration from '../services/windowsIntegration.js';
import isAuth from '../middlewares/isAuth.js';

const windowsRouter = express.Router();

// Check if WhatsApp is running
windowsRouter.get('/whatsapp/status', isAuth, async (req, res) => {
  try {
    const isRunning = await windowsIntegration.isWhatsAppRunning();
    const windowTitle = await windowsIntegration.getWhatsAppWindowTitle();
    
    res.json({
      isRunning,
      windowTitle,
      platform: process.platform
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent WhatsApp notifications
windowsRouter.get('/whatsapp/notifications', isAuth, async (req, res) => {
  try {
    const notifications = await windowsIntegration.getRecentNotifications();
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Focus WhatsApp window
windowsRouter.post('/whatsapp/focus', isAuth, async (req, res) => {
  try {
    const success = await windowsIntegration.focusWhatsApp();
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default windowsRouter;