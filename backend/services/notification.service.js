import { Expo } from 'expo-server-sdk';
import { promisePool } from '../lib/db.js';

const expo = new Expo();

const NotificationService = {
  /**
   * Send a notification to all active tokens
   * Handles Expo batching and removes dead tokens (uninstalled apps)
   */
  async sendToAllTokens(title, body, data = {}, batchSize = 50, delayMs = 1000) {
    try {
      // 1. Fetch all active tokens
      const { rows } = await promisePool.query('SELECT token FROM push_tokens WHERE active = true');
      
      if (rows.length === 0) {
        return { 
          sentCount: 0, 
          failedCount: 0, 
          totalUsers: 0, 
          message: 'No active push tokens found.' 
        };
      }

      // Filter to ensure only valid Expo tokens are used
      const validTokens = rows.map(r => r.token).filter(t => Expo.isExpoPushToken(t));
      const invalidTokensCount = rows.length - validTokens.length;

      // 2. Prepare the messages
      const messages = [];
      for (let pushToken of validTokens) {
        messages.push({
          to: pushToken,
          sound: 'default',
          title,
          body,
          data, // e.g. { product_id: 12 }
          priority: 'high',
        });
      }

      // 3. Chunk the messages to obey Expo's rate limits
      const chunks = expo.chunkPushNotifications(messages);
      let sentCount = 0;
      let failedCount = invalidTokensCount;
      const tokensToDeactivate = [];

      // 4. Send the chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          
          // 5. Read tickets to catch uninstalled apps immediately
          ticketChunk.forEach((ticket, index) => {
            if (ticket.status === 'ok') {
              sentCount++;
            } else if (ticket.status === 'error') {
              failedCount++;
              if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                // User uninstalled the app or disabled notifications
                tokensToDeactivate.push(chunk[index].to);
              }
            }
          });
        } catch (error) {
          console.error('Error sending chunk:', error);
          failedCount += chunk.length;
        }

        // Add a slight delay between batches
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      // 6. Cleanup database: deactivate tokens of uninstalled apps
      if (tokensToDeactivate.length > 0) {
        await promisePool.query(
          'UPDATE push_tokens SET active = false WHERE token = ANY($1::text[])',
          [tokensToDeactivate]
        );
      }

      return {
        success: sentCount > 0,
        sentCount,
        failedCount,
        totalUsers: rows.length,
        message: `Sent to ${sentCount} devices. ${failedCount} failed.`
      };
    } catch (error) {
      console.error('Service error sending to all tokens:', error);
      throw error;
    }
  }
};

export default NotificationService;