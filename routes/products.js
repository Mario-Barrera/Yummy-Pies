const express = require('express');                                   // loads the dotenv library, which then loads the environment variables from the .env file into the process.env  process.env is a global configuration object provided by Node
const db = require('../db/client');                                   // creates and exports the database connection pool
const { requireAuth, requireAdmin } = require('../middleware/auth');                // Import JWT authentication middleware

const router = express.Router();

// Prevents: Non-numeric inputs, SQL injection attempts, negative number, and decimals
function parsePositiveInt(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    const error = new Error("Invalid positive number");
    error.status = 400;                                                     // 400 Bad request
    throw error;
  }
  return number;
}

// GET api/products
router.get('/', async function (req, res, next) {
  try {
    const { q } = req.query;                                          // destructuring shorthand for: cont q = req.query.q; q stands for query (search query)
    
    const params = [];                                                // array that will hold the values you pass into a parameterized SQL query
    let where = '';                                                   // where builds the filtering condition in the SQL query

    if (q) {                                                          // this checks: Did the client provide a search query?
      params.push(`%${q}%`);                                          // This adds a value to the params array, % is a wildcard in SQL
      where = `WHERE name ILIKE $${params.length}`;                   // ILIKE is a PostgreSQL operator: Case-insensitive pattern matching
    }

    const sql = `                                                 -- SQL query matches product table schema
      SELECT 
        product_id,
        name,
        price,
        image_key,
        star_rating,
        created_at
      FROM products                                         -- Get the data from the products table
      ${where} 
      ORDER BY created_at DESC              
    `;

    // Send the SQL query to PostgreSQL
    const { rows } = await db.query(sql, params);         // sql string, params is the array of values, 

    return res.json({ items: rows });

  } catch (err) {
    return next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async function getProductById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      const error = new Error("Invalid product id");
      error.status = 400;                                             // 400 Bad request
      throw error;
    }

    const sql = `
      SELECT
        Product_id,
        name,
        price,
        image_key,
        star_rating,
        created_at
      FROM products
      WHERE product_id = $1;
    `;
    
    const { rows } = await db.query(sql, [id]);
    const product = rows[0];

    if (!product) {
      const error = new Error("Product not found");
      error.status = 404;                                         // 404 Not found
      throw error;
    }

  return res.json({ item: product });

  } catch (err) {
    return next(err);
  }
});

// POST /api/products - Admin only
router.post('/', requireAdmin, async function createProduct(req, res, next) {
  try {
    const {
      name,
      price, 
      image_key,
      star_rating
    } = req.body;

    if (!name || typeof name !== "string") {
      const error = new Error("Name is required");
      error.status = 400;                                                   // 400 Bad request
      throw error;
    }

    const numericPrice = Number(price);
    if (!Number.isInteger(numericPrice) || numericPrice < 0) {
      const error = new Error("Price must be a non-negative number");
      error.status = 400;
      throw error;
    }

    const numericRating = 
      star_rating === undefined || star_rating === null 
        ? null 
        : Number(star_rating);

    if (numericPrice !== null && 
      (!Number.isFinite(numericRating) || numericRating < 0 || numericRating > 5)                 // !Number.isFinite(numericRating) catches: NaN, Infinity, -Infinity
    ) {
      const error = new Error("Star rating must be between 0 and 5");
      error.status = 400;
      throw error;
    }

    const sql =
    ` INSERT INTO product (name, price, image_key, star_rating)
      VALUES ($1, $2, $3, $4)
      RETURNING
        product_id,
        name,
        price,
        image_key,
        star_rating,
        created_at;
    `;

    const params = [
      name.trim(),
      numericPrice,
      image_key ?? null,                                          // ?? nullish coalescing operator, If the value on the left is null or undefined use the value on the right
      numericRating
    ];

    const { rows } = await db.query(sql, params);

    return res.status(201).json({ item: rows[0]});

  } catch (err) {
    return next(err);
  }
});

// PATCH /api/products/:id - Admin only
router.patch('/:id', requireAdmin, async function updateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 0) {
      const error = new Error("Invalid product id");
      error.status = 400;
      throw error;
    }

    const {
      name,
      price,
      image_key,
      star_rating
    } = req.body;

    const set = [];                             // allows you to update only the fields that were provided in the request body
    const params = [];                          // holds values for SQL placeholders ($1, $2, ...)

    if (name !== undefined) {
      if (!name || typeof name !== "string") {
        const error = new Error("Name must be a non-empty string");
        error.status = 400;
        throw error;
      }
      params.push(name.trim());
      set.push(`name = $${params.length}`);                     // `name = $${params.length}`    becomes: "name = $1"   this builds the SQL set clause dynamically
    }

    if (price !== undefined) {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        const error = new Error("Price must be a non-negative number");
        error.status = 400;
        throw error;
      }
      params.push(numericPrice);
      set.push(`price = $${params.length}`);                        // price = $2
    }

    if (image_key !== undefined) {
      params.push(image_key ?? null);
      set.push(`image_key = $${params.length}`);                  // image_key = $3
    }

    if (star_rating !== undefined) {
      let numericRating;

      if (star_rating === null) {
        numericRating = null;
      } else {
        numericRating = Number(star_rating);
      }

      if (numericRating !== null &&
        (!Number.isFinite(numericRating) || numericRating < 0 || numericRating > 5)) {
          const error = new Error("Star rating must be between 0 and 5 (or null)");
          error.status = 400;
          throw error;
        }
      params.push(numericRating);
      set.push(`star_rating = $${params.length}`);                                // star_rating = $4
    }

    if (set.length === 0) {
      const error = new Error("No valid fields to update");
      error.status = 400;
      throw error;
    }

    params.push(id);                                          // WHERE id param

    const sql = `
    UPDATE products
    SET ${set.join(", ")}
    WHERE product_id = $${params.length}
    RETURNING
      product_id,
      name,
      price,
      image_key,
      star_rating,
      created_at;
    `;

    const { rows } = await db.query(sql, params);
    const updated = rows[0];

    if (!updated) {
      const error = new Error("Product not found");
      error.status = 404;                                                       // 404 Not found
      throw error;
    }

    return res.json({ item: updated});

  } catch (err) {
    return next(err);
  }
});

// DELETE /api/products/:id - Admin only
router.delete('/:id', requireAuth, async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 0) {
      const error = new Error("Invalid product id");
      error.status = 400;
      throw error;
    }

    const sql = `
      DELETE FROM products
      WHERE product_id = $1
      RETURNING product_id;
    `;

    const { rows } = await db.query(sql, [id]);

    if (!rows[0]) {
      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }

    return res.json({ deleted: true, product_id: rows[0].product_id });
    
  } catch (err) {
    return next(err);
  }
});





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
