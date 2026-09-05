import express from 'express';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import {
  registerPushToken,
  deactivatePushToken,
  sendNotificationToAll,
  getNotificationHistory,
  getTokenStats,
  getAppNotifications // <--- Import it!
} from '../controllers/notification.controller.js';

const router = express.Router();

// ==========================================
// 📱 MOBILE APP ROUTES (Public/Anonymous)
// ==========================================
router.post('/register', registerPushToken);
router.post('/deactivate', deactivatePushToken);
// The missing route allowing Mobile App to fetch history lists!
router.get('/app-history', getAppNotifications); 

// ==========================================
// 💻 ADMIN DASHBOARD ROUTES (Auth Required)
// ==========================================
router.post('/send-all', adminRoute, sendNotificationToAll);
router.get('/history', adminRoute, getNotificationHistory);
router.get('/stats',  adminRoute, getTokenStats);

export default router;