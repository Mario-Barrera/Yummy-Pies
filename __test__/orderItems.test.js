import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import orderItemsRouter from '../routes/orderItems';
import pool from '../db/client';

vi.mock('../middleware/authenticateToken', () => {
  return function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'No token' });
    }
    if (authHeader === 'Bearer admin') {
      req.user = { user_id: 1, role: 'admin' };
    } else if (authHeader.startsWith('Bearer user:')) {
      req.user = { user_id: Number(authHeader.split(':')[1]), role: 'user' };
    } else {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next();
  };
});

const app = express();
app.use(express.json());
app.use('/order-items', orderItemsRouter);

describe('Order Items API', () => {
  let testOrderId;
  let testProductId;
  let testOrderItemId;

  beforeAll(async function setupData() {
    // Insert product
    const productResult = await pool.query(
      `INSERT INTO Products (name, price) VALUES ('Test Product', 9.99) RETURNING product_id`
    );
    testProductId = productResult.rows[0].product_id;

    // Insert order for user_id=2
    const orderResult = await pool.query(
      `INSERT INTO Orders (user_id, status) VALUES (2, 'pending') RETURNING order_id`
    );
    testOrderId = orderResult.rows[0].order_id;
  });

  afterAll(async function cleanupData() {
    await pool.query('DELETE FROM Order_Items');
    await pool.query('DELETE FROM Orders WHERE order_id = $1', [testOrderId]);
    await pool.query('DELETE FROM Products WHERE product_id = $1', [testProductId]);

    await pool.end();
  });

  test('GET /order-items/order/:order_id denies without token', async function noToken() {
    const res = await request(app).get(`/order-items/order/${testOrderId}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token');
  });

  test('GET /order-items/order/:order_id returns 404 if order missing', async function missingOrder() {
    const res = await request(app)
      .get('/order-items/order/999999')
      .set('Authorization', 'Bearer admin');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Order not found');
  });

  test('GET /order-items/order/:order_id allows admin', async function adminAccess() {
    const res = await request(app)
      .get(`/order-items/order/${testOrderId}`)
      .set('Authorization', 'Bearer admin');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /order-items/order/:order_id allows order owner', async function ownerAccess() {
    const res = await request(app)
      .get(`/order-items/order/${testOrderId}`)
      .set('Authorization', 'Bearer user:2');
    expect(res.status).toBe(200);
  });

  test('GET /order-items/order/:order_id denies others', async function denyOthers() {
    const res = await request(app)
      .get(`/order-items/order/${testOrderId}`)
      .set('Authorization', 'Bearer user:999');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Access denied');
  });

  test('POST /order-items rejects non-admin', async function postRejectNonAdmin() {
    const res = await request(app)
      .post('/order-items')
      .set('Authorization', 'Bearer user:2')
      .send({
        order_id: testOrderId,
        product_id: testProductId,
        quantity: 1,
        price_at_purchase: 9.99,
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Admin access required');
  });

  test('POST /order-items rejects missing fields', async function postMissingFields() {
    const res = await request(app)
      .post('/order-items')
      .set('Authorization', 'Bearer admin')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing required fields');
  });

  test('POST /order-items rejects invalid quantity/price', async function postInvalidData() {
    const res = await request(app)
      .post('/order-items')
      .set('Authorization', 'Bearer admin')
      .send({
        order_id: testOrderId,
        product_id: testProductId,
        quantity: 0,
        price_at_purchase: -1,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid quantity or price');
  });

  test('POST /order-items creates new item', async function postCreateItem() {
    const res = await request(app)
      .post('/order-items')
      .set('Authorization', 'Bearer admin')
      .send({
        order_id: testOrderId,
        product_id: testProductId,
        quantity: 2,
        price_at_purchase: 9.99,
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('order_item_id');
    testOrderItemId = res.body.order_item_id;
  });

  test('PUT /order-items/:id rejects non-admin', async function putRejectNonAdmin() {
    const res = await request(app)
      .put(`/order-items/${testOrderItemId}`)
      .set('Authorization', 'Bearer user:2')
      .send({ quantity: 3 });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Admin access required');
  });

  test('PUT /order-items/:id rejects invalid update', async function putInvalidUpdate() {
    const res = await request(app)
      .put(`/order-items/${testOrderItemId}`)
      .set('Authorization', 'Bearer admin')
      .send({ quantity: 0, price_at_purchase: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid quantity or price');
  });

  test('PUT /order-items/:id updates order item', async function putUpdateItem() {
    const res = await request(app)
      .put(`/order-items/${testOrderItemId}`)
      .set('Authorization', 'Bearer admin')
      .send({ quantity: 5 });
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(5);
  });

  test('PUT /order-items/:id returns 404 if not found', async function putNotFound() {
    const res = await request(app)
      .put('/order-items/999999')
      .set('Authorization', 'Bearer admin')
      .send({ quantity: 1 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Order item not found');
  });

  test('DELETE /order-items/:id rejects non-admin', async function deleteRejectNonAdmin() {
    const res = await request(app)
      .delete(`/order-items/${testOrderItemId}`)
      .set('Authorization', 'Bearer user:2');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Admin access required');
  });

  test('DELETE /order-items/:id deletes order item', async function deleteItem() {
    const res = await request(app)
      .delete(`/order-items/${testOrderItemId}`)
      .set('Authorization', 'Bearer admin');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Order item deleted successfully');
  });

  test('DELETE /order-items/:id returns 404 if not found', async function deleteNotFound() {
    const res = await request(app)
      .delete(`/order-items/${testOrderItemId}`)
      .set('Authorization', 'Bearer admin');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Order item not found');
  });
});
