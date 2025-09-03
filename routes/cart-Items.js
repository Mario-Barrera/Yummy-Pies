const express = require('express');
const router = express.Router();
const client = require('../db/client');
const { requireAuth, requireAdmin } = require('../middleware/auth'); // use requireAuth for users

// User Routes
// GET all cart items for the logged-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await client.query(
      `SELECT ci.cart_item_id, ci.product_id, p.name, ci.quantity, p.price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cart items' });
  }
});

// POST add an item to cart
router.post('/', requireAuth, async (req, res) => {
  const { product_id, quantity } = req.body;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  try {
    const { rows } = await client.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.user_id, product_id, quantity]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT update quantity of a cart item
router.put('/:cartItemId', requireAuth, async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  try {
    const { rows } = await client.query(
      `UPDATE cart_items
       SET quantity=$1
       WHERE cart_item_id=$2 AND user_id=$3
       RETURNING *`,
      [quantity, cartItemId, req.user.user_id]
    );

    if (!rows.length) return res.status(403).json({ error: 'Access denied or item not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE a cart item
router.delete('/:cartItemId', requireAuth, async (req, res) => {
  const { cartItemId } = req.params;

  try {
    const { rows } = await client.query(
      `DELETE FROM cart_items
       WHERE cart_item_id=$1 AND user_id=$2
       RETURNING *`,
      [cartItemId, req.user.user_id]
    );

    if (!rows.length) return res.status(403).json({ error: 'Access denied or item not found' });

    res.json({ message: 'Cart item removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete cart item' });
  }
});

// Admin Routes
// GET all cart items for all users
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { rows } = await client.query(
      `SELECT ci.*, u.name AS user_name, u.email AS user_email, p.name AS product_name
       FROM cart_items ci
       JOIN users u ON ci.user_id = u.user_id
       JOIN products p ON ci.product_id = p.product_id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all cart items' });
  }
});

// PUT update any cart item (admin)
router.put('/admin/:cartItemId', requireAdmin, async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  try {
    const { rows } = await client.query(
      `UPDATE cart_items
       SET quantity=$1
       WHERE cart_item_id=$2
       RETURNING *`,
      [quantity, cartItemId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Cart item not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE any cart item (admin)
router.delete('/admin/:cartItemId', requireAdmin, async (req, res) => {
  const { cartItemId } = req.params;

  try {
    const { rows } = await client.query(
      `DELETE FROM cart_items
       WHERE cart_item_id=$1
       RETURNING *`,
      [cartItemId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Cart item not found' });

    res.json({ message: 'Cart item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete cart item' });
  }
});

module.exports = router;



// new code, not sure if I am going to use it
const express = require('express');
const router = express.Router();
const db = require('../db'); // your database client/connection
const authenticateUser = require('../middleware/authenticateUser'); // your auth middleware

// Get all cart items for logged-in user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await db.query(
      `SELECT ci.cart_item_id, ci.product_id, p.name, p.price, ci.quantity, ci.price_at_purchase
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching cart items' });
  }
});

// Add or update cart item for logged-in user
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id, quantity, price_at_purchase } = req.body;

    // Check if item already exists in cart
    const existing = await db.query(
      `SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2`,
      [userId, product_id]
    );

    if (existing.rows.length > 0) {
      // Update quantity
      const newQuantity = existing.rows[0].quantity + quantity;
      await db.query(
        `UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3`,
        [newQuantity, userId, product_id]
      );
    } else {
      // Insert new cart item
      await db.query(
        `INSERT INTO cart_items (user_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)`,
        [userId, product_id, quantity, price_at_purchase]
      );
    }
    res.json({ message: 'Cart updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating cart' });
  }
});

// Remove cart item by cart_item_id for logged-in user
router.delete('/:cart_item_id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const cartItemId = req.params.cart_item_id;

    await db.query(
      `DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2`,
      [cartItemId, userId]
    );

    res.json({ message: 'Cart item removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error removing cart item' });
  }
});

module.exports = router;
