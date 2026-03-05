const express = require('express');
const db = require('../db/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// -------------------- HELPER --------------------

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function notFound(message = 'Review not found') {                   // message = 'Review not found'  is a default parameter
  const error = new Error(message);
  error.status = 404;
  return error;
}

function forbidden(message = 'Forbidden') {
  const error = new Error(message);
  error.status = 403;
  return error;
}

function isValidRating(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

function isValidReview(value) {
  if (typeof value !== "string") return false;
  const trimmedReview = value.trim();
  return trimmedReview.length > 0 && trimmedReview.length <= 1000;
}

// -------------------- ROUTES --------------------

// GET /api/reviews
router.get('/', async function listReviews(req, res, next) {
  try {
    const { product_id } = req.query;                         // Get product_id from request query

    const params = [];                                        // Stores values for SQL query parameters
    const where = [];                                         // Stores optional WHERE conditions

    if (product_id !== undefined) {
      const productid = Number(product_id);
      if (!Number.isInteger(productid) || productid <= 0) {
        throw badRequest("Invalid product_id");
      }
      params.push(productid);
      where.push(`r.product_id = $${params.length}`);
    }

    // builds the SQL query string that your Node/Express route will send to PostgreSQL
    // 'r' means reviews table and 'u' means users table
    const sql = `
      SELECT
        r.review_id,                              -- r is an alias for reviews
        r.user_id,
        u.name AS user_name,                      -- u is an alias for users, this line of code also get renamed to user_name
        r.product_id,
        r.rating,
        r.review,
        r.created_at
      FROM reviews r
      JOIN users u ON u.user_id = r.user_id                   -- Join users table to reviews using matching user_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}             -- Add WHERE clause only if conditions exist
      ORDER BY r.created_at DESC;
    `;

    const { rows } = await db.query(sql, params);                       // executes the SQL query and extracts the returned rows from the database result
    return res.json({ items: rows });

  } catch (err) {
    return next(err);
  }
});

// POST /api/reviews
router.post('/', requireAuth, async function createReview(req, res, next) {
  try {
    const userId = req.user.user_id;
    const {
      product_id,
      rating,
      review
    } = req.body;

    const productid = Number(product_id);
    if (!Number.isInteger(productid) || productid <= 0) {
      throw badRequest("Product ID is required");
    }

    if (!isValidRating(rating)) {
      throw badRequest("Rating must be an integer 1 to 5");
    }

    if (!isValidReview(review)) {
      throw badRequest("Review is required (1 - 1000 characters)");
    }

    const sql = `
      INSERT INTO reviews (user_id, product_id, rating, review)
      VALUES ($1, $2, $3, $4)
      RETURNING review_id, user_id, product_id, rating, review, created_at; 
    `;

    const params = [userId, productid, Number(rating), review.trim()];                      // creates an array that holds the values that will be inserted into the SQL placeholders

    try {
      const { rows } = await db.query(sql, params);                                         // Execute insert and handle duplicate review (UNIQUE constraint)
      return res.status(201).json({ review: rows[0] });
    } catch (dbError) {
      if (dbError.code === '23505') {                                                         // 23505 is Unique constraint violation
        throw badRequest("You already reviewed this product");
      }
      throw dbError;
    }

  } catch (err) {
    return next(err);
  }
});

// PATCH /api/reviews/:id - (Owner only or Admin)
router.patch('/:id', requireAuth, async function updateReview(req, res, next) {
  try { 
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw badRequest("Invalid review id");
    }

    // renaming the property during destructuring
    const { rows: foundRows } = await db.query(
      `SELECT review_id, user_id
      FROM reviews
      WHERE review_id = $1`,
      [id]
    );

    const existing = foundRows[0];
    if (!existing) {
      throw notFound();
    }

    const isOwner = existing.user_id === req.user.user_id;                // 'existing.user_id' is the user who created the review and 'req.user.user_id' represents the currently logged-in user  
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw forbidden();
    }

    const { rating, review } = req.body;

    const set = [];
    const params = [];

    if (rating !== undefined) {
      if (!isValidRating(rating)) {
        throw badRequest("Rating must be an integer 1 to 5");
      }
      params.push(Number(rating));
      set.push(`rating = $${params.length}`);
    }

    if (review !== undefined) {
      if (!isValidReview(review)) {
        throw badRequest("Review must be 1 - 1000 characters");
      }
      params.push(review.trim());
      set.push(`review = $${params.length}`);
    }

    if (set.length === 0) {
      throw badRequest("No valid fields to update");
    }

    params.push(id);                                                      // Used in the UPDATE query to update the correct review

    const sql = `
      UPDATE reviews
      SET ${set.join(", ")}
      WHERE review_id = $${params.length}
      RETURNING review_id, user_id, product_id, rating, review, created_at;
    `;

    const { rows } = await db.query(sql, params);
    return res.json({ review: rows[0] });

  } catch (err) {
    return next(err);
  }
});

// DELETE /api/reviews/:id - (Owner only or Admin)
router.delete('/:id', requireAuth, async function deleteReview(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw badRequest("Invalid review id");
    }

    const { rows: foundRows } = await db.query(
      `SELECT review_id, user_id
      FROM reviews
      WHERE review_id = $1`,
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

    await db.query(`DELETE FROM reviews WHERE review_id = $1`, [id]);
    return res.json({ deleted: true, review_id: id });
    
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
