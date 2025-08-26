const request = require('supertest');
const app = require('../app');  // Adjust path: your express app export
const pool = require('../db/client');
const jwt = require('jsonwebtoken');

const adminToken = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET);
const userToken = jwt.sign({ role: 'user' }, process.env.JWT_SECRET);

describe('Products API', () => {

  beforeAll(async () => {
    // Optional: clean test DB or prepare test data if needed
    await pool.query('DELETE FROM Products');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /products', () => {
    it('should return empty array when no products', async () => {
      const res = await request(app).get('/products');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  describe('POST /products', () => {
    it('should reject without admin token', async () => {
      const res = await request(app)
        .post('/products')
        .send({ name: 'Test Product', price: 10 });
      expect(res.statusCode).toBe(401);
    });

    it('should reject if non-admin token provided', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test Product', price: 10 });
      expect(res.statusCode).toBe(403);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 10 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Missing required product fields/);
    });

    it('should create a new product with valid data', async () => {
      const productData = {
        name: 'Test Product',
        price: 25.50,
        stock_quantity: 5,
        category: 'Test Category',
        image_key: 'image123',
        star_rating: 4.5
      };

      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        name: productData.name,
        price: parseFloat(productData.price).toFixed(2),
        stock_quantity: productData.stock_quantity,
        category: productData.category,
        image_key: productData.image_key,
        star_rating: productData.star_rating
      });
      expect(res.body.product_id).toBeDefined();
    });
  });

  describe('GET /products/:id', () => {
    let productId;

    beforeAll(async () => {
      // Insert a product to test GET/:id
      const result = await pool.query(
        `INSERT INTO Products (name, price) VALUES ('Another Product', 19.99) RETURNING product_id`
      );
      productId = result.rows[0].product_id;
    });

    it('should return product by id', async () => {
      const res = await request(app).get(`/products/${productId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.product_id).toBe(productId);
      expect(res.body.name).toBe('Another Product');
    });

    it('should 404 for non-existing product', async () => {
      const res = await request(app).get(`/products/999999`);
      expect(res.statusCode).toBe(404);
    });

    it('should 400 for invalid id', async () => {
      const res = await request(app).get(`/products/abc`);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /products/:id', () => {
    let productId;

    beforeAll(async () => {
      const result = await pool.query(
        `INSERT INTO Products (name, price) VALUES ('Update Product', 10) RETURNING product_id`
      );
      productId = result.rows[0].product_id;
    });

    it('should update product when admin', async () => {
      const updatedData = {
        name: 'Updated Product',
        price: 15.99,
        stock_quantity: 3,
        category: 'Updated Category',
        image_key: 'newkey',
        star_rating: 3.5
      };

      const res = await request(app)
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe(updatedData.name);
      expect(res.body.price).toBe(parseFloat(updatedData.price).toFixed(2));
    });

    it('should reject update without admin', async () => {
      const res = await request(app)
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Fail Update', price: 20 });

      expect(res.statusCode).toBe(403);
    });

    it('should 404 if product not found', async () => {
      const res = await request(app)
        .put(`/products/999999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'No Product', price: 10 });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /products/:id', () => {
    let productId;

    beforeAll(async () => {
      const result = await pool.query(
        `INSERT INTO Products (name, price) VALUES ('Delete Product', 10) RETURNING product_id`
      );
      productId = result.rows[0].product_id;
    });

    it('should delete product when admin', async () => {
      const res = await request(app)
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/);
    });

    it('should reject delete without admin', async () => {
      const res = await request(app)
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should 404 deleting non-existent product', async () => {
      const res = await request(app)
        .delete(`/products/999999`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

});
