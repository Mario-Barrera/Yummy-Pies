const express = require('express');
const pool = require('../db/client');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();


// POST /reviews - create a new review
router.post('/', authenticateToken, async (req, res) => {
  const { product_id, rating, comment } = req.body;
  const user_id = req.user.user_id;

  if (!product_id || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO Reviews (user_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, product_id, rating, comment]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});


// GET /products/:product_id/reviews - get all reviews for a product
router.get('/product/:product_id', async (req, res) => {
  const { product_id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.name AS username
       FROM Reviews r
       JOIN Users u ON r.user_id = u.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [product_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});


// GET /reviews/:id - get a single review
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.name AS username
       FROM Reviews r
       JOIN Users u ON r.user_id = u.user_id
       WHERE r.review_id = $1`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Review not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching review:', err);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});


// PUT /reviews/:id - update a review (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;
  const { rating, comment } = req.body;

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE Reviews SET rating = COALESCE($1, rating), comment = COALESCE($2, comment)
       WHERE review_id = $3
       RETURNING *`,
      [rating, comment, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Review not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});


// DELETE /reviews/:id - delete a review (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM Reviews WHERE review_id = $1`,
      [id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Review not found' });

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
