const express = require('express');
const router = express.Router();
const client = require('../db/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// User Routes
// GET all payments for logged-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await client.query(
      `SELECT p.payment_id, p.order_id, p.transaction_id, p.amount, p.status, p.method, p.created_at
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       WHERE o.user_id = $1`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST create a payment for an order
router.post('/', requireAuth, async (req, res) => {
  const { order_id, transaction_id, amount, method } = req.body;

  if (!order_id || !transaction_id || !amount || !method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Ensure the order belongs to the user
    const orderCheck = await client.query(
      'SELECT * FROM orders WHERE order_id=$1 AND user_id=$2',
      [order_id, req.user.user_id]
    );
    if (!orderCheck.rows.length) {
      return res.status(403).json({ error: 'Access denied or order not found' });
    }

    const { rows } = await client.query(
      `INSERT INTO payments (order_id, transaction_id, amount, status, method)
       VALUES ($1, $2, $3, 'Pending', $4)
       RETURNING *`,
      [order_id, transaction_id, amount, method]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Transaction ID must be unique' });
    }
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Admin Routes
// GET all payments
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { rows } = await client.query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email, o.status AS order_status
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       JOIN users u ON o.user_id = u.user_id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all payments' });
  }
});

// PUT update a payment status (admin)
router.put('/admin/:paymentId', requireAdmin, async (req, res) => {
  const { paymentId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['Pending', 'Completed', 'Cancelled', 'Failed', 'Refunded'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid payment status' });
  }

  try {
    const { rows } = await client.query(
      `UPDATE payments
       SET status=$1
       WHERE payment_id=$2
       RETURNING *`,
      [status, paymentId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Payment not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// DELETE a payment (admin)
router.delete('/admin/:paymentId', requireAdmin, async (req, res) => {
  const { paymentId } = req.params;

  try {
    const { rows } = await client.query(
      `DELETE FROM payments
       WHERE payment_id=$1
       RETURNING *`,
      [paymentId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Payment not found' });

    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

module.exports = router;