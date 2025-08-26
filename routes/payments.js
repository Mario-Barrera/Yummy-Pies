const express = require('express');
const pool = require('../db/client');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// Create a new payment (linked to order)
router.post('/', authenticateToken, async (req, res) => {
  const { order_id, transaction_id, amount, method, status } = req.body;

  // Validation
  const validStatuses = ['Pending', 'Completed', 'Cancelled', 'Failed', 'Refunded'];
  const validMethods = ['Credit', 'Debit'];

  if (!order_id || !transaction_id || amount === undefined || !method || !status) {
    return res.status(400).json({ error: 'Missing required payment fields' });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid payment status' });
  }

  if (!validMethods.includes(method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  if (typeof amount !== 'number' || amount < 0) {
    return res.status(400).json({ error: 'Invalid payment amount' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO Payments (order_id, transaction_id, amount, method, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [order_id, transaction_id, amount, method, status]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get payment by payment_id
router.get('/:id', authenticateToken, async (req, res) => {
  const paymentId = req.params.id;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM Payments WHERE payment_id = $1`,
      [paymentId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Admin-only: Get all payments with optional filters
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { status, startDate, endDate, order_id } = req.query;

  let baseQuery = `SELECT * FROM Payments WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (status) {
    baseQuery += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  if (order_id) {
    baseQuery += ` AND order_id = $${paramIndex++}`;
    params.push(order_id);
  }
  if (startDate) {
    baseQuery += ` AND created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    baseQuery += ` AND created_at <= $${paramIndex++}`;
    params.push(endDate);
  }

  try {
    const { rows } = await pool.query(baseQuery, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Admin-only: Update payment status
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const paymentId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Completed', 'Cancelled', 'Failed', 'Refunded'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid or missing status' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE Payments SET status = $1 WHERE payment_id = $2 RETURNING *`,
      [status, paymentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating payment:', err);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Admin-only: Delete payment
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const paymentId = req.params.id;

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM Payments WHERE payment_id = $1`,
      [paymentId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    console.error('Error deleting payment:', err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

module.exports = router;
