require('dotenv').config();                               // loads the dotenv library, which then loads the environment variables from the .env file into the process.env  process.env is a global configuration object provided by Node

const express = require('express');                        // Loads the Express package from node_modules
const session = require('express-session');                // Session middleware for server-side authentication, Imported from node_modules/express-session/

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

// Configure and register session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,                               // Secret used to sign and verify the session ID cookie
  name: 'sid',                                                      // Cookie name that stores the session ID (instead of default "connect.sid")
  resave: false,                                                    // Prevent unnecessary session rewrites
  saveUninitialized: false,                                         // Do not create session until something is stored in it
  cookie: {                                                     
    secure: process.env.NODE_ENV === 'production',                  // Send cookie only over HTTPS in production      
    httpOnly: true,                                                 // Prevent client-side JavaScript from accessing the cookie
    sameSite: 'lax'                                                 // Helps protect against CSRF (Cross-Site Request Forgery) attacks
  }
}));

// Mount routes, meaning: connects route modules into the main app
// api/ prefix (optional, but recommended)
// frontend file must call the correct backend URL
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-Items', orderItemRoutes);
app.use('/api/cart-Items', cartItemRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catering', cateringRoutes);

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
