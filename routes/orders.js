const express = require('express');
const pool = require('../db/client.js');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Authenticate any logged-in user
const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    console.log('Token received:', token);  // log the token
    if (!token) return res.status(401).json({ error: 'No token provided' });

    console.log('JWT_SECRET:', process.env.JWT_SECRET); // log secret to check it's loaded

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // log decoded payload
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(err);
  }
};

// Authenticate admin users
const authenticateAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Checkout: create an order from user's cart
router.post('/checkout', authenticateUser, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get user's cart items
    const { rows: cartItems } = await client.query(
      'SELECT * FROM Cart_Items WHERE user_id = $1',
      [req.user.user_id]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.quantity * (item.price_at_purchase || 0),
      0
    );

    // Insert order
    const { rows } = await client.query(
      `INSERT INTO Orders (user_id, status, total_amount, fulfillment_method)
       VALUES ($1, 'Pending', $2, $3) RETURNING order_id`,
      [req.user.user_id, totalAmount, req.body.fulfillment_method]
    );

    const orderId = rows[0].order_id;

    // Insert order items
    await Promise.all(
      cartItems.map(item =>
        client.query(
          `INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase)
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.product_id, item.quantity, item.price_at_purchase || 0]
        )
      )
    );

    // Clear user's cart
    await client.query('DELETE FROM Cart_Items WHERE user_id = $1', [req.user.user_id]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Order created', order_id: orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Get orders for logged-in user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM Orders WHERE user_id = $1 ORDER BY order_date DESC',
      [req.user.user_id]
    );
    console.log('Orders fetched:', rows);   // testing purposes
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: update order status
router.put('/:order_id/status', authenticateUser, authenticateAdmin, async (req, res) => {
  const { order_id } = req.params;
  const { status, delivery_status, delivery_partner } = req.body;

  try {
    const { rowCount } = await pool.query(
      `UPDATE Orders
       SET status = $1, delivery_status = $2, delivery_partner = $3
       WHERE order_id = $4`,
      [status, delivery_status, delivery_partner, order_id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Admin: get all orders (with optional filters)
router.get('/admin/all', authenticateUser, authenticateAdmin, async (req, res) => {
  const { user_id, status } = req.query;
  const filters = [];
  const values = [];

  if (user_id) { values.push(user_id); filters.push(`user_id = $${values.length}`); }
  if (status) { values.push(status); filters.push(`status = $${values.length}`); }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT * FROM Orders ${whereClause} ORDER BY order_date DESC`,
      values
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;
