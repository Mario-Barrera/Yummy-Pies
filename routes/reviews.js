const express = require('express');
const router = express.Router();
const client = require('../db/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// USER ROUTES
// GET all reviews for a specific product
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const { rows } = await client.query(
      `SELECT r.*, u.name AS user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST create a review (logged-in user)
router.post('/', requireAuth, async (req, res) => {
  const { product_id, rating, comment } = req.body;

  if (!product_id || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const { rows } = await client.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.user_id, product_id, rating, comment || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// PUT update a review (owner only)
router.put('/:reviewId', requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  try {
    // Check if review belongs to the user
    const { rows: existing } = await client.query(
      'SELECT * FROM reviews WHERE review_id=$1 AND user_id=$2',
      [reviewId, req.user.user_id]
    );

    if (!existing.length) {
      return res.status(403).json({ error: 'Access denied or review not found' });
    }

    const updated = await client.query(
      `UPDATE reviews
       SET rating=$1, comment=$2
       WHERE review_id=$3
       RETURNING *`,
      [rating || existing[0].rating, comment || existing[0].comment, reviewId]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// DELETE a review (owner only)
router.delete('/:reviewId', requireAuth, async (req, res) => {
  const { reviewId } = req.params;

  try {
    const { rows } = await client.query(
      'DELETE FROM reviews WHERE review_id=$1 AND user_id=$2 RETURNING *',
      [reviewId, req.user.user_id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Review not found or not owned by user' });

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ADMIN ROUTES
// GET all reviews (admin only)
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { rows } = await client.query(
      `SELECT r.*, u.name AS user_name, u.email AS user_email, p.name AS product_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       JOIN products p ON r.product_id = p.product_id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// DELETE any review (admin only)
router.delete('/admin/:reviewId', requireAdmin, async (req, res) => {
  const { reviewId } = req.params;

  try {
    const { rows } = await client.query(
      'DELETE FROM reviews WHERE review_id=$1 RETURNING *',
      [reviewId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Review not found' });

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
