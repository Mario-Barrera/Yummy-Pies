const express = require('express');
const pool = require('../db/client');
const jwt = require('jsonwebtoken');

const router = express.Router();


// Authenticate any logged-in user
const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(err);
  }
};


router.post('/', authenticateUser, async (req, res) => {
  const { product_id, quantity } = req.body;
  
  if (!product_id || !quantity || quantity <= 0) {
  return res.status(400).json({ error: 'Missing or invalid product_id or quantity' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch the current price of the product
    const { rows: productRows } = await client.query(
      `SELECT price FROM Products WHERE product_id = $1`,
      [product_id]
    );

    if (productRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentPrice = productRows[0].price;

    // Insert or update the cart item with price_at_purchase
    await client.query(
      `INSERT INTO Cart_Items (user_id, product_id, quantity, price_at_purchase)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET 
         quantity = Cart_Items.quantity + EXCLUDED.quantity,
         price_at_purchase = EXCLUDED.price_at_purchase`,
      [req.user.user_id, product_id, quantity, currentPrice]
    );

    // Fetch the updated full cart with product info
    const { rows } = await client.query(
      `SELECT ci.cart_item_id, ci.user_id, ci.product_id, ci.quantity, ci.added_at,
          p.name, ci.price_at_purchase
      FROM Cart_Items ci
      JOIN Products p ON ci.product_id = p.product_id
      WHERE ci.user_id = $1`,
  [req.user.user_id]
);


    await client.query('COMMIT');
    res.status(201).json(rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to add to cart' });
  } finally {
    client.release();
  }
});


// Get current user's cart
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ci.cart_item_id, ci.user_id, ci.product_id, ci.quantity, ci.added_at,
              p.name, ci.price_at_purchase
       FROM Cart_Items ci
       JOIN Products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

module.exports = router;
