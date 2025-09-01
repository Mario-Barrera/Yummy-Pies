require('dotenv').config();
const express = require('express');
const app = express();

// Middleware
app.use(express.json()); // parse JSON bodies

// Serve static files from "public" BEFORE routes
app.use(express.static('public'));

// Import routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');     // uncomment when ready
const orderItemsRouter = require('./routes/order-Items');
const cartItemsRouter = require('./routes/cart-Items');
const paymentsRouter = require('./routes/payments');
const reviewsRouter = require('./routes/reviews');
const reviewCommentsRouter = require('./routes/reviewComments');
const resetPasswordRouter = require('./routes/reset-password');


// Mount routes
app.use('/auth', authRoutes);
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
app.use('/order-items', orderItemsRouter);
app.use('/cart-items', cartItemsRouter);
app.use('/payments', paymentsRouter);
app.use('/reviews', reviewsRouter);
app.use('/review-comments', reviewCommentsRouter);
app.use('/reset-password', resetPasswordRouter);


// Health check route
app.get('/', (req, res) => res.json({ message: 'API running' })); // temporarily to test server

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// General error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
