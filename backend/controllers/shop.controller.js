import { promisePool } from "../lib/db.js";




export const getPublicCategories = async (req, res) => {
  const { rows } = await promisePool.query("SELECT * FROM categories ORDER BY name");
  res.json(rows);
};

// publicControllers.js
const discountSelectLogic = `
  p.id, p.name, p.description, p.price AS original_price, p.quantity, p.image_url, p.nutritional_info,
  c.name AS category,
  pd.discount_type, 
  pd.discount_value, 
  pd.end_date AS discount_end,
  ROUND(
    CAST(
      CASE 
        WHEN pd.id IS NOT NULL THEN 
          CASE 
            WHEN pd.discount_type = 'percentage' THEN p.price - (p.price * pd.discount_value / 100)
            WHEN pd.discount_type = 'fixed' THEN p.price - pd.discount_value
            ELSE p.price
          END
        ELSE p.price 
      END 
    AS NUMERIC), 2
  ) AS current_price,
  CASE WHEN pd.id IS NOT NULL THEN true ELSE false END AS is_discounted
`;

const discountJoinLogic = `
  LEFT JOIN product_discounts pd 
    ON p.id = pd.product_id 
    AND pd.start_date <= CURRENT_TIMESTAMP 
    AND pd.end_date >= CURRENT_TIMESTAMP
`;

export const getPublicCategoryProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const query = `
      SELECT ${discountSelectLogic}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${discountJoinLogic}
      WHERE p.quantity > 0 AND p.category_id = $1
      ORDER BY p.created_at DESC LIMIT $2 OFFSET $3
    `;

    const { rows } = await promisePool.query(query, [id, limit, offset]);
    res.json(rows);
  } catch (error) { 
    console.error("Error in getPublicCategoryProducts:", error); 
    res.status(500).json({ error: "Failed to fetch category products" }); 
  }
};

export const getRelatedCategoryProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { exclude } = req.query; // ID of the current product to exclude
    const limit = 4; // Fetch exactly 4 products

    // Using your exact discount logic variables
    const query = `
      SELECT ${discountSelectLogic}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${discountJoinLogic}
      WHERE p.quantity > 0 
        AND p.category_id = $1 
        AND p.id != $2
      ORDER BY p.created_at DESC 
      LIMIT $3
    `;

    const { rows } = await promisePool.query(query, [categoryId, exclude, limit]);
    res.json(rows);
  } catch (error) { 
    console.error("Error in getRelatedCategoryProducts:", error); 
    res.status(500).json({ error: "Failed to fetch related products" }); 
  }
};

export const getPublicProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const query = `
      SELECT ${discountSelectLogic}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${discountJoinLogic}
      WHERE p.quantity > 0
      ORDER BY p.created_at DESC LIMIT $1 OFFSET $2
    `;

    const { rows } = await promisePool.query(query, [limit, offset]);
    res.json(rows);
  } catch (error) { 
    console.error("Error in getPublicProducts:", error); 
    res.status(500).json({ error: "Failed to fetch products" }); 
  }
};

export const getPublicProductDetail = async (req, res) => {
  try {
    const { rows } = await promisePool.query(`
      SELECT ${discountSelectLogic}
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ${discountJoinLogic}
      WHERE p.id = $1
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: "Product not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error in getPublicProductDetail:", error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
};

export const searchPublicProducts = async (req, res) => {
  try {
    const { q, category_id } = req.query;
    
    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    let query = `
      SELECT ${discountSelectLogic}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${discountJoinLogic}
      WHERE p.quantity > 0
    `;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }
    if (category_id) {
      params.push(category_id);
      query += ` AND p.category_id = $${params.length}`;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await promisePool.query(query, params);
    res.json(rows);
  } catch (error) { 
    console.error("Error in searchPublicProducts:", error);
    res.status(500).json({ error: "Failed to search products" }); 
  }
};




// Fetch user's personal coupons/gift cards by device token
export const getUserCoupons = async (req, res) => {
  const { device_token, phone_number } = req.query;
  
  // Require AT LEAST ONE of them
  if (!device_token && !phone_number) {
    return res.status(400).json({ error: "Device token or phone number is required" });
  }

  try {
    // 🚀 Fast SQL Query: Checks for device_token OR phone_number
    // We check "$1 != ''" to prevent accidentally matching empty strings/nulls
    const { rows } = await promisePool.query(
      `SELECT * FROM coupons 
       WHERE (target_device_token = $1 AND $1 != '') 
          OR (valid_for_phone = $2 AND $2 != '')
       ORDER BY created_at DESC`,
      [device_token || '', phone_number || '']
    );
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark coupon as read when user reveals it
// Backend Controller
export const markCouponAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    // 🚀 FIX: Wrapped "read" in quotes because it is an SQL reserved keyword!
    await promisePool.query(
      `UPDATE coupons SET "read" = true WHERE id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating coupon:", err.message);
    res.status(500).json({ error: err.message });
  }
};


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
// ─── PLACE ORDER ─────────────────────────────────────────────

// orderController.js ose shopController.js (vendi ku e ke këtë kod në backend)

// 1. VALIDATE COUPON
export const validateCoupon = async (req, res) => {
  // Switched customer_name to phone_number
  const { code, phone_number, cart_items } = req.body;
  if (!code || !cart_items || !cart_items.length) return res.status(400).json({ error: "Missing required data" });

  try {
    const { rows } = await promisePool.query("SELECT * FROM coupons WHERE code = $1", [code.toUpperCase().trim()]);
    if (!rows.length) return res.status(404).json({ error: "Kuponi nuk ekziston." });

    const coupon = rows[0];

    // 1. Basic Checks
    if (!coupon.is_active) return res.status(400).json({ error: "Ky kupon nuk është aktiv." });
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return res.status(400).json({ error: "Ky kupon është përdorur në maksimum." });
    
    // Check by Phone Number instead of Name
    if (coupon.valid_for_phone && phone_number && coupon.valid_for_phone.trim() !== phone_number.trim()) {
      return res.status(400).json({ error: "Ky kupon nuk vlen për numrin tuaj të telefonit." });
    }

    // 2. Calculate how much of the cart is ELIGIBLE for the discount
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

    if (eligible_amount === 0) return res.status(400).json({ error: "Kuponi nuk vlen për asnjë nga produktet në shportën tuaj." });

    // 3. Calculate exact discount money
    let discount_amount = 0;
    if (coupon.discount_type === 'percentage') discount_amount = eligible_amount * (parseFloat(coupon.discount_value) / 100);
    if (coupon.discount_type === 'fixed') discount_amount = Math.min(eligible_amount, parseFloat(coupon.discount_value));

    res.json({ valid: true, coupon, discount_amount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 2. PLACE ORDER
export const placeOrder = async (req, res) => {
  // Added device_token here
  const { customer_name, customer_email, phone_number, address, city, payment_type, items, coupon_code, device_token } = req.body;

  if (!customer_name || !customer_email || !phone_number || !address || !city || !payment_type || !items?.length) {
    return res.status(400).json({ error: "Të gjitha fushat dhe të paktën një produkt janë të detyrueshme" });
  }
  if (!["ON_DELIVERY", "CARD"].includes(payment_type)) return res.status(400).json({ error: "Mënyra e pagesës është e pavlefshme" });

  const client = await promisePool.connect();
  try {
    await client.query("BEGIN");

    let total_amount = 0;
    let eligible_discount_amount = 0;
    const enrichedItems = [];
    let appliedCoupon = null;

    // Securely check Coupon using PHONE NUMBER
    if (coupon_code) {
      const couponRes = await client.query("SELECT * FROM coupons WHERE code = $1 FOR UPDATE", [coupon_code.toUpperCase().trim()]);
      if (couponRes.rows.length) {
        const c = couponRes.rows[0];
        // Replaced valid_for_name with valid_for_phone
        if (c.is_active && (!c.max_uses || c.used_count < c.max_uses) && (!c.valid_for_phone || c.valid_for_phone.trim() === phone_number.trim())) {
          appliedCoupon = c; 
        }
      }
    }

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1) throw new Error(`Invalid item`);
      
      const { rows } = await client.query("SELECT id, name, price, quantity FROM products WHERE id = $1 FOR UPDATE", [item.product_id]);
      if (!rows.length) throw new Error(`Product ${item.product_id} not found`);
      
      const product = rows[0];
      if (product.quantity < item.quantity) throw new Error(`Nuk ka mjaftueshëm stok për "${product.name}"`);

      const lineTotal = parseFloat(product.price) * item.quantity;
      total_amount += lineTotal;
      enrichedItems.push({ ...item, price: product.price });

      if (appliedCoupon) {
        if (!appliedCoupon.product_ids || appliedCoupon.product_ids.length === 0 || appliedCoupon.product_ids.includes(item.product_id)) {
          eligible_discount_amount += lineTotal;
        }
      }
    }

    if (appliedCoupon && eligible_discount_amount > 0) {
      let exactDiscount = 0;
      if (appliedCoupon.discount_type === 'percentage') exactDiscount = eligible_discount_amount * (parseFloat(appliedCoupon.discount_value) / 100);
      if (appliedCoupon.discount_type === 'fixed') exactDiscount = Math.min(eligible_discount_amount, parseFloat(appliedCoupon.discount_value));
      
      total_amount = Math.max(0, total_amount - exactDiscount);
      await client.query("UPDATE coupons SET used_count = used_count + 1 WHERE id = $1", [appliedCoupon.id]);
    }

    // Insert order AND device_token
    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, customer_email, phone_number, address, city, total_amount, payment_type, payment_status, order_status, applied_coupon, device_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', 'NEW', $8, $9) RETURNING *`,
      [customer_name, customer_email, phone_number, address, city, total_amount.toFixed(2), payment_type, appliedCoupon ? appliedCoupon.code : null, device_token || null]
    );
    const order = orderResult.rows[0];

    for (const item of enrichedItems) {
      await client.query("INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)", [order.id, item.product_id, item.quantity, item.price]);
      await client.query("UPDATE products SET quantity = quantity - $1 WHERE id = $2", [item.quantity, item.product_id]);
    }

    await client.query("COMMIT");
    res.status(201).json({ order_id: order.id, total_amount: order.total_amount, payment_status: order.payment_status });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};


