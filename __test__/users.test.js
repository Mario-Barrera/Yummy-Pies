const request = require('supertest');
const app = require('../app'); // Express app entry point
const pool = require('../db/client');
const jwt = require('jsonwebtoken');

require('dotenv').config();

describe('Users Routes', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Clean Users and tokenblacklist table before tests
    await pool.query('DELETE FROM tokenblacklist');
    await pool.query('DELETE FROM Users');
  });

  afterAll(async () => {
    await pool.end();
  });

  // REGISTER TESTS
  describe('POST /users/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({
          name: 'Test User',
          email: 'testuser@example.com',
          password: 'Password123!', // satisfies validator
          address: '123 Main St',
          phone: '555-1234',
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('user_id');
      expect(res.body.email).toBe('testuser@example.com');
      expect(res.body.role).toBe('customer');  // default role from DB
      
      testUser = res.body; // save for later tests
    });

    it('should reject registration with invalid password', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({
          name: 'Bad Password',
          email: 'badpass@example.com',
          password: 'short', // fails validator
          address: '',
          phone: ''
        });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/Password must be at least/);
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({
          name: 'Test User 2',
          email: 'testuser@example.com', // duplicate email
          password: 'Password123!',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Email already registered');
    });
  });

  // LOGIN TESTS
  describe('POST /users/login', () => {
    it('should login with correct credentials and return token', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password123!',
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('testuser@example.com');
      
      authToken = res.body.token;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPass123!',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should reject login for unknown email', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'unknown@example.com',
          password: 'Password123!',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid email or password');
    });
  });

  // GET PROFILE TESTS
  describe('GET /users/:id', () => {
    it('should fetch the user profile when authorized', async () => {
      const res = await request(app)
        .get(`/users/${testUser.user_id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body).toHaveProperty('created_at');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should reject fetching profile of another user if not admin', async () => {
      const res = await request(app)
        .get(`/users/${testUser.user_id + 1}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('should return 404 for non-existing user', async () => {
      const res = await request(app)
        .get('/users/999999')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
  });

  // LOGOUT TESTS
  describe('POST /users/logout', () => {
    it('should logout and blacklist the token', async () => {
      const res = await request(app)
        .post('/users/logout')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/Logged out successfully/);

      // Token should be invalidated
      const failRes = await request(app)
        .get(`/users/${testUser.user_id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(failRes.statusCode).toBe(401);
      expect(failRes.body.error).toMatch(/invalid/i);
    });
  });
});

