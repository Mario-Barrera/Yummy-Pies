const express = require('express');
const client = require('../db/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all items for a specific order
router.get('/order/:order_id', requireAuth, async (req, res) => {
  const { order_id } = req.params;
  try {
    const orderCheck = await client.query('SELECT user_id FROM orders WHERE order_id=$1', [order_id]);
    if (!orderCheck.rows[0]) return res.status(404).json({ error: 'Order not found' });

    if (req.user.role !== 'admin' && orderCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await client.query('SELECT * FROM order_items WHERE order_id=$1', [order_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
});

// GET single order item by ID
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await client.query('SELECT * FROM order_items WHERE order_item_id=$1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order item not found' });

    const item = rows[0];
    if (req.user.role !== 'admin') {
      const orderCheck = await client.query('SELECT user_id FROM orders WHERE order_id=$1', [item.order_id]);
      if (orderCheck.rows[0].user_id !== req.user.user_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order item' });
  }
});

// GET all items for a specific order (admin only)
router.get('/order/:orderId/admin', requireAdmin, async (req, res) => {
  const { orderId } = req.params;
  try {
    const { rows } = await client.query(
      'SELECT * FROM order_items WHERE order_id=$1',
      [orderId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
});

// POST add an item to an order
router.post('/', requireAuth, async (req, res) => {
  const { order_id, product_id, quantity, price_at_purchase } = req.body;
  try {
    const orderCheck = await client.query('SELECT user_id FROM orders WHERE order_id=$1', [order_id]);
    if (!orderCheck.rows[0]) return res.status(404).json({ error: 'Order not found' });

    if (req.user.role !== 'admin' && orderCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [order_id, product_id, quantity, price_at_purchase]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add order item' });
  }
});

// PUT update an order item
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { quantity, price_at_purchase } = req.body;

  try {
    const { rows } = await client.query('SELECT * FROM order_items WHERE order_item_id=$1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order item not found' });

    const item = rows[0];
    if (req.user.role !== 'admin') {
      const orderCheck = await client.query('SELECT user_id FROM orders WHERE order_id=$1', [item.order_id]);
      if (orderCheck.rows[0].user_id !== req.user.user_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updated = await client.query(
      'UPDATE order_items SET quantity=$1, price_at_purchase=$2 WHERE order_item_id=$3 RETURNING *',
      [quantity || item.quantity, price_at_purchase || item.price_at_purchase, id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order item' });
  }
});

// DELETE an order item
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await client.query('SELECT * FROM order_items WHERE order_item_id=$1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order item not found' });

    const item = rows[0];
    if (req.user.role !== 'admin') {
      const orderCheck = await client.query('SELECT user_id FROM orders WHERE order_id=$1', [item.order_id]);
      if (orderCheck.rows[0].user_id !== req.user.user_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await client.query('DELETE FROM order_items WHERE order_item_id=$1', [id]);
    res.json({ message: 'Order item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete order item' });
  }
});

module.exports = router;
