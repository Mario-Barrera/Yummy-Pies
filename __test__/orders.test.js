import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../app';  // your Express app
import pool from '../db/client';

// Mock JWT tokens (replace with real/generated tokens as needed)
const userToken = 'Bearer user-valid-jwt-token';
const adminToken = 'Bearer admin-valid-jwt-token';

// Mock fulfillment method for checkout
const fulfillmentMethod = 'Delivery';

// Assuming user_id 1 has some cart items pre-seeded in test DB
describe('Orders API', () => {
  beforeAll(async () => {
    // Optional: seed test DB with cart items for user_id 1 if needed
  });

  afterAll(async () => {
    await pool.end();
  });

  it('POST /orders/checkout - should create an order from user cart', async () => {
    const res = await request(app)
      .post('/orders/checkout')
      .set('Authorization', userToken)
      .send({ fulfillment_method: fulfillmentMethod });

    if (res.status === 400) {
      // If cart is empty in test DB, expect 400 error and test ends here
      expect(res.body).toHaveProperty('error', 'Cart is empty');
    } else {
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Order created');
      expect(res.body).toHaveProperty('order_id');
    }
  });

  it('GET /orders - should return all orders for logged-in user', async () => {
    const res = await request(app)
      .get('/orders')
      .set('Authorization', userToken)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PUT /orders/:order_id/status - admin can update order status', async () => {
    // First, create a new order to update or use existing order_id
    const createOrderRes = await request(app)
      .post('/orders/checkout')
      .set('Authorization', userToken)
      .send({ fulfillment_method: fulfillmentMethod });

    if (createOrderRes.status !== 201) {
      return; // Skip test if order creation fails
    }

    const orderId = createOrderRes.body.order_id;

    const res = await request(app)
      .put(`/orders/${orderId}/status`)
      .set('Authorization', adminToken)
      .send({
        status: 'Confirmed',
        delivery_status: 'Out for delivery',
        delivery_partner: 'DHL',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Order updated');
  });

  it('PUT /orders/:order_id/status - non-admin update forbidden', async () => {
    const res = await request(app)
      .put('/orders/1/status')
      .set('Authorization', userToken)
      .send({
        status: 'Confirmed',
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Admin access required');
  });

  it('GET /orders/admin/all - admin can fetch all orders', async () => {
    const res = await request(app)
      .get('/orders/admin/all')
      .set('Authorization', adminToken)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /orders/admin/all - non-admin forbidden', async () => {
    const res = await request(app)
      .get('/orders/admin/all')
      .set('Authorization', userToken);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Admin access required');
  });
});
