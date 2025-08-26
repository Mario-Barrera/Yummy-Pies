const request = require('supertest');
const app = require('../app'); // Your Express app
const pool = require('../db/client');
const jwt = require('jsonwebtoken');

// Generate valid JWT tokens for tests (replace secret with your env variable)
const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

// Helper to generate JWT token for user/admin
function generateToken(role = 'user') {
  return jwt.sign({ user_id: 1, username: 'testuser', role }, JWT_SECRET, {
    expiresIn: '1h',
  });
}

describe('Payments API', () => {
  let userToken;
  let adminToken;
  let createdPaymentId;

  beforeAll(() => {
    // Generate tokens
    userToken = generateToken('user');
    adminToken = generateToken('admin');
  });

  afterAll(async () => {
    // Clean up: Delete test payment if exists
    if (createdPaymentId) {
      await pool.query('DELETE FROM Payments WHERE payment_id = $1', [createdPaymentId]);
    }
    await pool.end();
  });

  // POST /payments - create payment
  describe('POST /payments', () => {
    it('should create a new payment with valid data', async () => {
      const response = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: 1,
          transaction_id: 'txn_test_123',
          amount: 99.99,
          method: 'Credit',
          status: 'Pending',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('payment_id');
      expect(response.body.amount).toBe('99.99'); // amount is decimal string from DB
      createdPaymentId = response.body.payment_id;
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // missing transaction_id
          order_id: 1,
          amount: 10,
          method: 'Credit',
          status: 'Pending',
        });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toMatch(/Missing required payment fields/);
    });

    it('should reject invalid payment method', async () => {
      const response = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: 1,
          transaction_id: 'txn_invalid_method',
          amount: 20,
          method: 'Cash', // invalid
          status: 'Pending',
        });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toMatch(/Invalid payment method/);
    });

    it('should reject invalid payment status', async () => {
      const response = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: 1,
          transaction_id: 'txn_invalid_status',
          amount: 20,
          method: 'Credit',
          status: 'Unknown',
        });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toMatch(/Invalid payment status/);
    });

    it('should reject negative amount', async () => {
      const response = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: 1,
          transaction_id: 'txn_negative_amount',
          amount: -10,
          method: 'Credit',
          status: 'Pending',
        });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toMatch(/Invalid payment amount/);
    });

    it('should reject requests without a token', async () => {
      const response = await request(app).post('/payments').send({
        order_id: 1,
        transaction_id: 'txn_no_token',
        amount: 10,
        method: 'Credit',
        status: 'Pending',
      });
      expect(response.statusCode).toBe(401);
    });
  });

  // GET /payments/:id - get payment by ID
  describe('GET /payments/:id', () => {
    it('should return the payment for a valid ID', async () => {
      if (!createdPaymentId) return;

      const response = await request(app)
        .get(`/payments/${createdPaymentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('payment_id', createdPaymentId);
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .get('/payments/999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(404);
    });

    it('should reject unauthorized requests', async () => {
      const response = await request(app).get(`/payments/${createdPaymentId}`);
      expect(response.statusCode).toBe(401);
    });
  });

  // Admin-only GET /payments - get all payments with filters
  describe('GET /payments', () => {
    it('should forbid non-admin users', async () => {
      const response = await request(app)
        .get('/payments')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.error).toMatch(/Forbidden/);
    });

    it('should allow admin to fetch payments', async () => {
      const response = await request(app)
        .get('/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow filtering by status', async () => {
      const response = await request(app)
        .get('/payments?status=Pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      response.body.forEach(payment => {
        expect(payment.status).toBe('Pending');
      });
    });
  });

  // Admin-only PUT /payments/:id - update payment status
  describe('PUT /payments/:id', () => {
    it('should forbid non-admin users', async () => {
      const response = await request(app)
        .put(`/payments/${createdPaymentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'Completed' });

      expect(response.statusCode).toBe(403);
    });

    it('should update status for admin users', async () => {
      const response = await request(app)
        .put(`/payments/${createdPaymentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Completed' });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('Completed');
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .put(`/payments/${createdPaymentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'InvalidStatus' });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toMatch(/Invalid or missing status/);
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .put('/payments/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Completed' });

      expect(response.statusCode).toBe(404);
    });
  });

  // Admin-only DELETE /payments/:id - delete payment
  describe('DELETE /payments/:id', () => {
    it('should forbid non-admin users', async () => {
      const response = await request(app)
        .delete(`/payments/${createdPaymentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(403);
    });

    it('should delete payment for admin users', async () => {
      // First create a payment to delete
      const createResponse = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          order_id: 1,
          transaction_id: `txn_delete_${Date.now()}`,
          amount: 10,
          method: 'Debit',
          status: 'Pending',
        });

      const paymentIdToDelete = createResponse.body.payment_id;

      const response = await request(app)
        .delete(`/payments/${paymentIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toMatch(/deleted successfully/);
    });

    it('should return 404 when deleting non-existent payment', async () => {
      const response = await request(app)
        .delete('/payments/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
    });
  });
});
