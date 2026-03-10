const express = require('express');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// -------------------- HELPER --------------------

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function notFound(message = "Comment not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function forbidden(message = "Forbidden") {
  const err = new Error(message);
  err.status = 403;
  return err;
}

function isValidComment(value) {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 1000;
}

// -------------------- ROUTES --------------------

// GET /api/comments
router.get('/', async function listComments(req, res, next) {
  try {
    const { review_id } = req.query;

    const params = [];
    const where = [];

    if (review_id !== undefined) {
      const reviewid = Number(review_id);

      if (!Number.isInteger(reviewid) || reviewid <= 0) {
        throw badRequest("Invalid review id");
      }

      params.push(reviewid);
      where.push(`c.review_id = $${params.length}`);
    }

    const sql = `
      SELECT
        c.comment_id,
        c.review_id,
        c.user_id,
        u.name AS user_name,
        c.comment,
        c.created_at
      FROM comments c
      JOIN users u ON u.user_id = c.user_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY c.created_at DESC;
    `;

    const { rows } = await db.query(sql, params);
    return res.json({ items: rows });

  } catch (err) {
    return next(err);
  }
});

// POST /api/comments
router.post('/', requireAuth, async function createComment(req, res, next) {
  try {
    const userId = req.user.user_id;

    const {
      review_id,
      comment
    } = req.body;

    const reviewid = Number(review_id);

    if (!Number.isInteger(reviewid) || reviewid <= 0) {
      throw badRequest("Review ID is required");
    }

    if (!isValidComment(comment)) {
      throw badRequest("Comment must be 1 - 1000 characters");
    }

    const sql = `
    INSERT INTO comments (review_id, user_id, commment)
    VALUES ($1, $2, $3)
    RETURNING comment_id, review_id, user_id, comment, created_at;
    `;

    const params = [reviewid, userId, comment.trim()];

    try {
      const { rows } = await db.query(sql, params);
      return res.status(201).json({ comment: rows[0] });

    } catch (dbError) {
      if (dbError.code === '23505') {                                              // 23505 is Unique constraint violation
        throw badRequest("You already commented on this review");
      }
      throw dbError
    }

  } catch (err) {
    return next(err);
  }
});

// PATCH /api/comments/:id - (Owner only or Admin)
router.patch('/:id', requireAuth, async function updateComment(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw badRequest("Invalid comment id");
    }

    const { rows: foundRows } = await db.query(
      `SELECT comment_id, user_id
      FROM comments
      WHERE comment_id = $1`,
      [id]
    );

    const existing = foundRows[0];

    if (!existing) {
      throw notFound();
    }

    const isOwner = existing.user_id === req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw forbidden();
    }

    const { comment } = req.body;

    if (!isValidComment(comment)) {
      throw badRequest("Comment must be 1 - 1000 characters");
    }

    const sql = `
      UPDATE comments
      SET comment = $1
      WHERE comment_id = $2
      RETURNING comment_id, review_id, user_id, comment, created_at;
    `;

    const { rows } = await db.query(sql, [comment.trim(), id]);

    return res.json({ comment: rows[0] });

  } catch (err) {
    return next(err);
  }
});

// DELETE /api/comments/:id - (Owner only or Admin)
router.delete('/:id', requireAuth, async function deleteComment(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw badRequest("Invalid comment id");
    }

    const { rows: foundRows } = await db.query(
      `SELECT comment_id, user_id
      FROM comments
      WHERE comment_id = $1`,
      [id]
    );

    const existing = foundRows[0];
    
    if (!existing) {
      throw notFound();
    }

    const isOwner = existing.user_id === req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw forbidden();
    }

    await db.query(
      `DELETE FROM comments WHERE comment_id = $1`,
      [id]
    );

    return res.json({ deleted: true, comment_id: id });                    

  } catch (err) {
    return next(err);
  }
});

module.exports = router;