// routes/products.js
const express = require('express');
const client = require('../db/client');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all products (public)
router.get('/', async (req, res) => {
  try {
    const { rows } = await client.query('SELECT * FROM products ORDER BY product_id');
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
    const { rows } = await client.query('SELECT * FROM products WHERE product_id=$1', [id]);
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
  try {
    const { rows } = await client.query(
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

// PUT update a product (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, price, stock_quantity, category, image_key, star_rating } = req.body;
  try {
    const { rowCount, rows } = await client.query(
      `UPDATE products 
       SET name=$1, price=$2, stock_quantity=$3, category=$4, image_key=$5, star_rating=$6
       WHERE product_id=$7
       RETURNING *`,
      [name, price, stock_quantity, category, image_key, star_rating, id]
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
    const { rowCount } = await client.query(
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
