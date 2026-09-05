import { promisePool } from "../lib/db.js";

export const discountSelectLogic = `
  p.id, p.name, p.description, p.price AS original_price, p.quantity, p.image_url, p.nutritional_info,
  c.name AS category, p.category_id, p.brand_id, p.created_at,
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

export const discountJoinLogic = `
  LEFT JOIN product_discounts pd 
    ON p.id = pd.product_id 
    AND pd.start_date <= CURRENT_TIMESTAMP 
    AND pd.end_date >= CURRENT_TIMESTAMP
`;

export const getPublicCategories = async (req, res) => {
  try {
    const { rows } = await promisePool.query("SELECT * FROM categories ORDER BY name");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const getPublicBrands = async (req, res) => {
  try {
    const { rows } = await promisePool.query("SELECT * FROM brands ORDER BY name");
    res.json(rows);
  } catch (error) {
    console.error("Error in getPublicBrands:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
};

// db-controller.js
export const searchPublicProducts = async (req, res) => {
  try {
    const { q, category_id, brand_id, has_discount, min_price, max_price } = req.query;

    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    let cteQuery = `
      WITH ProductData AS (
        SELECT ${discountSelectLogic}, b.name as brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        ${discountJoinLogic}
        WHERE p.quantity > 0
      )
      SELECT * FROM ProductData WHERE 1=1
    `;
    
    const params = [];

    if (q && q.trim() !== '') {
      params.push(`%${q.trim()}%`);
      const pId = params.length; 
      
      // 🚀 FIKSUAR: E optimizuar! Tani kërkon vetëm emrin dhe description pa u përzier 
      // me brands apo categories me strings search të ngadaltë!
      cteQuery += ` AND (name ILIKE $${pId} OR description ILIKE $${pId})`;
    }

    if (category_id && category_id !== "null" && category_id !== "undefined") {
      params.push(category_id);
      cteQuery += ` AND category_id = $${params.length}`;
    }

    if (brand_id && brand_id !== "null" && brand_id !== "undefined") {
      params.push(brand_id);
      cteQuery += ` AND brand_id = $${params.length}`;
    }

    if (has_discount === 'true') {
      cteQuery += ` AND is_discounted = true`;
    }

    if (min_price !== undefined && min_price !== "null" && min_price !== "") {
      params.push(parseFloat(min_price));
      cteQuery += ` AND current_price >= $${params.length}`;
    }

    if (max_price !== undefined && max_price !== "null" && max_price !== "") {
      params.push(parseFloat(max_price));
      cteQuery += ` AND current_price <= $${params.length}`;
    }

    cteQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await promisePool.query(cteQuery, params);
    res.json(rows);
  } catch (error) {
    console.error("Error in searchPublicProducts:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
};


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
    const { exclude } = req.query;
    const limit = 4; 

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

export const getDiscountedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const query = `
      SELECT ${discountSelectLogic}, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${discountJoinLogic}
      WHERE p.quantity > 0 
        AND pd.id IS NOT NULL 
        AND pd.start_date <= CURRENT_TIMESTAMP 
        AND pd.end_date >= CURRENT_TIMESTAMP
      ORDER BY pd.end_date ASC 
      LIMIT $1 OFFSET $2
    `;

    const { rows } = await promisePool.query(query, [limit, offset]);
    res.json(rows);
  } catch (error) { 
    console.error("Error fetching discounts:", error);
    res.status(500).json({ error: "Failed to fetch discounted products" }); 
  }
};

export const getBrandProducts = async (req, res) => {
  try {
    const { brandId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const query = `
      SELECT ${discountSelectLogic}, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${discountJoinLogic}
      WHERE p.quantity > 0 AND p.brand_id = $1
      ORDER BY p.created_at DESC LIMIT $2 OFFSET $3
    `;

    const { rows } = await promisePool.query(query, [brandId, limit, offset]);
    res.json(rows);
  } catch (error) { 
    console.error("Error in getBrandProducts:", error); 
    res.status(500).json({ error: "Failed to fetch brand products" }); 
  }
};