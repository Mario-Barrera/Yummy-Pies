const express = require('express');
const router = express.Router();
const pool = require('../db/client');
const logger = require('../utils/logger');
const { requireAuth } = require('../middleware/auth');

// POST create a comment on a review
router.post('/:reviewId', requireAuth, async (req, res, next) => {
    const { reviewId } = req.params;
    const { comment } = req.body;

    if (!comment) {
        const err = new Error('Comment is required');           // create an error object
        err.status = 400;                                       // attach an HTTP status code
        return next(err);                                       // pass it to the error handler
    }

    try {
        // Insert the comment into the database
        const { rows } = await pool.query(
            `INSERT INTO review_comments (review_id, user_id, comment)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [reviewId, req.user.user_id, comment]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        logger.error(`Failed to create comment on review ${reviewId}: ${err.message || err}`);
        const error = new Error('Failed to create comment');
        error.status = 500;
        return next(error);
    }
});

// Get all comments by the logged-in user
router.get('/user', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const { rows } = await pool.query(
      `SELECT
         c.comment_id,
         c.comment,
         c.created_at,
         r.updated_at,
         c.user_id,
         r.rating,
         r.review_id,
         p.product_id,
         p.name AS product_name
       FROM review_comments c
       LEFT JOIN reviews r ON c.review_id = r.review_id
       LEFT JOIN products p ON r.product_id = p.product_id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    console.log('User comments rows:', rows);  // Debug log

    res.json(rows);

  } catch (err) {
    console.error(`Failed to fetch user comments: ${err.message || err}`);
    next(new Error('Failed to fetch user comments'));
  }
});


// GET all comments for a specific review
router.get('/:reviewId', async (req, res, next) => {
  const { reviewId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT c.comment, c.created_at, u.name AS user_name
       FROM review_comments c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.review_id = $1
       ORDER BY c.created_at`, 
      [reviewId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching comments for review:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});



// Get all comments (admin only)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      const error = new Error('Access denied. Admins only');
      error.status = 403;
      return next(error);
    }

    logger.info(`Admin ${req.user.user_id} fetched all review comments`);

    const { rows } = await pool.query(
      `SELECT c.*, u.name AS user_name
       FROM review_comments c
       JOIN users u ON c.user_id = u.user_id
       ORDER BY c.created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    logger.error(`Failed to fetch all comments: ${err.message || err}`);
    const error = new Error('Failed to fetch all comments');
    error.status = 500;
    return next(error);
  }
});


router.put('/:commentId', requireAuth, async (req, res, next) => {
  const { commentId } = req.params;
  const { rating, comment } = req.body;

  if (comment == null || rating == null) {
    const err = new Error('Both rating and comment are required');
    err.status = 400;
    return next(err);
  }

  if (isNaN(rating) || rating < 1 || rating > 5) {
    const err = new Error('Rating must be a number between 1 and 5');
    err.status = 400;
    return next(err);
  }

  try {
    // Verify ownership
    const { rows: existingComment } = await pool.query(
      'SELECT * FROM review_comments WHERE comment_id = $1 AND user_id = $2',
      [commentId, req.user.user_id]
    );

    if (!existingComment.length) {
      const error = new Error('Access denied or comment not found');
      error.status = 403;
      return next(error);
    }

    const sanitizedComment = comment.trim();

    // Update rating and comment, set updated_at
    const { rows: updatedRows } = await pool.query(
      `UPDATE review_comments
       SET rating = $1,
           comment = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE comment_id = $3
       RETURNING *`,
      [rating, sanitizedComment, commentId]
    );

    res.json(updatedRows[0]);
  } catch (err) {
    logger.error(`Failed to update comment ${commentId}: ${err.message || err}`);
    const error = new Error('Failed to update comments');
    error.status = 500;
    return next(error);
  }
});


// DELETE a comment (owner only)
router.delete('/:commentId', requireAuth, async (req, res, next) => {
    const { commentId } = req.params;

    try {
        // Check if the comment belongs to the user
        const { rows: existingComment } = await pool.query(
            'SELECT * FROM review_comments WHERE comment_id = $1 AND user_id = $2',
            [commentId, req.user.user_id]
        );

        if (!existingComment.length) {
            const error = new Error('Access denied or comment not found');
            error.status = 403;
            return next(error);
        }

        // Delete the comment
        const { rows: deletedRows } = await pool.query(
            'DELETE FROM review_comments WHERE comment_id = $1 RETURNING *',
            [commentId]
        );

        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        logger.error(`Failed to delete comment ${commentId}: ${err.message || err}`);
        const error = new Error('Failed to delete comments');
        error.status = 500;
        return next(error);
    }
});

// DELETE a comment (admin only)
router.delete('/admin/:commentId', requireAuth, async (req, res, next) => {
    const { commentId } = req.params;

    try {
        // Check if the user is an admin
        if (req.user.role !== 'admin') {
            const error = new Error('Access denied. Admins only');
            error.status = 403;
            return next(error);
        }

        logger.info(`Admin ${req.user.user_id} deleted comment ${commentId}`);

        // Delete the comment
        const { rows: deletedRows } = await pool.query(
            'DELETE FROM review_comments WHERE comment_id = $1 RETURNING *',
            [commentId]
        );

        if (deletedRows.length === 0) {
            const error = new Error('Comment not found');
            error.status = 404;
            return next(error);
        }

        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        logger.error(`Failed to delete comment ${commentId}: ${err.message || err}`);
        const error = new Error('Failed to delete comments');
        error.status = 500;
        return next(error);
    }
});

module.exports = router;
