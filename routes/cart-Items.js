const express = require('express');
const router = express.Router();
const pool = require('../db/client');
const logger = require('../utils/logger');
const { requireAuth, requireAdmin } = require('../middleware/auth');


// GET all cart items for the logged-in user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ci.cart_item_id, ci.product_id, p.name, ci.quantity, ci.price_at_purchase, p.image_key, ci.added_at
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1
       ORDER BY ci.added_at DESC`,
      [req.user.user_id]
    );
    res.status(200).json(rows);
  } catch (err) {
    logger.error(`Failed to fetch user cart items ${req.user.user_id}: ${err.message}`);
    err.message = 'Failed to fetch user cart items';
    next(err);
  }
});


// POST add an item to the cart
router.post('/', requireAuth, async (req, res, next) => {
  const { product_id, quantity } = req.body;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  try {
    // Check if product exists
    const productCheck = await pool.query(
      `SELECT price FROM products WHERE product_id = $1`,
      [product_id]
    );
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const productPrice = productCheck.rows[0].price;

    // Check if item already in cart
    const existing = await pool.query(
      `SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2`,
      [req.user.user_id, product_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Item already in cart' });
    }

    // Insert into cart
    const { rows } = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity, price_at_purchase)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.user_id, product_id, quantity, productPrice]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error(`Failed to add items to cart ${req.user.user_id}: ${err.message}`);
    err.message = 'failed to add item to cart';
    next(err);
  }
});


// PUT update quantity of a cart item
router.put('/:cartItemId', requireAuth, async (req, res, next) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE cart_items
       SET quantity = $1
       WHERE cart_item_id = $2 AND user_id = $3
       RETURNING *`,
      [quantity, cartItemId, req.user.user_id]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'Access denied or item not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    logger.error(`Failed to update user cart items ${req.user.user_id}: ${err.message}`);
    err.message = 'Failed to update cart item';
    next(err);
  }
});


// DELETE a cart item
router.delete('/:cartItemId', requireAuth, async (req, res, next) => {
  const { cartItemId } = req.params;

  try {
    const { rows } = await pool.query(
      `DELETE FROM cart_items
       WHERE cart_item_id = $1 AND user_id = $2
       RETURNING *`,
      [cartItemId, req.user.user_id]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'Access denied or item not found' });
    }

    res.status(200).json({ message: 'Cart item removed successfully' });
  } catch (err) {
    logger.error(`Failed to delete cart items ${req.user.user_id}: ${err.message}`);
    err.message = 'Failed to delete cart items';
    next(err);
  }
});

// ------ Merge client-side cart items with server cart for logged-in user ------//
router.post('/merge', requireAuth, async (req, res, next) => {
  const userId = req.user.user_id;
  const items = req.body.items; // expecting [{ product_id, quantity }, ...]

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid items format' });
  }

  try {
    // For each item, upsert into cart_items
    for (const item of items) {
      const { product_id, quantity } = item;

      if (!Number.isInteger(quantity) || quantity <= 0) {
        continue; // skip invalid quantities
      }

      // Check if product exists and get price
      const productResult = await pool.query(
        `SELECT price FROM products WHERE product_id = $1`,
        [product_id]
      );
      if (productResult.rows.length === 0) {
        continue; // skip invalid product_id
      }
      const price_at_purchase = productResult.rows[0].price;

      // Check if cart item exists
      const existingResult = await pool.query(
        `SELECT cart_item_id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2`,
        [userId, product_id]
      );

      if (existingResult.rows.length > 0) {
        // Update quantity by adding
        const newQuantity = existingResult.rows[0].quantity + quantity;
        await pool.query(
          `UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2`,
          [newQuantity, existingResult.rows[0].cart_item_id]
        );
      } else {
        // Insert new cart item
        await pool.query(
          `INSERT INTO cart_items (user_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)`,
          [userId, product_id, quantity, price_at_purchase]
        );
      }
    }

    // Return merged cart
    const { rows } = await pool.query(
      `SELECT ci.cart_item_id, ci.product_id, p.name, ci.quantity, ci.price_at_purchase, p.image_key, ci.added_at
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1
       ORDER BY ci.added_at DESC`,
      [userId]
    );

    res.status(200).json(rows);
  } catch (err) {
    logger.error(`Failed to merge cart items for user ${userId}: ${err.message}`);
    next(err);
  }
});


// ------ ADMIN ROUTES ------ //

// GET all cart items for all users (with pagination)
router.get('/admin', requireAdmin, async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { rows } = await pool.query(
      `SELECT ci.*, u.name AS user_name, u.email AS user_email, p.name AS product_name
       FROM cart_items ci
       JOIN users u ON ci.user_id = u.user_id
       JOIN products p ON ci.product_id = p.product_id
       ORDER BY ci.cart_item_id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.status(200).json(rows);
  } catch (err) {
    logger.error(`Failed to fetch all cart items ${req.user.user_id}: ${err.message}`);
    err.message = 'Failed to fetch all cart items';
    next(err);
  }
});

// PUT update any cart item (admin)
router.put('/admin/:cartItemId', requireAdmin, async (req, res, next) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE cart_items
       SET quantity = $1
       WHERE cart_item_id = $2
       RETURNING *`,
      [quantity, cartItemId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    logger.error(`Failed to update cart items ${req.user.user_id}: ${err.message}`);
    err.message = 'Failed to update cart item';
    next(err);  
  }
});


// DELETE any cart item (admin)
router.delete('/admin/:cartItemId', requireAdmin, async (req, res, next) => {
  const { cartItemId } = req.params;

  try {
    const { rows } = await pool.query(
      `DELETE FROM cart_items
       WHERE cart_item_id = $1
       RETURNING *`,
      [cartItemId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.status(200).json({ message: 'Cart item deleted successfully' });
  } catch (err) {
    logger.error(`Failed to delete cart items ${req.user.user_id}: ${err.message}`);
    err.message = 'Failed to delete cart item'; 
    next(err); 
  }
});

module.exports = router;