const express = require('express');
const pool = require('../db/client');
const router = express.Router();
const jwt = require('jsonwebtoken');


// Middleware to authenticate token and check admin role
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    // Handle JWT errors explicitly
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next (err);
  }
};


// List all products (public)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM Products ORDER BY name`);
    const products = rows.map(p => ({...p, soldOut: p.stock_quantity === 0 }));
    res.json(products);
  } catch (err) {
    next(err); 
  }
});


// Get single product by ID (public)
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID. Must be a number." });
    }

    const result = await pool.query(
      'SELECT * FROM Products WHERE product_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = { 
      ...result.rows[0], 
      soldOut: result.rows[0].stock_quantity === 0 
    };

    res.json(product);
  } catch (err) {
    next(err);
  }
});


// Add new product (admin)
router.post('/', authenticateAdmin, async (req, res, next) => {
  const {
    name,
    price,
    stock_quantity = 0, // default to 0 if not provided
    category = null,
    image_key = null,
    star_rating = 0 // default to 0 if not provided
  } = req.body;

  // Validate required fields
  if (!name || price == null) {
    return res.status(400).json({ error: 'Missing required product fields: name and price' });
  }

  // Validate star_rating range if provided
  if (star_rating < 0 || star_rating > 5) {
    return res.status(400).json({ error: 'star_rating must be between 0 and 5' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO Products (name, price, stock_quantity, category, image_key, star_rating)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, price, stock_quantity, category, image_key, star_rating]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});


// Update product info (admin)
router.put('/:id', authenticateAdmin, async (req, res, next) => {
  const productId = Number(req.params.id);
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const {
    name,
    price,
    stock_quantity = 0,
    category = null,
    image_key = null,
    star_rating = 0
  } = req.body;

  // Validate required fields
  if (!name || price == null) {
    return res.status(400).json({ error: 'Missing required product fields: name and price' });
  }

  // Validate star_rating range if provided
  if (star_rating < 0 || star_rating > 5) {
    return res.status(400).json({ error: 'star_rating must be between 0 and 5' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE Products
       SET name=$1, price=$2, stock_quantity=$3, category=$4, image_key=$5, star_rating=$6
       WHERE product_id=$7
       RETURNING *`,
      [name, price, stock_quantity, category, image_key, star_rating, productId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});


// Delete product (admin)
router.delete('/:id', authenticateAdmin, async (req, res, next) => {
  const productId = Number(req.params.id);

  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM Products WHERE product_id = $1`, 
      [productId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;