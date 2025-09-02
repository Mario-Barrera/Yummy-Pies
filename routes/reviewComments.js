const express = require('express');
const router = express.Router();
const client = require('../db/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');


// GET comments for the logged-in user
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (parseInt(userId) !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await client.query(
      'SELECT comment_id AS id, review_id, content, created_at FROM review_comments WHERE user_id=$1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// PATCH a comment
router.patch('/:commentId', requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const { rows } = await client.query('SELECT * FROM review_comments WHERE comment_id=$1', [commentId]);
    if (!rows.length || rows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await client.query('UPDATE review_comments SET content=$1 WHERE comment_id=$2', [content, commentId]);
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// DELETE a comment
router.delete('/:commentId', requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;

    const { rows } = await client.query('SELECT * FROM review_comments WHERE comment_id=$1', [commentId]);
    if (!rows.length || rows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await client.query('DELETE FROM review_comments WHERE comment_id=$1', [commentId]);
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});


// GET all comments for a specific review (authenticated users)
router.get('/review/:review_id', requireAuth, async (req, res) => {
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


// POST a new comment for a review (authenticated users)
router.post('/review/:review_id', requireAuth, async (req, res) => {
  const { review_id } = req.params;
  const user_id = req.user.user_id;
  const { comment } = req.body;

  if (!comment) return res.status(400).json({ error: 'Comment cannot be empty' });

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


// PUT update a comment (user can only update their own)
router.put('/:comment_id', requireAuth, async (req, res) => {
  const { comment_id } = req.params;
  const user_id = req.user.user_id;
  const { comment } = req.body;

  if (!comment) return res.status(400).json({ error: 'Comment cannot be empty' });

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


// DELETE a comment (user can only delete their own)
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


// GET all review comments (admin only)
router.get('/admin', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  try {
    const result = await client.query(
      `SELECT rc.comment_id, rc.comment, rc.created_at, rc.review_id, u.user_id, u.name AS user_name
       FROM review_comments rc
       JOIN users u ON rc.user_id = u.user_id
       ORDER BY rc.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});


// DELETE any comment (admin only)
router.delete('/admin/:comment_id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { comment_id } = req.params;

  try {
    const check = await client.query(
      `SELECT * FROM review_comments WHERE comment_id = $1`,
      [comment_id]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Comment not found' });

    await client.query(`DELETE FROM review_comments WHERE comment_id = $1`, [comment_id]);
    res.json({ message: 'Comment deleted successfully by admin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});


// GET all review comments (public)
router.get('/all', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT rc.comment_id, rc.comment, rc.created_at, rc.review_id,
             u.user_id, u.name AS user_name
      FROM review_comments rc
      JOIN users u ON rc.user_id = u.user_id
      ORDER BY rc.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch review comments' });
  }
});


// GET comments for a specific review (public)
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

module.exports = router;
