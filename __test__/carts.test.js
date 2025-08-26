const request = require('supertest');
const app = require('../app');
const pool = require('../db/client');
const jwt = require('jsonwebtoken');

require('dotenv').config();

describe('Cart Routes', () => {
  let user;
  let token;
  let product;

  beforeAll(async () => {
    // Clean up tables
    await pool.query('DELETE FROM Cart_Items');
    await pool.query('DELETE FROM Products');
    await pool.query('DELETE FROM Users');

    // Create a test user
    const userRes = await pool.query(
      `INSERT INTO Users (name, email, password, address, phone)
       VALUES ('Cart Tester', 'cart@example.com', 'hashedpass', '123 Test Lane', '1234567890')
       RETURNING user_id, name, email`
    );
    user = userRes.rows[0];

    // Sign JWT
    token = jwt.sign({ user_id: user.user_id, email: user.email, role: 'customer' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Create a test product
    const productRes = await pool.query(
      `INSERT INTO Products (name, description, price, stock_quantity)
       VALUES ('Test Pie', 'Delicious pie', 9.99, 10)
       RETURNING *`
    );
    product = productRes.rows[0];
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /carts', () => {
    it('should add a product to the cart', async () => {
      const res = await request(app)
        .post('/carts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product_id: product.product_id,
          quantity: 2,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('cart_item_id');
      expect(res.body[0].product_id).toBe(product.product_id);
      expect(res.body[0].quantity).toBe(2);
      expect(res.body[0].price_at_purchase).toBe(product.price.toString()); // prices returned as strings
    });

    it('should update quantity if same product is added again', async () => {
      const res = await request(app)
        .post('/carts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product_id: product.product_id,
          quantity: 3,
        });

      expect(res.statusCode).toBe(201);
      const cartItem = res.body.find((item) => item.product_id === product.product_id);
      expect(cartItem.quantity).toBe(5); // 2 + 3
    });

    it('should reject missing or invalid quantity', async () => {
      const res = await request(app)
        .post('/carts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product_id: product.product_id,
          quantity: 0,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/invalid product_id or quantity/i);
    });

    it('should reject if product does not exist', async () => {
      const res = await request(app)
        .post('/carts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product_id: 999999,
          quantity: 1,
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/product not found/i);
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app).post('/carts').send({
        product_id: product.product_id,
        quantity: 1,
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/no token provided/i);
    });
  });

  describe('GET /carts', () => {
    it('should fetch the current user\'s cart', async () => {
      const res = await request(app)
        .get('/carts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('product_id');
      expect(res.body[0]).toHaveProperty('quantity');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('price');
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app).get('/carts');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/no token provided/i);
    });
  });
});
