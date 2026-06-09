import express from 'express';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import {
  registerPushToken,
  deactivatePushToken,
  sendNotificationToAll,
  getNotificationHistory,
  getTokenStats
} from '../controllers/notification.controller.js';

const router = express.Router();

// ==========================================

// Called automatically when the app starts
router.post('/register', registerPushToken);

// Called if user turns off notifications in app settings
router.post('/deactivate', deactivatePushToken);

// ==========================================
// 💻 ADMIN DASHBOARD ROUTES (Auth Required)
// ==========================================
// Broadcast a notification to all devices
router.post('/send-all', protectRoute, adminRoute, sendNotificationToAll);

// View stats and history of sent notifications
router.get('/history', protectRoute, adminRoute, getNotificationHistory);
router.get('/stats', protectRoute, adminRoute, getTokenStats);

export default router;