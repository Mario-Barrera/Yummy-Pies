// routes/orders.js
const express = require('express');
const client = require('../db/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all orders (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { rows } = await client.query(`
      SELECT o.*, u.name AS customer_name, u.email AS customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      ORDER BY o.order_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET orders for the logged-in user
router.get('/my', requireAuth, async (req, res) => {
  try {
    const { rows } = await client.query(
      'SELECT * FROM orders WHERE user_id=$1 ORDER BY order_id',
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your orders' });
  }
});

// GET single order by ID (admin or owner)
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await client.query('SELECT * FROM orders WHERE order_id=$1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = rows[0];
    if (req.user.role !== 'admin' && order.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST create a new order
router.post('/', requireAuth, async (req, res) => {
  const { items, fulfillment_method, delivery_partner } = req.body; 
  // items = [{ product_id, quantity, price_at_purchase }]

  try {
    // Insert into orders table
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (user_id, status, fulfillment_method, delivery_partner, total_amount)
       VALUES ($1, 'Pending', $2, $3, $4) RETURNING *`,
      [req.user.user_id, fulfillment_method, delivery_partner || null, 0] // total_amount updated later
    );
    const order = orderRows[0];

    // Insert into order_items table
    let totalAmount = 0;
    for (const item of items) {
      const { product_id, quantity, price_at_purchase } = item;
      totalAmount += price_at_purchase * quantity;

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [order.order_id, product_id, quantity, price_at_purchase]
      );
    }

    // Update order total_amount
    const { rows: updatedRows } = await client.query(
      'UPDATE orders SET total_amount=$1 WHERE order_id=$2 RETURNING *',
      [totalAmount, order.order_id]
    );

    res.status(201).json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT update order status (admin only)
router.put('/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, delivery_status } = req.body;

  try {
    const { rowCount, rows } = await client.query(
      'UPDATE orders SET status=$1, delivery_status=$2 WHERE order_id=$3 RETURNING *',
      [status, delivery_status || null, id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;
