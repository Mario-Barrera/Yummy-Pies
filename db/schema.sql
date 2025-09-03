-- Users table (registered accounts)
-- 255 is standard for storing hashed passwords (like bcrypt hashes)
-- Make sure your backend logic clears expired tokens and validates expiration correctly
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (char_length(name) BETWEEN 4 AND 100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('customer', 'admin')) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_token VARCHAR(255),
    reset_expires TIMESTAMP
);

-- Products table
-- line code 26, will store average rating
-- storing might need updates when reviews change
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(8,2) NOT NULL,
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    category VARCHAR(50),
    image_key VARCHAR(255),
    star_rating DECIMAL(2,1) DEFAULT 0 CHECK (star_rating >= 0 AND star_rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
-- since there is statuses for Cancelled and Refunded, ensure your backend logic updates related fields properly
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL CHECK (
        status IN ('Pending','Confirmed','Preparing','Ready for Pickup','Out for Delivery','Completed','Cancelled','Refunded')
    ),
    total_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
    fulfillment_method VARCHAR(20) NOT NULL CHECK (fulfillment_method IN ('Pickup','Delivery')),
    delivery_partner VARCHAR(20) CHECK (delivery_partner IS NULL OR delivery_partner IN ('UberEats','DoorDash','Grubhub')),
    delivery_reference VARCHAR(100),
    delivery_status VARCHAR(50) CHECK (
        delivery_status IN ('Picked up by driver','Out for delivery','Delivered','Cancelled','Not applicable')
    ),
    estimated_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create index on user_id to speed up queries filtering by user
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Order items table
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(8,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index to speed up queries fetching all items in a specific order
-- Create index to improve performance when querying by product (e.g., sales stats or inventory tracking)
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);


-- Reviews table
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    UNIQUE (user_id, product_id) -- One review per user per product
);

-- Review comments table
CREATE TABLE review_comments (
    comment_id SERIAL PRIMARY KEY,
    review_id INT NOT NULL REFERENCES reviews(review_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    UNIQUE (user_id, review_id)  -- One review comment per user per product

);

-- To fetch all comments for a specific review
CREATE INDEX idx_review_comments_review_id ON review_comments(review_id);

-- To fetch all comments made by a specific user (e.g., user profile)
CREATE INDEX idx_review_comments_user_id ON review_comments(user_id);


-- Cart items table
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10,2) NOT NULL DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);


-- Payments table: stores payment details for each order
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(8,2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Pending','Completed','Cancelled','Failed','Refunded')),
    method VARCHAR(20) NOT NULL CHECK (method IN ('Credit','Debit')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token blacklist table: stores revoked JWT tokens to prevent reuse
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
