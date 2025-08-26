const express = require('express');
require('dotenv').config();

const app = express();
const logger = require('./utils/logger');


// Middleware
app.use(express.json());


// Routers
const usersRouter = require('./routes/users');
const ordersRouter = require('./routes/orders');
const productsRouter = require('./routes/products');
const cartRouter = require('./routes/carts');
const authRouter = require('./routes/auth');

app.use('/users', usersRouter);
app.use('/orders', ordersRouter);
app.use('/products', productsRouter);
app.use('/cart', cartRouter);
app.use('/api/auth', authRouter);


// Health check route
// Responds with a simple message to confirm the API is running
app.get('/health', (req, res) => {
  res.send('E-commerce API running');
});


// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


// General error handler
const errorHandler = require('./errorHandler');
app.use(errorHandler);


if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
