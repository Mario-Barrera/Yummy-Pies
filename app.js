//This file builds our entire backend server. It doesn’t do the business logic itself—it connects all the pieces together: routes, middleware, and error handling.

require('dotenv').config();                               // Environment setup (configuration)

const express = require('express');                        // Loads the Express package from node_modules, Importing Express (the server engine)

// Import route modules from the routes directory
const authRoutes = require('./routes/auth');                   // From this file’s folder, go into routes, then load auth.js
const statusRoutes = require('./routes/user-status');
const reviewRoutes = require('./routes/reviews');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');

// Import middleware
const errorHandler = require('./middleware/errorHandler');         // Middleware import (error handling system)

const app = express();                                    // Initializes an Express application, Calling the exported function

// Converts JSON request body into a JavaScript object (req.body)
app.use(express.json());

// Middleware to parse URL-encoded form data (from HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve static files from "public" BEFORE routes
app.use(express.static('public'));

// Mount routes, meaning: connects route modules into the main app
// api/ prefix (optional, but recommended)
// frontend file must call the correct backend URL
app.use('/api/auth', authRoutes);
app.use('/api/user-status', statusRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Health check route
// Verifies that your backend server is running and reachable
app.get('/api/health', function (req, res) {
  res.json({ 
    status: 'ok' 
  });
});

// To catch requests that did not match any route and forward a 404 error to the centralized error handler
app.use(function (req, res, next) {
  if (req.originalUrl.startsWith("/.well-known/")) {
    return res.status(404);
  }

  console.log("UNMATCHED REQUEST:", req.method, req.originalUrl);

  const err = new Error("Route not found");
  err.status = 404;
  next(err);
});

// Register (aka: activate) the imported function as Express middleware.
// When an error happens, send it to the errorHandler middleware.
app.use(errorHandler);

module.exports = app;
