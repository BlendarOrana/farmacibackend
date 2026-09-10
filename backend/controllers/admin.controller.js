import { promisePool } from "../lib/db.js";
import { processAndUpload, deleteFromS3 } from "../lib/s3.js";
import { v4 as uuidv4 } from "uuid";

// ==========================================
// ─── ADMIN DASHBOARD STATS ────────────────
// ==========================================
export const getDashboardStats = async (req, res) => {
  try {
    const [orders, revenue, products, pendingOrders, users] = await Promise.all([
      promisePool.query("SELECT COUNT(*) FROM orders"),
      promisePool.query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE payment_status = 'PAID'"),
      promisePool.query("SELECT COUNT(*) FROM products"),
      promisePool.query("SELECT COUNT(*) FROM orders WHERE order_status = 'NEW'"),
      promisePool.query("SELECT COUNT(*) FROM users") // Added users count
    ]);

    res.json({
      total_orders: parseInt(orders.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].total),
      total_products: parseInt(products.rows[0].count),
      pending_orders: parseInt(pendingOrders.rows[0].count),
      total_users: parseInt(users.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// ─── APP USERS ────────────────────────────
// ==========================================
// ✅ NEW: Allows Admin to view all registered users and their order count
export const getUsers = async (req, res) => {
  try {
    const { rows } = await promisePool.query(`
      SELECT u.id, u.name, u.email, u.phone_number, u.created_at,
             COUNT(o.id) AS total_orders
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── BRANDS ───────────────────────────────
// ==========================================
export const getBrands = async (req, res) => {
  const { rows } = await promisePool.query("SELECT * FROM brands ORDER BY name");
  res.json(rows);
};

import { promisePool } from "../lib/db.js";
import { processAndUpload, deleteFromS3 } from "../lib/s3.js";
import { v4 as uuidv4 } from "uuid";

export const createBrand = async (req, res) => {
  // Multer puts text fields in req.body, and the file in req.file
  const { name } = req.body;
  const file = req.file; 

  if (!name) {
    return res.status(400).json({ error: "Brand name is required" });
  }

  try {
    let finalImageUrl = null;

    // 1. Process the File if one was uploaded
    if (file) {
      // Multer already gives us the raw binary Buffer! No Base64 decoding needed.
      const imageBuffer = file.buffer;

      // Generate a unique S3 key
      const s3Key = `brands/${uuidv4()}.webp`;

      // Pass the Buffer and Key to your S3 utility to compress and upload
      const uploadResult = await processAndUpload(imageBuffer, s3Key);

      // Grab the safe CloudFront URL returned by your utility
      finalImageUrl = uploadResult.url;
    }

    // 2. Insert into the database
    const { rows } = await promisePool.query(
      "INSERT INTO brands (name, image_url) VALUES ($1, $2) RETURNING *",
      [name, finalImageUrl]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error("Error creating brand:", err);
    
    // Postgres Duplicate Key Error Code
    if (err.code === "23505") {
      return res.status(400).json({ error: "This brand already exists." });
    }
    
    res.status(500).json({ error: "Failed to create brand", details: err.message });
  }
};


export const updateBrand = async (req, res) => {
  const { name, image_url } = req.body;
  try {
    const { rows } = await promisePool.query(
      "UPDATE brands SET name = $1, image_url = $2 WHERE id = $3 RETURNING *",
      [name, image_url || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Brand not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteBrand = async (req, res) => {
  await promisePool.query("DELETE FROM brands WHERE id = $1", [req.params.id]);
  res.json({ message: "Brand deleted" });
};

// ─── CATEGORIES ───────────────────────────
// ==========================================
export const getCategories = async (req, res) => {
  const { rows } = await promisePool.query("SELECT * FROM categories ORDER BY name");
  res.json(rows);
};

export const createCategory = async (req, res) => {
  const { name, image_url } = req.body; // <== Added image_url
  if (!name) return res.status(400).json({ error: "Name is required" });
  const { rows } = await promisePool.query(
    "INSERT INTO categories (name, image_url) VALUES ($1, $2) RETURNING *",
    [name, image_url || null] // <== Included into the insertion
  );
  res.status(201).json(rows[0]);
};

export const deleteCategory = async (req, res) => {
  await promisePool.query("DELETE FROM categories WHERE id = $1", [req.params.id]);
  res.json({ message: "Category deleted" });
};


// ==========================================
// ─── PRODUCTS ─────────────────────────────
// ==========================================
// ✅ UPDATED: Joining the `brands` table to return `brand_name` for frontend displays
export const getProducts = async (req, res) => {
  try {
    const result = await promisePool.query(`
      SELECT 
        p.*, 
        c.name AS category_name,
        b.name AS brand_name,
        pd.discount_type,
        pd.discount_value,
        pd.start_date AS discount_start_date,
        pd.end_date AS discount_end_date,
        ROUND(CAST(
          CASE 
            WHEN pd.id IS NOT NULL THEN 
              CASE 
                WHEN pd.discount_type = 'percentage' THEN p.price - (p.price * pd.discount_value / 100)
                WHEN pd.discount_type = 'fixed' THEN p.price - pd.discount_value
                ELSE p.price
              END
            ELSE NULL 
          END 
        AS NUMERIC), 2) AS active_discount_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_discounts pd 
        ON p.id = pd.product_id 
        AND pd.start_date <= CURRENT_TIMESTAMP 
        AND pd.end_date >= CURRENT_TIMESTAMP
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows || result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const result = await promisePool.query(`
      SELECT 
        p.*, 
        c.name AS category_name,
        b.name AS brand_name,
        pd.discount_type,
        pd.discount_value,
        pd.start_date AS discount_start_date,
        pd.end_date AS discount_end_date,
        ROUND(CAST(
          CASE 
            WHEN pd.id IS NOT NULL THEN 
              CASE 
                WHEN pd.discount_type = 'percentage' THEN p.price - (p.price * pd.discount_value / 100)
                WHEN pd.discount_type = 'fixed' THEN p.price - pd.discount_value
                ELSE p.price
              END
            ELSE NULL 
          END 
        AS NUMERIC), 2) AS active_discount_price
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_discounts pd 
        ON p.id = pd.product_id 
        AND pd.start_date <= CURRENT_TIMESTAMP 
        AND pd.end_date >= CURRENT_TIMESTAMP
      WHERE p.id = $1
    `, [req.params.id]); 
    
    const rows = result.rows || result[0];
    if (!rows.length) return res.status(404).json({ error: "Product not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProduct = async (req, res) => {
  const { name, description, price, quantity, category_id, brand_id, nutritional_info } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Name and price are required" });

  let parsedNutrition = null;
  if (nutritional_info) {
    try {
      parsedNutrition = typeof nutritional_info === 'string' ? JSON.parse(nutritional_info) : nutritional_info;
    } catch (e) {
      return res.status(400).json({ error: "Invalid nutritional_info format" });
    }
  }

  let image_url = null;
  if (req.file) {
    const key = `products/${uuidv4()}.webp`;
    const result = await processAndUpload(req.file.buffer, key, { maxWidth: 800, maxHeight: 800, quality: 85 });
    image_url = result.url;
  }

  // ✅ UPDATED: Insert brand_id
  const { rows } = await promisePool.query(
    `INSERT INTO products (name, description, price, quantity, category_id, brand_id, image_url, nutritional_info)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [name, description || null, price, quantity || 0, category_id || null, brand_id || null, image_url, parsedNutrition]
  );
  res.status(201).json(rows[0]);
};

export const updateProduct = async (req, res) => {
  const { name, description, price, quantity, category_id, brand_id, nutritional_info } = req.body;
  const { id } = req.params;

  const existing = await promisePool.query("SELECT * FROM products WHERE id = $1", [id]);
  if (!existing.rows.length) return res.status(404).json({ error: "Product not found" });

  let parsedNutrition = existing.rows[0].nutritional_info;
  if (nutritional_info !== undefined) {
    if (nutritional_info === 'null' || !nutritional_info) {
      parsedNutrition = null;
    } else {
      try {
        parsedNutrition = typeof nutritional_info === 'string' ? JSON.parse(nutritional_info) : nutritional_info;
      } catch (e) {
        return res.status(400).json({ error: "Invalid nutritional_info format" });
      }
    }
  }

  let image_url = existing.rows[0].image_url;
  if (req.file) {
    const key = `products/${uuidv4()}.webp`;
    const result = await processAndUpload(req.file.buffer, key, { maxWidth: 800, maxHeight: 800, quality: 85 });
    image_url = result.url;
  }

  // ✅ UPDATED: Update brand_id
  const { rows } = await promisePool.query(
    `UPDATE products SET name=$1, description=$2, price=$3, quantity=$4, category_id=$5, brand_id=$6, image_url=$7, nutritional_info=$8
     WHERE id=$9 RETURNING *`,
    [
      name ?? existing.rows[0].name,
      description ?? existing.rows[0].description,
      price ?? existing.rows[0].price,
      quantity ?? existing.rows[0].quantity,
      category_id ?? existing.rows[0].category_id,
      brand_id ?? existing.rows[0].brand_id,
      image_url, 
      parsedNutrition, 
      id,
    ]
  );
  res.json(rows[0]);
};

export const updateStock = async (req, res) => {
  const { quantity } = req.body;
  if (quantity == null) return res.status(400).json({ error: "Quantity is required" });
  const { rows } = await promisePool.query(
    "UPDATE products SET quantity=$1 WHERE id=$2 RETURNING id, name, quantity",
    [quantity, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Product not found" });
  res.json(rows[0]);
};

export const deleteProduct = async (req, res) => {
  const { rows } = await promisePool.query("SELECT image_url FROM products WHERE id = $1", [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: "Product not found" });

  if (rows[0].image_url) {
    const key = rows[0].image_url.split(".com/")[1];
    if (key) await deleteFromS3(key);
  }

  await promisePool.query("DELETE FROM products WHERE id = $1", [req.params.id]);
  res.json({ message: "Product deleted" });
};

// ==========================================
// ─── DISCOUNTS ────────────────────────────
// ==========================================
export const createBulkDiscount = async (req, res) => {
  const { product_ids, discount_type, discount_value, start_date, end_date } = req.body;
  if (!product_ids || !product_ids.length || !discount_type || !discount_value || !start_date || !end_date) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    await promisePool.query(`DELETE FROM product_discounts WHERE product_id = ANY($1)`, [product_ids]);
    const placeholders = product_ids.map((_, i) => {
      const base = i * 5;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    }).join(", ");
    const values = product_ids.flatMap(id => [id, discount_type, discount_value, start_date, end_date]);
    await promisePool.query(
      `INSERT INTO product_discounts (product_id, discount_type, discount_value, start_date, end_date) VALUES ${placeholders}`,
      values
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

export const removeBulkDiscount = async (req, res) => {
  const { product_ids } = req.body;
  if (!product_ids || !product_ids.length) return res.status(400).json({ error: "No products provided" });
  try {
    await promisePool.query(`DELETE FROM product_discounts WHERE product_id = ANY($1)`, [product_ids]);
    res.json({ success: true, message: "Discounts removed" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ==========================================
// ─── COUPONS ──────────────────────────────
// ==========================================
export const getCustomersForCoupons = async (req, res) => {
  try {
    const { rows } = await promisePool.query(`
      SELECT id, name, email, phone_number, created_at FROM users ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createCoupon = async (req, res) => {
  const { code, discount_type, discount_value, user_id, max_uses, product_ids } = req.body;
  if (!code || !discount_type || !discount_value) {
    return res.status(400).json({ error: "Code, type, and value are required" });
  }
  try {
    const { rows } = await promisePool.query(
      `INSERT INTO coupons (code, discount_type, discount_value, user_id, max_uses, product_ids)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [code.toUpperCase().trim(), discount_type, discount_value, user_id || null, max_uses || null, product_ids || []]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const { rows } = await promisePool.query(`SELECT * FROM coupons ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ─── BANNERS ──────────────────────────────
// ==========================================
export const getBanners = async (req, res) => {
  try {
    const { rows } = await promisePool.query(`
      SELECT b.*, p.name AS product_name FROM banners b
      LEFT JOIN products p ON b.product_id = p.id
      ORDER BY b.sort_order ASC, b.created_at DESC
    `);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: "Internal server error" }); }
};

export const createBanner = async (req, res) => {
  try {
    const { product_id, sort_order, active } = req.body;
    if (!req.file) return res.status(400).json({ error: "Banner image is required" });
    const key = `banners/${uuidv4()}.webp`;
    const result = await processAndUpload(req.file.buffer, key, { maxWidth: 1200, maxHeight: 600, quality: 90 });
    const { rows } = await promisePool.query(
      `INSERT INTO banners (product_id, image_url, sort_order, active) VALUES ($1, $2, $3, $4) RETURNING *`,
      [product_id || null, result.url, sort_order || 0, active === 'true' || active === true]
    );
    res.status(201).json(rows[0]);
  } catch (error) { res.status(500).json({ error: "Internal server error" }); }
};

export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, sort_order, active } = req.body;
    const existing = await promisePool.query("SELECT * FROM banners WHERE id = $1", [id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Banner not found" });

    let image_url = existing.rows[0].image_url;
    if (req.file) {
      if (image_url) {
        const oldKey = image_url.split(".com/")[1];
        if (oldKey) await deleteFromS3(oldKey);
      }
      const key = `banners/${uuidv4()}.webp`;
      const result = await processAndUpload(req.file.buffer, key, { maxWidth: 1200, maxHeight: 600, quality: 90 });
      image_url = result.url;
    }
    const { rows } = await promisePool.query(
      `UPDATE banners SET product_id=$1, image_url=$2, sort_order=$3, active=$4 WHERE id=$5 RETURNING *`,
      [product_id || existing.rows[0].product_id, image_url, sort_order ?? existing.rows[0].sort_order, active ?? existing.rows[0].active, id]
    );
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: "Internal server error" }); }
};

export const deleteBanner = async (req, res) => {
  try {
    const { rows } = await promisePool.query("SELECT image_url FROM banners WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Banner not found" });
    if (rows[0].image_url) {
      const key = rows[0].image_url.split(".com/")[1];
      if (key) await deleteFromS3(key);
    }
    await promisePool.query("DELETE FROM banners WHERE id = $1", [req.params.id]);
    res.json({ message: "Banner deleted" });
  } catch (error) { res.status(500).json({ error: "Internal server error" }); }
};

export const reorderBanners = async (req, res) => {
  const client = await promisePool.connect();
  try {
    const { orderedIds } = req.body;
    await client.query('BEGIN');
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query('UPDATE banners SET sort_order = $1 WHERE id = $2', [i, orderedIds[i]]);
    }
    await client.query('COMMIT');
    res.json({ success: true, message: "Banners reordered successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: "Internal server error" });
  } finally { client.release(); }
};

// ==========================================
// ─── ORDERS ───────────────────────────────
// ==========================================
export const getOrders = async (req, res) => {
  const { status, payment_status, payment_type, page = 1, limit = 20 } = req.query;

  let query = `
    SELECT o.*, 
           c.discount_type AS coupon_discount_type,
           c.discount_value AS coupon_discount_value,
           json_agg(
             json_build_object(
               'id', oi.id, 
               'product_id', oi.product_id, 
               'product_name', p.name, 
               'quantity', oi.quantity, 
               'price_at_purchase', oi.price_at_purchase
             )
           ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN coupons c ON o.applied_coupon = c.code
    WHERE 1=1
  `;
  const params = [];

  if (status) { params.push(status); query += ` AND o.order_status = $${params.length}`; }
  if (payment_status) { params.push(payment_status); query += ` AND o.payment_status = $${params.length}`; }
  if (payment_type) { params.push(payment_type); query += ` AND o.payment_type = $${params.length}`; }

  query += " GROUP BY o.id, c.discount_type, c.discount_value ORDER BY o.created_at DESC";

  const offset = (page - 1) * limit;
  params.push(limit);
  query += ` LIMIT $${params.length}`;
  params.push(offset);
  query += ` OFFSET $${params.length}`;

  try {
    const { rows } = await promisePool.query(query, params);
    res.json(rows);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const getOrder = async (req, res) => {
  try {
    const { rows } = await promisePool.query(
      `SELECT o.*, 
              c.discount_type AS coupon_discount_type,
              c.discount_value AS coupon_discount_value,
              json_agg(
                json_build_object(
                  'id', oi.id, 
                  'product_id', oi.product_id, 
                  'product_name', p.name, 
                  'quantity', oi.quantity, 
                  'price_at_purchase', oi.price_at_purchase
                )
              ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN coupons c ON o.applied_coupon = c.code
      WHERE o.id = $1 
      GROUP BY o.id, c.discount_type, c.discount_value`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Order not found" });
    res.json(rows[0]);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const updateOrderStatus = async (req, res) => {
  const { order_status, payment_status } = req.body;
  const { id } = req.params;
  const fields = [];
  const values = [];

  if (order_status) { fields.push(`order_status = $${fields.length + 1}`); values.push(order_status); }
  if (payment_status) { fields.push(`payment_status = $${fields.length + 1}`); values.push(payment_status); }

  if (!fields.length) return res.status(400).json({ error: "Nothing to update" });

  values.push(id);
  const { rows } = await promisePool.query(`UPDATE orders SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
  if (!rows.length) return res.status(404).json({ error: "Order not found" });
  res.json(rows[0]);
};


// ==========================================
// ─── ADMIN STATS: TOP CUSTOMERS ───────────
// ==========================================
export const getTopCustomers = async (req, res) => {
  try {
    const { rows } = await promisePool.query(`
      SELECT 
        u.id AS user_id, 
        u.name, 
        u.email, 
        u.phone_number,
        COUNT(o.id) AS total_orders, 
        COALESCE(SUM(o.total_amount), 0) AS lifetime_spent,
        MAX(o.created_at) AS last_order_date
      FROM users u
      JOIN orders o ON u.id = o.user_id
      WHERE o.payment_status = 'PAID' -- Only count successful orders
      GROUP BY u.id
      ORDER BY lifetime_spent DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};