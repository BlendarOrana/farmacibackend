import { promisePool } from "../lib/db.js";
import { processAndUpload, deleteFromS3, getUrl } from "../lib/s3.js";
import { v4 as uuidv4 } from "uuid";
// uuid v9+ still supports this named import — no change needed

// ─── CATEGORIES ───────────────────────────────────────────────

export const getCategories = async (req, res) => {
  const { rows } = await promisePool.query("SELECT * FROM categories ORDER BY name");
  res.json(rows);
};

export const createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const { rows } = await promisePool.query(
    "INSERT INTO categories (name) VALUES ($1) RETURNING *",
    [name]
  );
  res.status(201).json(rows[0]);
};

export const deleteCategory = async (req, res) => {
  await promisePool.query("DELETE FROM categories WHERE id = $1", [req.params.id]);
  res.json({ message: "Category deleted" });
};

// ─── PRODUCTS ─────────────────────────────────────────────────

export const getProducts = async (req, res) => {
  const { rows } = await promisePool.query(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `);
  res.json(rows);
};

export const getProduct = async (req, res) => {
  const { rows } = await promisePool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Product not found" });
  res.json(rows[0]);
};

export const createProduct = async (req, res) => {
  const { name, description, price, quantity, category_id } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Name and price are required" });

  let image_url = null;

  if (req.file) {
    const key = `products/${uuidv4()}.webp`;
    const result = await processAndUpload(req.file.buffer, key, { maxWidth: 800, maxHeight: 800, quality: 85 });
    image_url = result.url;
  }

  const { rows } = await promisePool.query(
    `INSERT INTO products (name, description, price, quantity, category_id, image_url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, description || null, price, quantity || 0, category_id || null, image_url]
  );
  res.status(201).json(rows[0]);
};

export const updateProduct = async (req, res) => {
  const { name, description, price, quantity, category_id } = req.body;
  const { id } = req.params;

  const existing = await promisePool.query("SELECT * FROM products WHERE id = $1", [id]);
  if (!existing.rows.length) return res.status(404).json({ error: "Product not found" });

  let image_url = existing.rows[0].image_url;

  if (req.file) {
    // Delete old image from S3 if exists
    if (image_url) {
      const oldKey = image_url.split(".com/")[1];
      if (oldKey) await deleteFromS3(oldKey);
    }
    const key = `products/${uuidv4()}.webp`;
    const result = await processAndUpload(req.file.buffer, key, { maxWidth: 800, maxHeight: 800, quality: 85 });
    image_url = result.url;
  }

  const { rows } = await promisePool.query(
    `UPDATE products SET name=$1, description=$2, price=$3, quantity=$4, category_id=$5, image_url=$6
     WHERE id=$7 RETURNING *`,
    [
      name ?? existing.rows[0].name,
      description ?? existing.rows[0].description,
      price ?? existing.rows[0].price,
      quantity ?? existing.rows[0].quantity,
      category_id ?? existing.rows[0].category_id,
      image_url,
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

// ─── ORDERS ───────────────────────────────────────────────────

export const getOrders = async (req, res) => {
  const { status, payment_status, payment_type } = req.query;

  let query = `
    SELECT o.*, json_agg(
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
    WHERE 1=1
  `;
  const params = [];

  // Add filters dynamically
  if (status) {
    params.push(status);
    query += ` AND o.order_status = $${params.length}`;
  }
  if (payment_status) {
    params.push(payment_status);
    query += ` AND o.payment_status = $${params.length}`;
  }
  if (payment_type) {
    params.push(payment_type);
    query += ` AND o.payment_type = $${params.length}`;
  }

  query += " GROUP BY o.id ORDER BY o.created_at DESC";

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
      `SELECT o.*, json_agg(
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
      WHERE o.id = $1
      GROUP BY o.id`,
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
  const { rows } = await promisePool.query(
    `UPDATE orders SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: "Order not found" });
  res.json(rows[0]);
};

// ─── DASHBOARD STATS ──────────────────────────────────────────

export const getDashboardStats = async (req, res) => {
  const [orders, revenue, products, pendingOrders] = await Promise.all([
    promisePool.query("SELECT COUNT(*) FROM orders"),
    promisePool.query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE payment_status = 'PAID'"),
    promisePool.query("SELECT COUNT(*) FROM products"),
    promisePool.query("SELECT COUNT(*) FROM orders WHERE order_status = 'NEW'"),
  ]);

  res.json({
    total_orders: parseInt(orders.rows[0].count),
    total_revenue: parseFloat(revenue.rows[0].total),
    total_products: parseInt(products.rows[0].count),
    pending_orders: parseInt(pendingOrders.rows[0].count),
  });
};




// ─── BANNERS ───────────────────────────────────────────────────
export const getBanners = async (req, res) => {
  try {
    const { rows } = await promisePool.query(`
      SELECT b.*, p.name AS product_name 
      FROM banners b
      LEFT JOIN products p ON b.product_id = p.id
      ORDER BY b.sort_order ASC, b.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createBanner = async (req, res) => {
  try {
    const { product_id, sort_order, active } = req.body;
    
    if (!req.file) return res.status(400).json({ error: "Banner image is required" });

    const key = `banners/${uuidv4()}.webp`;
    const result = await processAndUpload(req.file.buffer, key, { 
      maxWidth: 1200, 
      maxHeight: 600, 
      quality: 90 
    });

    const { rows } = await promisePool.query(
      `INSERT INTO banners (product_id, image_url, sort_order, active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        product_id || null, 
        result.url, 
        sort_order || 0, 
        active === 'true' || active === true
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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
      `UPDATE banners SET product_id=$1, image_url=$2, sort_order=$3, active=$4
       WHERE id=$5 RETURNING *`,
      [
        product_id || existing.rows[0].product_id,
        image_url,
        sort_order ?? existing.rows[0].sort_order,
        active ?? existing.rows[0].active,
        id
      ]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Add this new function to your banner controllers
export const reorderBanners = async (req, res) => {
  const client = await promisePool.connect();
  try {
    const { orderedIds } = req.body; // Expects an array of IDs: [5, 2, 8]
    
    await client.query('BEGIN');
    
    // Update the sort_order for each banner based on its index in the array
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query(
        'UPDATE banners SET sort_order = $1 WHERE id = $2',
        [i, orderedIds[i]]
      );
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: "Banners reordered successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error reordering banners:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};