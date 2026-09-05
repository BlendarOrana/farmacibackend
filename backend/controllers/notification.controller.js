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




export const getAppNotifications = async (req, res) => {
  try {
    const { rows } = await promisePool.query(
      `SELECT n.id, n.title, n.body AS description, n.product_id, n.category_id, n.brand_id, 
              p.image_url AS product_image, c.image_url AS category_image, b.image_url AS brand_image 
       FROM notifications n
       LEFT JOIN products p ON n.product_id = p.id
       LEFT JOIN categories c ON n.category_id = c.id
       LEFT JOIN brands b ON n.brand_id = b.id
       ORDER BY n.sent_at DESC
       LIMIT 30`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching mobile app notifications:', error);
    res.status(500).json({ error: 'Failed to fetch app notifications' });
  }
};


// ---- ADMIN ENDPOINT TO SEND NOTIFICATIONS ---- //
export const sendNotificationToAll = async (req, res) => {
  try {
    const { 
      title, 
      body, 
      product_id, 
      category_id, 
      brand_id,
      include_image, // Boolean sent from your Admin Dashboard toggle
      batchSize = 50, 
      delayMs = 1000 
    } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // 1. Prepare routing data for the mobile app navigation (Deep Linking Context)
    const pushData = {};
    if (product_id) pushData.product_id = product_id;
    if (category_id) pushData.category_id = category_id;
    if (brand_id) pushData.brand_id = brand_id;

    // 2. Resolve target Image dynamically
    let targetImageUrl = null;

    if (include_image === true) {
      if (product_id) {
        const res = await promisePool.query('SELECT image_url FROM products WHERE id = $1', [product_id]);
        targetImageUrl = res.rows[0]?.image_url;
      } else if (category_id) {
        const res = await promisePool.query('SELECT image_url FROM categories WHERE id = $1', [category_id]);
        targetImageUrl = res.rows[0]?.image_url;
      } else if (brand_id) {
        const res = await promisePool.query('SELECT image_url FROM brands WHERE id = $1', [brand_id]);
        targetImageUrl = res.rows[0]?.image_url;
      }

      if (targetImageUrl) {
        // Optimize push payload size and convert to safe .jpg using wsrv.nl proxy
        const domainPathOnly = targetImageUrl.replace(/^https?:\/\//, '');
        pushData.image_url = `https://wsrv.nl/?url=${encodeURIComponent(domainPathOnly)}&output=jpg&w=500`;
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
      `INSERT INTO notifications (title, body, product_id, category_id, brand_id, total_sent, total_failed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        title, 
        body, 
        product_id || null, 
        category_id || null, 
        brand_id || null, 
        result.sentCount, 
        result.failedCount
      ]
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














