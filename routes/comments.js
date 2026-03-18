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

// GET /api/comments - returns all comments
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

// GET /api/comments/me - fetch comments for logged-in user
router.get("/me", requireAuth, async function (req, res, next) {
  try {
    const userId = req.user.user_id;

    const { rows } = await db.query(
      `SELECT
        c.comment_id,
        c.review_id,
        c.user_id,
        u.name AS user_name,
        c.comment,
        c.created_at,
        r.review AS review_text,
        p.name AS product_name
      FROM comments c
      JOIN users u ON u.user_id = c.user_id
      JOIN reviews r ON r.review_id = c.review_id
      JOIN products p ON p.product_id = r.product_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC;
    `,
    [userId]
  );

  return res.json({ items: rows });

  } catch (err) {
    return next(err);
  }
});

module.exports = router;