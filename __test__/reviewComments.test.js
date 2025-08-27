const express = require('express');
const pool = require('../db/client');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// POST /review-comments - create a new comment on a review
router.post('/', authenticateToken, async (req, res) => {
  const { review_id, comment } = req.body;
  const user_id = req.user.user_id;

  if (!review_id || !comment) {
    return res.status(400).json({ error: 'Missing required fields: review_id and comment' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO Review_Comments (review_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [review_id, user_id, comment]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// GET /review-comments/review/:review_id - get all comments for a review
router.get('/review/:review_id', async (req, res) => {
  const { review_id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT rc.*, u.name AS username
       FROM Review_Comments rc
       JOIN Users u ON rc.user_id = u.user_id
       WHERE rc.review_id = $1
       ORDER BY rc.created_at ASC`,
      [review_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// GET /review-comments/:id - get a single comment by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT rc.*, u.name AS username
       FROM Review_Comments rc
       JOIN Users u ON rc.user_id = u.user_id
       WHERE rc.comment_id = $1`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Comment not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching comment:', err);
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
});

// PUT /review-comments/:id - update a comment (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE Review_Comments
       SET comment = $1
       WHERE comment_id = $2
       RETURNING *`,
      [comment, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Comment not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// DELETE /review-comments/:id - delete a comment (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM Review_Comments WHERE comment_id = $1`,
      [id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Comment not found' });

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
