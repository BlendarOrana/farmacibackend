-- ============================================
-- 1. ADMIN USERS
-- ============================================
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,   
    password_hash VARCHAR(60) NOT NULL    
);

-- ============================================
-- 2. APP USERS
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(20) NOT NULL,
    phone_number VARCHAR(20),
     COLUMN address TEXT,
 COLUMN city VARCHAR(50);

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. BRANDS (New added recently)
-- ============================================
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    image_url TEXT
);

-- 4. CATEGORIES
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image_url TEXT
);

-- ============================================
-- 5. PRODUCTS (Updated to reference brand_id)
-- ============================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    brand_id INT REFERENCES brands(id) ON DELETE SET NULL, 
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nutritional_info JSONB              
);

-- ============================================
-- 6. BANNERS 
-- ============================================
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    label TEXT,
    badge TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. COUPONS 
-- ============================================
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,          
    discount_type VARCHAR(20) NOT NULL,
    discount_value NUMERIC NOT NULL,
    max_uses INT,
    used_count INT DEFAULT 0,
    product_ids INT[],                  
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT false
);

-- ============================================
-- 8. NOTIFICATIONS 
-- ============================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    brand_id INT REFERENCES brands(id) ON DELETE SET NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_sent INT DEFAULT 0,
    total_failed INT DEFAULT 0
);


-- ============================================
-- 9. ORDERS 
-- ============================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL, 
    customer_email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    transaction_id VARCHAR(255),
    order_status VARCHAR(50) DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_coupon VARCHAR(50)         
);

-- ============================================
-- 10. ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

-- ============================================
-- 11. PRODUCT DISCOUNTS  
-- ============================================
CREATE TABLE product_discounts (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    discount_type VARCHAR(20),
    discount_value NUMERIC(10, 2) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 12. PUSH TOKENS 
-- ============================================
CREATE TABLE push_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    platform VARCHAR(10),
    active BOOLEAN DEFAULT true,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 13. USER FAVORITES (NEW!)
-- ============================================
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure a user can only favorite a specific product once
    UNIQUE(user_id, product_id)
);

-- DUMMY DATA INJECTION
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@mystore.com', 'your_hashed_password_here');