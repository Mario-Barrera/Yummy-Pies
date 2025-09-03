const express = require('express');
const pool = require('../db/client');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all products (public)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY product_id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product by ID (public)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE product_id=$1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST create a new product (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, price, stock_quantity, category, image_key, star_rating } = req.body;

  // Simple validation example
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required and must be a string.' });
  }
  if (name.length < 4 || name.length > 100) {
    return res.status(400).json({ error: 'Name must be between 4 and 100 characters.' });
  }
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Price must be a positive number.' });
  }
  if (!Number.isInteger(stock_quantity) || stock_quantity < 0) {
    return res.status(400).json({ error: 'Stock quantity must be a non-negative integer.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO products 
       (name, price, stock_quantity, category, image_key, star_rating)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, price, stock_quantity, category, image_key, star_rating]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update a product (admin only) - dynamic fields update
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, price, stock_quantity, category, image_key, star_rating } = req.body;

  const updates = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Name must be a non-empty string.' });
    }

  if (name.length > 50) {
    return res.status(400).json({ error: 'Name must be 50 characters or fewer.' });
    }
    updates.push(`name = $${idx++}`);
    values.push(name);
  }

  if (price !== undefined) {
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Price must be a positive number.' });
    }
    updates.push(`price = $${idx++}`);
    values.push(price);
  }

  if (stock_quantity !== undefined) {
    if (!Number.isInteger(stock_quantity) || stock_quantity < 0) {
      return res.status(400).json({ error: 'Stock quantity must be a non-negative integer.' });
    }
    updates.push(`stock_quantity = $${idx++}`);
    values.push(stock_quantity);
  }

  if (category !== undefined) {
    if (typeof category !== 'string') {
      return res.status(400).json({ error: 'Category must be a string.' });
    }
    if (category.length > 50) {
      return res.status(400).json({ error: 'Category must be 50 characters or fewer.' });
    }
    updates.push(`category = $${idx++}`);
    values.push(category);
  }


  if (image_key !== undefined) {
    if (typeof image_key !== 'string') {
      return res.status(400).json({ error: 'Image key must be a string.' });
    }
    updates.push(`image_key = $${idx++}`);
    values.push(image_key);
  }

  if (star_rating !== undefined) {
    if (typeof star_rating !== 'number' || star_rating < 0 || star_rating > 5) {
      return res.status(400).json({ error: 'Star rating must be a number between 0 and 5.' });
    }
    updates.push(`star_rating = $${idx++}`);
    values.push(star_rating);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update.' });
  }

  values.push(id);

  try {
    const { rowCount, rows } = await pool.query(
      `UPDATE products
       SET ${updates.join(', ')}
       WHERE product_id = $${idx}
       RETURNING *`,
      values
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE a product (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM products WHERE product_id=$1',
      [id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
