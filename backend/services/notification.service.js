import { Expo } from 'expo-server-sdk';
import { promisePool } from '../lib/db.js';

const expo = new Expo();

export const NotificationService = {
  // --------------------------------------------------------
  // 1. OLD METHODS 
  // --------------------------------------------------------
  async updateUserPushToken(userId, pushToken, platform = null) {
    try {
      if (!Expo.isExpoPushToken(pushToken)) throw new Error('Invalid Expo push token');
      await promisePool.query('UPDATE users SET push_token = $1, device_type = $2 WHERE id = $3', [pushToken, platform, userId]);
      return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
  },

  async removeUserPushToken(userId) {
    try {
      await promisePool.query('UPDATE users SET push_token = NULL, device_type = NULL WHERE id = $1', [userId]);
      return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
  },

  async sendPushNotification(userId, title, body, data = {}) {
    try {
      const result = await promisePool.query('SELECT push_token FROM users WHERE id = $1 AND push_token IS NOT NULL', [userId]);
      if (result.rows.length === 0 || !result.rows[0].push_token) return { success: false, message: 'No push token found' };

      const pushToken = result.rows[0].push_token;
      if (!Expo.isExpoPushToken(pushToken)) return { success: false, message: 'Invalid push token' };

      const message = { 
        to: pushToken, 
        sound: 'default', 
        title, 
        body, 
        data, 
        priority: 'high', 
        badge: 1 
      };

      // Ensure single-notification service also builds rich images correctly
      if (data.image_url) {
        message.image = data.image_url;
        message.mutableContent = true; 
      }

      await expo.sendPushNotificationsAsync([message]);
      return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
  },

  // --------------------------------------------------------
  // 2. BROADCAST METHOD (With iOS/Android native Image Fixes)
  // --------------------------------------------------------
  async sendToAllTokens(title, body, data = {}, batchSize = 50, delayMs = 1000) {
    try {
      // Fetch ONLY active anonymous push tokens
      const result = await promisePool.query('SELECT token FROM push_tokens WHERE active = true');
      
      if (result.rows.length === 0) {
        return { success: false, message: 'No active tokens found', totalUsers: 0, sentCount: 0, failedCount: 0 };
      }

      const tokens = result.rows.map(row => row.token);
      const batches = this.chunkArray(tokens, batchSize);
      
      let sentCount = 0;
      let failedCount = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const messages = [];
        
        for (const token of batch) {
          if (Expo.isExpoPushToken(token)) {
            const message = { 
              to: token, 
              sound: 'default', 
              title, 
              body, 
              data, // Keep data so user gets product routing on app-tap
              priority: 'high', 
              badge: 1 
            };

            // ✅ CRITICAL FIX: Extract image natively to the root object 
            // This is required to force Android and iOS Notification Centers to show rich media
            if (data.image_url) {
              message.image = data.image_url;      // Triggers Android large native image
              message.mutableContent = true;       // Triggers iOS extension handler
            }

            messages.push(message);
          } else {
            failedCount++;
          }
        }

        if (messages.length > 0) {
          try {
            await expo.sendPushNotificationsAsync(messages);
            sentCount += messages.length;
          } catch (error) {
            console.error("Batch send error:", error);
            failedCount += messages.length;
          }
        }

        // Delay between batches to respect Expo rate limits (default ~90 messages / sec rule)
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      return {
        success: sentCount > 0,
        message: `Sent to ${sentCount} devices, ${failedCount} failed`,
        totalUsers: tokens.length,
        sentCount,
        failedCount
      };
    } catch (error) { 
      return { success: false, error: error.message, totalUsers: 0, sentCount: 0, failedCount: 0 }; 
    }
  },

  // --------------------------------------------------------
  // 3. UTILITIES
  // --------------------------------------------------------
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
};

export default NotificationService;