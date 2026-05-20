import { promisePool } from '../lib/db.js';
import NotificationService from '../services/notification.service.js';

/**
 * Register or update a device push token from the Mobile App
 * No user account needed, completely anonymous!
 */
export const registerPushToken = async (req, res) => {
  try {
    const { push_token, platform } = req.body;

    if (!push_token) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    await promisePool.query(
      `INSERT INTO push_tokens (token, platform, active, last_seen_at)
       VALUES ($1, $2, true, NOW())
       ON CONFLICT (token) DO UPDATE 
       SET active = true, last_seen_at = NOW(), platform = $2`,
      [push_token, platform || null]
    );

    res.status(200).json({ message: 'Token registered successfully' });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Deactivate a token manually (if a user toggles off notifications in settings)
 */
export const deactivatePushToken = async (req, res) => {
  try {
    const { push_token } = req.body;

    if (!push_token) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    await promisePool.query(
      `UPDATE push_tokens SET active = false WHERE token = $1`,
      [push_token]
    );

    res.status(200).json({ message: 'Token deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating push token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Send a notification to all active tokens (Admin Only)
 * Can optionally link to a product_id or category_id
 */
export const sendNotificationToAll = async (req, res) => {
  try {
    const { 
      title, 
      body, 
      product_id, 
      category_id, 
      include_image, // Boolean sent from your Admin Dashboard toggle
      batchSize = 50, 
      delayMs = 1000 
    } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // 1. Prepare routing data for the mobile app
    const pushData = {};

    if (product_id) pushData.product_id = product_id;
    if (category_id) pushData.category_id = category_id;

    // 2. ONLY fetch and attach the image if the admin explicitly requested it AND a product is selected
    if (include_image === true && product_id) {
      const productRes = await promisePool.query(
        'SELECT image_url FROM products WHERE id = $1',
        [product_id]
      );
      
      if (productRes.rows.length > 0 && productRes.rows[0].image_url) {
        pushData.image_url = productRes.rows[0].image_url;
      }
    }

    // 3. Send push via Expo
    const result = await NotificationService.sendToAllTokens(
      title,
      body,
      pushData,
      batchSize,
      delayMs
    );

    // 4. Save exactly what we broadcasted to the DB for history
    await promisePool.query(
      `INSERT INTO notifications (title, body, product_id, total_sent, total_failed)
       VALUES ($1, $2, $3, $4, $5)`,
      [title, body, product_id || null, result.sentCount, result.failedCount]
    );

    res.status(200).json({
      message: result.message,
      stats: {
        totalTokens: result.totalUsers,
        sent: result.sentCount,
        failed: result.failedCount,
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


/**
 * Get notification history for Admin Dashboard
 */
export const getNotificationHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    const { rows } = await promisePool.query(
      `SELECT n.*, p.name AS product_name, p.image_url AS product_image
       FROM notifications n
       LEFT JOIN products p ON n.product_id = p.id
       ORDER BY n.sent_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

/**
 * Get token stats for Admin Dashboard
 */
export const getTokenStats = async (req, res) => {
  try {
    const { rows } = await promisePool.query(`
      SELECT
        COUNT(*) FILTER (WHERE active = true) AS active_tokens,
        COUNT(*) FILTER (WHERE active = false) AS inactive_tokens,
        COUNT(*) FILTER (WHERE platform = 'ios' AND active = true) AS ios_tokens,
        COUNT(*) FILTER (WHERE platform = 'android' AND active = true) AS android_tokens
      FROM push_tokens
    `);

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching token stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};





















