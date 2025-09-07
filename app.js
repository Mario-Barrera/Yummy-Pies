require('dotenv').config();             // Loads environment variables from .env
const express = require('express');     // Loads the Express library
const session = require('express-session');
const app = express();                  // Initializes an Express application

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from "public" BEFORE routes
app.use(express.static('public'));

// This sets up the session middleware properly
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));


// Import routes
// Must exactly match the file path and file name
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const orderItemsRouter = require('./routes/order-Items');
const cartItemsRouter = require('./routes/cart-items');
const paymentsRouter = require('./routes/payments');
const reviewsRouter = require('./routes/reviews');
const reviewCommentsRouter = require('./routes/reviewComments');
const resetPasswordRouter = require('./routes/reset-password');
const userRoutes = require('./routes/users');
const errorHandler = require('./middleware/errorHandler');
const cateringRoutes = require('./routes/catering');

// Mount routes
// api/ prefix (optional, but recommended)
// frontend file must call the correct backend URL (for example, fetch('/api/review-comments')
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/order-items', orderItemsRouter);
app.use('/api/cart-items', cartItemsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/review-comments', reviewCommentsRouter);
app.use('/api/reset-password', resetPasswordRouter);
app.use('/api/users', userRoutes);
app.use('/api', cateringRoutes);


// Route to check session status
// But does not create or set a session
app.get('/api/user-status', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// Health check route
// Verifies that your backend server is running and reachable
// Temporarily to test server
app.get('/', (req, res) => res.json({ message: 'API running' }));


// 404 handler for unknown routes
// If no routes are matched before this point, return a proper 404 JSON response
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


// Centralized error handler must come last
app.use(errorHandler);

// Start the server on a port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
