const express = require('express');
const router = express.Router();
const client = require('../db/client');
const { requireAuth } = require('../middleware/auth');

// GET all review comments made by a specific user
router.get('/user', requireAuth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { rows } = await client.query(`
      SELECT c.comment_id, c.comment AS comment_text, c.created_at, r.comment AS review_text
      FROM review_comments c
      JOIN reviews r ON c.review_id = r.review_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, [userId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});


// POST a new comment for a review
router.post('/review/:review_id', requireAuth, async (req, res) => {
  const { review_id } = req.params;
  const user_id = req.user.user_id;
  const { comment } = req.body;

  if (comment.trim().length === 0) {
    return res.status(400).json({ error: 'Comment cannot be empty' });
  }

  try {
    const result = await client.query(
      `INSERT INTO review_comments (review_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [review_id, user_id, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// PUT update a comment
router.put('/:comment_id', requireAuth, async (req, res) => {
  const { comment_id } = req.params;
  const user_id = req.user.user_id;
  const { comment } = req.body;

  if (comment.trim().length === 0) {
    return res.status(400).json({ error: 'Comment cannot be empty' });
  }

  try {
    const check = await client.query(
      `SELECT user_id FROM review_comments WHERE comment_id = $1`,
      [comment_id]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Comment not found' });
    if (check.rows[0].user_id !== user_id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied' });

    const result = await client.query(
      `UPDATE review_comments SET comment = $1 WHERE comment_id = $2 RETURNING *`,
      [comment, comment_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// DELETE a comment
router.delete('/:comment_id', requireAuth, async (req, res) => {
  const { comment_id } = req.params;
  const user_id = req.user.user_id;

  try {
    const check = await client.query(
      `SELECT user_id FROM review_comments WHERE comment_id = $1`,
      [comment_id]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Comment not found' });
    if (check.rows[0].user_id !== user_id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied' });

    await client.query(`DELETE FROM review_comments WHERE comment_id = $1`, [comment_id]);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// GET all comments for a review (public)
router.get('/public/:review_id', async (req, res) => {
  const { review_id } = req.params;
  try {
    const result = await client.query(
      `SELECT rc.comment_id, rc.comment, rc.created_at, u.user_id, u.name AS user_name
       FROM review_comments rc
       JOIN users u ON rc.user_id = u.user_id
       WHERE rc.review_id = $1
       ORDER BY rc.created_at ASC`,
      [review_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});


router.get('/all', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const { rows } = await client.query(
      `SELECT rc.comment_id, rc.comment, rc.created_at, 
              u.user_id, u.name AS user_name, r.review_id, r.review_text
       FROM review_comments rc
       JOIN users u ON rc.user_id = u.user_id
       JOIN reviews r ON rc.review_id = r.review_id
       ORDER BY rc.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all comments' });
  }
});


module.exports = router;

