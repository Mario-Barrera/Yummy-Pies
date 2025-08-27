const express = require('express');
const pool = require('../db/client');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// Middleware: authenticate admin user only
const authenticateAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /order-items/order/:order_id - get all items for a specific order
router.get('/order/:order_id', authenticateToken, async (req, res) => {
  const { order_id } = req.params;

  try {
    // Check if order exists and get its user_id
    const { rows: orderRows } = await pool.query(
      'SELECT user_id FROM Orders WHERE order_id = $1',
      [order_id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderUserId = orderRows[0].user_id;

    // Allow access only if admin or order owner
    if (req.user.role !== 'admin' && req.user.user_id !== orderUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(
      `SELECT oi.*, p.name AS product_name
       FROM Order_Items oi
       JOIN Products p ON oi.product_id = p.product_id
       WHERE oi.order_id = $1`,
      [order_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching order items:', err);
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
});

// POST /order-items - add a new item to an order (admin only)
router.post('/', authenticateToken, authenticateAdmin, async (req, res) => {
  const { order_id, product_id, quantity, price_at_purchase } = req.body;

  if (!order_id || !product_id || !quantity || price_at_purchase === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (quantity <= 0 || price_at_purchase < 0) {
    return res.status(400).json({ error: 'Invalid quantity or price' });
  }

  try {
    // Ensure order exists
    const { rows: orderRows } = await pool.query(
      'SELECT * FROM Orders WHERE order_id = $1',
      [order_id]
    );
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { rows } = await pool.query(
      `INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [order_id, product_id, quantity, price_at_purchase]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error adding order item:', err);
    res.status(500).json({ error: 'Failed to add order item' });
  }
});

// PUT /order-items/:id - update an order item (admin only)
router.put('/:id', authenticateToken, authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { quantity, price_at_purchase } = req.body;

  if ((quantity !== undefined && quantity <= 0) || (price_at_purchase !== undefined && price_at_purchase < 0)) {
    return res.status(400).json({ error: 'Invalid quantity or price' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE Order_Items
       SET quantity = COALESCE($1, quantity),
           price_at_purchase = COALESCE($2, price_at_purchase)
       WHERE order_item_id = $3
       RETURNING *`,
      [quantity, price_at_purchase, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Order item not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating order item:', err);
    res.status(500).json({ error: 'Failed to update order item' });
  }
});

// DELETE /order-items/:id - delete an order item (admin only)
router.delete('/:id', authenticateToken, authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM Order_Items WHERE order_item_id = $1',
      [id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Order item not found' });

    res.json({ message: 'Order item deleted successfully' });
  } catch (err) {
    console.error('Error deleting order item:', err);
    res.status(500).json({ error: 'Failed to delete order item' });
  }
});

module.exports = router;
