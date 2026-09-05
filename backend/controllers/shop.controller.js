import { promisePool } from "../lib/db.js";

// Duhen importuar pasi na nevojiten tek getUserFavorites
import { discountSelectLogic, discountJoinLogic } from "./product.controller.js";

// ─── BANNERS ─────────────────────────────────────────────────
export const getActiveBanners = async (req, res) => {
  try {
    const { rows } = await promisePool.query(`
      SELECT b.*, p.name AS product_name, p.price 
      FROM banners b
      LEFT JOIN products p ON b.product_id = p.id
      WHERE b.active = true
      ORDER BY b.sort_order ASC, b.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching active banners:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// ─── COUPONS ─────────────────────────────────────────────
export const getUserCoupons = async (req, res) => {
  try {
    const { rows } = await promisePool.query(
      `SELECT * FROM coupons WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markCouponAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await promisePool.query(`UPDATE coupons SET "read" = true WHERE id = $1 AND user_id = $2`, [id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const validateCoupon = async (req, res) => {
  const { code, cart_items } = req.body;
  if (!code || !cart_items || !cart_items.length) return res.status(400).json({ error: "Missing required data" });

  try {
    const { rows } = await promisePool.query("SELECT * FROM coupons WHERE code = $1", [code.toUpperCase().trim()]);
    if (!rows.length) return res.status(404).json({ error: "Kuponi nuk ekziston." });

    const coupon = rows[0];

    if (coupon.user_id && coupon.user_id !== req.user.id) {
        return res.status(403).json({ error: "Ky kupon nuk vlen për llogarinë tuaj." });
    }
    if (!coupon.is_active) return res.status(400).json({ error: "Ky kupon nuk është aktiv." });
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return res.status(400).json({ error: "Ky kupon është përdorur në maksimum." });

    let eligible_amount = 0;
    for (const item of cart_items) {
      const prodRes = await promisePool.query("SELECT price FROM products WHERE id = $1", [item.product_id]);
      if (prodRes.rows.length) {
        const prod = prodRes.rows[0];
        const itemTotal = parseFloat(prod.price) * item.quantity;
        
        if (!coupon.product_ids || coupon.product_ids.length === 0 || coupon.product_ids.includes(item.product_id)) {
          eligible_amount += itemTotal;
        }
      }
    }

    if (eligible_amount === 0) return res.status(400).json({ error: "Kuponi nuk vlen për asnjë nga produktet." });

    let discount_amount = coupon.discount_type === 'percentage' 
      ? eligible_amount * (parseFloat(coupon.discount_value) / 100) 
      : Math.min(eligible_amount, parseFloat(coupon.discount_value));

    res.json({ valid: true, coupon, discount_amount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ─── ORDERS ───────────────────────────────────────────────
export const placeOrder = async (req, res) => {
  const { customer_name, customer_email, phone_number, address, city, payment_type, items, coupon_code } = req.body;

  if (!customer_name || !customer_email || !phone_number || !address || !city || !payment_type || !items?.length) {
    return res.status(400).json({ error: "Të gjitha fushat janë të detyrueshme" });
  }
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Përdoruesi nuk është i kyçur." });
  }

  const client = await promisePool.connect();
  try {
    await client.query("BEGIN");
    let total_amount = 0;
    let eligible_discount_amount = 0;
    const enrichedItems = [];
    let appliedCoupon = null;

    if (coupon_code) {
      const couponRes = await client.query("SELECT * FROM coupons WHERE code = $1 FOR UPDATE", [coupon_code.toUpperCase().trim()]);
      if (couponRes.rows.length) {
        const c = couponRes.rows[0];
        const belongsToUser = !c.user_id || c.user_id === req.user.id; 
        if (c.is_active && (!c.max_uses || c.used_count < c.max_uses) && belongsToUser) {
          appliedCoupon = c; 
        }
      }
    }

for (const item of items) {
      const { rows } = await client.query(`
        SELECT p.id, p.name, p.price, p.quantity, pd.discount_type, pd.discount_value
        FROM products p
        LEFT JOIN product_discounts pd ON p.id = pd.product_id AND NOW() >= pd.start_date AND NOW() <= pd.end_date
        WHERE p.id = $1 FOR UPDATE OF p
      `, [item.product_id]);
      const product = rows[0];
      if (!product || product.quantity < item.quantity) {
        throw new Error(`Nuk ka mjaftueshëm stok për "${product?.name || item.product_id}"`);
      }

      let activePrice = parseFloat(product.price);
      if (product.discount_value) {
        const dVal = parseFloat(product.discount_value);
        if (product.discount_type === 'percentage') activePrice = activePrice - (activePrice * (dVal / 100));
        else if (product.discount_type === 'fixed') activePrice = Math.max(0, activePrice - dVal);
      }

      const lineTotal = activePrice * item.quantity;
      total_amount += lineTotal;
      enrichedItems.push({ ...item, price_at_purchase: activePrice.toFixed(2) });

      if (appliedCoupon && (!appliedCoupon.product_ids || appliedCoupon.product_ids.length === 0 || appliedCoupon.product_ids.includes(item.product_id))) {
        eligible_discount_amount += lineTotal;
      }
    }

    if (appliedCoupon && eligible_discount_amount > 0) {
      let exactDiscount = appliedCoupon.discount_type === 'percentage' 
        ? eligible_discount_amount * (parseFloat(appliedCoupon.discount_value) / 100) 
        : Math.min(eligible_discount_amount, parseFloat(appliedCoupon.discount_value));
      total_amount = Math.max(0, total_amount - exactDiscount);
      await client.query("UPDATE coupons SET used_count = used_count + 1 WHERE id = $1", [appliedCoupon.id]);
    }

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, customer_name, customer_email, phone_number, address, city, total_amount, payment_type, payment_status, order_status, applied_coupon)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', 'NEW', $9) RETURNING *`,
      [req.user.id, customer_name, customer_email, phone_number, address, city, total_amount.toFixed(2), payment_type, appliedCoupon ? appliedCoupon.code : null]
    );

    for (const item of enrichedItems) {
      await client.query("INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)", [orderResult.rows[0].id, item.product_id, item.quantity, item.price_at_purchase]);
      await client.query("UPDATE products SET quantity = quantity - $1 WHERE id = $2", [item.quantity, item.product_id]);
    }

    await client.query("COMMIT");
    res.status(201).json({ order_id: orderResult.rows[0].id, total_amount: orderResult.rows[0].total_amount, payment_status: orderResult.rows[0].payment_status });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ [ORDER FAILED CRASH LOG]:", err); 
    res.status(400).json({ error: err.message || "Gabim gjatë procesimit të porosisë." });
  } finally {
    client.release();
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await promisePool.query(`
      SELECT o.id, o.total_amount, o.payment_type, o.payment_status, o.order_status, o.applied_coupon, o.created_at,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'product_id', oi.product_id, 'product_name', p.name, 'image_url', p.image_url, 'quantity', oi.quantity, 'price', oi.price_at_purchase
                )
              ) FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id
            ), '[]'::json
          ) AS items
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("[getMyOrders API Error]: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── FAVORITES ────────────────────────────────────────────
export const toggleFavorite = async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: "Duhet specifikiuar id e produktit" });

  try {
    const userId = req.user.id;
    const checkRes = await promisePool.query("SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2", [userId, product_id]);

    if (checkRes.rows.length > 0) {
      await promisePool.query("DELETE FROM favorites WHERE id = $1", [checkRes.rows[0].id]);
      res.json({ message: "Produkti u hoq nga të preferuarat", is_favorite: false });
    } else {
      await promisePool.query("INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)", [userId, product_id]);
      res.json({ message: "Produkti u shtua tek të preferuarat", is_favorite: true });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ error: "Ka ndodhur një gabim me të preferuarat" });
  }
};

export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT ${discountSelectLogic}, f.created_at as favorited_at
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${discountJoinLogic}
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `;
    
    const { rows } = await promisePool.query(query, [userId]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Gabim në leximin e të preferuarave." });
  }
};