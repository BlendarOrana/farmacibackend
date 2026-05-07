import { promisePool } from "../lib/db.js";

// ─── PUBLIC PRODUCT BROWSING ──────────────────────────────────

export const getPublicProducts = async (req, res) => {
  const { category_id } = req.query;

  let query = `
    SELECT p.id, p.name, p.description, p.price, p.quantity, p.image_url, c.name AS category
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.quantity > 0
  `;
  const params = [];

  if (category_id) {
    params.push(category_id);
    query += ` AND p.category_id = $${params.length}`;
  }

  query += " ORDER BY p.created_at DESC";
  const { rows } = await promisePool.query(query, params);
  res.json(rows);
};

export const getPublicProduct = async (req, res) => {
  const { rows } = await promisePool.query(
    `SELECT p.id, p.name, p.description, p.price, p.quantity, p.image_url, c.name AS category
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Product not found" });
  res.json(rows[0]);
};

export const getPublicCategories = async (req, res) => {
  const { rows } = await promisePool.query("SELECT * FROM categories ORDER BY name");
  res.json(rows);
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

export const placeOrder = async (req, res) => {
  const { customer_name, customer_email, phone_number, address, city, payment_type, items } = req.body;

  // Validate required fields
  if (!customer_name || !customer_email || !phone_number || !address || !city || !payment_type || !items?.length) {
    return res.status(400).json({ error: "Të gjitha fushat dhe të paktën një produkt janë të detyrueshme" });
  }

  // PRANON VETËM "ON_DELIVERY" OSE "CARD"
  if (!["ON_DELIVERY", "CARD"].includes(payment_type)) {
    return res.status(400).json({ error: "Mënyra e pagesës është e pavlefshme" });
  }

  const client = await promisePool.connect();
  try {
    await client.query("BEGIN");

    let total_amount = 0;
    const enrichedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1) {
        throw new Error(`Invalid item: product_id and quantity are required`);
      }

      const { rows } = await client.query(
        "SELECT id, name, price, quantity FROM products WHERE id = $1 FOR UPDATE",
        [item.product_id]
      );

      if (!rows.length) throw new Error(`Product ${item.product_id} not found`);
      const product = rows[0];

      if (product.quantity < item.quantity) {
        throw new Error(`Nuk ka mjaftueshëm stok për "${product.name}" (në dispozicion: ${product.quantity})`);
      }

      total_amount += parseFloat(product.price) * item.quantity;
      enrichedItems.push({ ...item, price: product.price });
    }

    // Krijo porosinë
    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, customer_email, phone_number, address, city, total_amount, payment_type, payment_status, order_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', 'NEW') RETURNING *`,
      [customer_name, customer_email, phone_number, address, city, total_amount.toFixed(2), payment_type]
    );
    const order = orderResult.rows[0];

    // Shto produktet e porosisë dhe zbrit stokun
    for (const item of enrichedItems) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)",
        [order.id, item.product_id, item.quantity, item.price]
      );
      await client.query(
        "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
        [item.quantity, item.product_id]
      );
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
export const getOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const { rows } = await promisePool.query(
      `SELECT 
        o.id, 
        o.order_status, 
        o.payment_status, 
        o.total_amount, 
        o.created_at,
        json_agg(json_build_object(
          'product_name', p.name,
          'quantity', oi.quantity,
          'price', oi.price_at_purchase
        )) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1 AND LOWER(o.customer_email) = LOWER($2)
       GROUP BY o.id, o.order_status, o.payment_status, o.total_amount, o.created_at`, // 👈 FIXED GROUP BY
      [id, email.trim()]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};