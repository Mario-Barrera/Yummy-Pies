--Sequence for users table
CREATE SEQUENCE custom_user_id_seq
    START WITH 1
    INCREMENT BY 1;

-- Users table (registered accounts)
CREATE TABLE Users (
    user_id INT PRIMARY KEY DEFAULT nextval('custom_user_id_seq'),
    
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    
    address VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Products table
CREATE TABLE Products (
    product_id SERIAL PRIMARY KEY,

    name VARCHAR(50) NOT NULL,
    price DECIMAL(8,2) NOT NULL,
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),

    category VARCHAR(50),
    image_key VARCHAR(50),
    star_rating DECIMAL(2,1) DEFAULT 0 CHECK (star_rating >= 0 AND star_rating <= 5)
);


-- Orders table (registered users)
CREATE TABLE Orders (
    order_id SERIAL PRIMARY KEY,

    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(50) NOT NULL
    CHECK (status IN ('Pending','Confirmed','Preparing','Ready for Pickup',
                        'Out for Delivery','Completed','Cancelled','Refunded')
    ),

    total_amount DECIMAL(8,2) NOT NULL DEFAULT 0,

    fulfillment_method VARCHAR(20) NOT NULL
    CHECK (fulfillment_method IN ('Pickup','Delivery')),

    delivery_partner VARCHAR(50),
    delivery_reference VARCHAR(100),
    delivery_status VARCHAR(50)
    CHECK (delivery_status IN ('Picked up by driver','Out for delivery',
                                'Delivered','Cancelled','Not applicable')
    ),

    estimated_delivery TIMESTAMP
);


-- Order Items tables
CREATE TABLE Order_Items (
    order_item_id SERIAL PRIMARY KEY,

    order_id INT NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES Products(product_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(8,2) NOT NULL
);


-- Reviews table
CREATE TABLE Reviews (
    review_id SERIAL PRIMARY KEY,

    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Review Comments table
CREATE TABLE Review_Comments (
    comment_id SERIAL PRIMARY KEY,

    review_id INT NOT NULL REFERENCES Reviews(review_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    comment TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Cart tables (registered users)
CREATE TABLE Cart_Items (
    cart_item_id SERIAL PRIMARY KEY,

    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES Products(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10, 2) NOT NULL DEFAULT 0,
    
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);


-- Payments tables
CREATE TABLE Payments (
    payment_id SERIAL PRIMARY KEY,

    order_id INT NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(8,2) NOT NULL,

    status VARCHAR(50) NOT NULL
    CHECK (status IN ('Pending','Completed','Cancelled','Failed','Refunded')),

    method VARCHAR(20) NOT NULL
    CHECK (method IN ('Credit','Debit')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS tokenBlacklist (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
