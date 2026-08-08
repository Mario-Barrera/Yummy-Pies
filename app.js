require('dotenv').config();                               

const express = require('express');                        

const authRoutes = require('./routes/auth');   
const commentRoutes = require('./routes/comments');  
const orderRoutes = require('./routes/orders');              
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

const errorHandler = require('./middleware/errorHandler');         

const app = express(); 

// Parse incoming JSON request bodies.
app.use(express.json());

// Parse URL-encoded form data.
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public folder.
app.use(express.static('public'));

// Mount API routes.
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Health-check endpoint.
app.get('/api/health', function (req, res) {
  res.json({ 
    status: 'ok' 
  });
});

// Handle requests that do not match an existing route.
app.use(function (req, res, next) {
  if (req.originalUrl.startsWith("/.well-known/")) {
    return res.status(404);
  }

  console.log("UNMATCHED REQUEST:", req.method, req.originalUrl);

  const err = new Error("Route not found");
  err.status = 404;
  next(err);
});

// Centralized error handler.
app.use(errorHandler);

module.exports = app;
