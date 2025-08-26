// __test__/server.test.js
import request from "supertest";
import app from "../app.js"; // import the test-friendly app
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import db from "../db/client.js";

let token;
let userId;

describe("User routes", () => {
  beforeAll(async () => {
    // Clean up any old test user
    await db.query("DELETE FROM Users WHERE email = $1", ["test@example.com"]);
  });

  afterAll(async () => {
    // Close DB connection when tests are done
    await db.end();
  });

  it("should register a new user", async () => {
    const res = await request(app).post("/users/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      address: "123 Main St",
      phone: "555-1234",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("user_id");
    expect(res.body).toHaveProperty("name", "Test User");
    expect(res.body).toHaveProperty("email", "test@example.com");
    expect(res.body).toHaveProperty("role"); // should default to 'customer'
    userId = res.body.user_id;
  });

  it("should login and return a token with user info", async () => {
    const res = await request(app).post("/users/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toMatchObject({
      user_id: userId,
      name: "Test User",
      email: "test@example.com",
      role: "customer",
    });

    token = res.body.token;
  });

  it("should fetch user profile by id (requires token)", async () => {
    const res = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user_id", userId);
    expect(res.body).toHaveProperty("name", "Test User");
    expect(res.body).toHaveProperty("email", "test@example.com");
    expect(res.body).toHaveProperty("address", "123 Main St");
    expect(res.body).toHaveProperty("phone", "555-1234");
    expect(res.body).toHaveProperty("role", "customer");
    expect(res.body).toHaveProperty("created_at");
    expect(res.body).not.toHaveProperty("password");
  });

  it("should logout and invalidate token", async () => {
    const res = await request(app)
      .post("/users/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Logged out successfully (token invalidated)");

    // Try accessing profile again with the same token (should fail)
    const res2 = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res2.statusCode).toBe(401); // Unauthorized after logout
  });
});
