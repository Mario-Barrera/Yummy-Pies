require('dotenv').config();                               // loads the dotenv library, which then loads the environment variables from the .env file into the process.env  process.env is a global configuration object provided by Node

const express = require('express');                        // Loads the Express package from node_modules

// Import route modules from the routes directory
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const orderItemRoutes = require('./routes/order-Items');
const cartItemRoutes = require('./routes/cart-Items');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const cateringRoutes = require('./routes/catering');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();                                    // Initializes an Express application, Calling the exported function,
/* So app becomes a function that handles HTTP requests, with methods attached like:
    app.use
    app.get
    app.post
    app.listen
*/

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
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/cart-items', cartItemRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catering', cateringRoutes);

// Health check route
// Verifies that your backend server is running and reachable
app.get('/api/health', function (req, res) {
  res.json({ 
    status: 'ok' 
  });
});

// 404 handler for unknown routes
app.use(function (req, res, next) {
  const err = new Error('Route not found');
  err.status = 404;
  next(err);
});

app.use(errorHandler);

module.exports = app;
