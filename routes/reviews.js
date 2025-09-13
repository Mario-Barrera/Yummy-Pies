const express = require('express');
const router = express.Router();
const pool = require('../db/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { updateProductRating } = require('../helpers/rating');


router.get('/user', requireAuth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { rows } = await pool.query(
      `SELECT r.*, p.name AS product_name
       FROM reviews r
       JOIN products p ON r.product_id = p.product_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    logger.error(`Failed to fetch user reviews: ${err.message || err}`);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});



// PUT update a review (owner only, full update: rating and comment)
router.put('/:reviewId', requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  if (rating === undefined || comment === undefined) {
    return res.status(400).json({ error: 'Both rating and comment are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM reviews WHERE review_id = $1 AND user_id = $2',
      [reviewId, req.user.user_id]
    );

    if (!existing.length) {
      return res.status(403).json({ error: 'Access denied or review not found' });
    }

    const sanitizedComment = comment?.trim() || null;

    // Updated SQL with updated_at
    const { rows: updatedRows } = await pool.query(
      `UPDATE reviews
       SET rating = $1,
           comment = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE review_id = $3
       RETURNING *`,
      [rating, sanitizedComment, reviewId]
    );

    await updateProductRating(updatedRows[0].product_id);

    res.json(updatedRows[0]);
  } catch (err) {
    logger.error(`Failed to update review ${reviewId}: ${err.message || err}`);
    res.status(500).json({ error: 'Failed to update review' });
  }
});



// USER ROUTES
// GET all reviews for a specific product
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.name AS user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(rows);
  } catch (err) {
    logger.error(`Failed to fetch reviews for product ${productId}: ${err.message || err}`);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});


// POST create a review (logged-in user)
router.post('/', requireAuth, async (req, res) => {
  const { product_id, rating, comment } = req.body;

  if (!product_id || rating === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if user already reviewed this product
    const check = await pool.query(
      'SELECT * FROM reviews WHERE user_id = $1 AND product_id = $2',
      [req.user.user_id, product_id]
    );

    if (check.rows.length) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    const sanitizedComment = comment?.trim() || null;

    const { rows } = await pool.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.user_id, product_id, rating, sanitizedComment]
    );

    // Update product rating after creating review
    await updateProductRating(product_id);

    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error(`Failed to create review for product ${product_id}: ${err.message || err}`);
    res.status(500).json({ error: 'Failed to create review' });
  }
});


// DELETE a review (owner only)
router.delete('/:reviewId', requireAuth, async (req, res) => {
  const { reviewId } = req.params;

  try {
    const { rows } = await pool.query(
      'DELETE FROM reviews WHERE review_id=$1 AND user_id=$2 RETURNING *',
      [reviewId, req.user.user_id]
    );

    if (!rows.length)
      return res.status(404).json({ error: 'Review not found or not owned by user' });

    // Update product rating after deleting review
    await updateProductRating(rows[0].product_id);

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    logger.error(`Failed to delete review ${reviewId}: ${err.message || err}`);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});


// GET all reviews (public)
router.get('/all', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, u.name AS user_name, p.name AS product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      JOIN products p ON r.product_id = p.product_id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    logger.error(`Failed to fetch all reviews: ${err.message || err}`);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});


// GET all reviews with their comments (public)
// Corrected version of the route
router.get('/with-comments', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        r.review_id,
        r.product_id,
        r.rating,
        r.comment AS review_text,
        r.created_at AS review_date,
        u1.name AS review_author,
        c.comment AS comment_text,
        c.created_at AS comment_date,
        u2.name AS comment_author
      FROM reviews r
      JOIN users u1 ON r.user_id = u1.user_id
      LEFT JOIN review_comments c ON r.review_id = c.review_id
      LEFT JOIN users u2 ON c.user_id = u2.user_id
      ORDER BY r.review_id, c.created_at;
    `);

    const reviewsMap = new Map();

    for (const row of rows) {
      if (!reviewsMap.has(row.review_id)) {
        reviewsMap.set(row.review_id, {
          review_id: row.review_id,
          product_id: row.product_id,
          rating: row.rating,
          comment: row.review_text,
          created_at: row.review_date,
          user_name: row.review_author,
          comments: []
        });
      }

      if (row.comment_text) {
        reviewsMap.get(row.review_id).comments.push({
          comment: row.comment_text,
          created_at: row.comment_date,
          user_name: row.comment_author
        });
      }
    }

    res.json(Array.from(reviewsMap.values()));
  } catch (err) {
    console.error('Error fetching reviews with comments:', err);
    res.status(500).json({ error: 'Failed to fetch reviews with comments' });
  }
});


// ADMIN ROUTES
// GET all reviews (admin only)
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.name AS user_name, u.email AS user_email, p.name AS product_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       JOIN products p ON r.product_id = p.product_id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    logger.error(`Failed to fetch admin reviews: ${err.message || err}`);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});


// DELETE any review (admin only)
router.delete('/admin/:reviewId', requireAdmin, async (req, res) => {
  const { reviewId } = req.params;

  try {
    const { rows } = await pool.query(
      'DELETE FROM reviews WHERE review_id=$1 RETURNING *',
      [reviewId]
    );

    if (!rows.length)
      return res.status(404).json({ error: 'Review not found' });

    // Update product rating after deleting review
    await updateProductRating(rows[0].product_id);

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    logger.error(`Failed to delete admin review ${reviewId}: ${err.message || err}`);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});


module.exports = router;
