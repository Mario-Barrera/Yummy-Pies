const express = require('express');
const pool = require('../db/client');   
const logger = require('../utils/logger');       
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();


// GET all orders (admin only)
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*, u.name AS customer_name, u.email AS customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      ORDER BY o.order_date DESC
    `);
    res.json(rows);
  } catch (err) {
    logger.error(`Error fetching all orders: ${err.stack || err.message}`);
    next(err);  // pass to centralized error handler
  }
});


// GET orders for the logged-in user
router.get('/my-orders', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY order_date DESC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    logger.error(`Error fetching user orders: ${err.stack || err.message}`);
    next(err);
  }
});


router.get('/my-orders-with-items', requireAuth, async (req, res, next) => {
  const userId = req.user.user_id;

  try {
    const { rows } = await pool.query(`
      SELECT
        o.order_id,
        o.order_date,
        o.status,
        o.total_amount,
        o.fulfillment_method,
        o.delivery_partner,
        o.delivery_reference,
        o.delivery_status,
        o.estimated_delivery,
        o.created_at,
        u.email,
        oi.product_id,
        p.name AS product_name,
        oi.quantity
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN users u ON o.user_id = u.user_id
      WHERE o.user_id = $1
      ORDER BY o.order_date DESC, o.order_id, oi.product_id
    `, [userId]);

    const ordersMap = new Map();

    rows.forEach(row => {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          order_date: row.order_date,
          status: row.status,
          total_amount: row.total_amount !== null && row.total_amount !== undefined
            ? parseFloat(row.total_amount)
            : 0,
          fulfillment_method: row.fulfillment_method,
          delivery_partner: row.delivery_partner,
          delivery_reference: row.delivery_reference,
          delivery_status: row.delivery_status,
          estimated_delivery: row.estimated_delivery,
          created_at: row.created_at,
          email: row.email,
          items: []
        });
      }

      ordersMap.get(row.order_id).items.push({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: row.quantity
      });
    });


    const orders = Array.from(ordersMap.values());

    res.json(orders);

  } catch (err) {
    logger.error(`Error fetching orders with items: ${err.stack || err.message}`);
    next(err);
  }
});



// GET single order by ID (admin or owner)
router.get('/:id', requireAuth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE order_id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = rows[0];
    if (req.user.role !== 'admin' && order.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (err) {
    logger.error(`Error fetching single order ID ${id}: ${err.stack || err.message}`);
    next(err);
  }
});


// POST create a new order
router.post('/', requireAuth, async (req, res, next) => {
  const { items, fulfillment_method, delivery_partner } = req.body; 
  // items = [{ product_id, quantity, price_at_purchase }]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  try {
    // Insert order with total_amount initially 0, update later
    const { rows: orderRows } = await pool.query(
      `INSERT INTO orders (user_id, status, fulfillment_method, delivery_partner, total_amount)
       VALUES ($1, 'Pending', $2, $3, 0) RETURNING *`,
      [req.user.user_id, fulfillment_method, delivery_partner || null]
    );
    const order = orderRows[0];

    // Insert order items and calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      const { product_id, quantity, price_at_purchase } = item;

      if (!product_id || !quantity || !price_at_purchase) {
        return res.status(400).json({ error: 'Invalid item in order' });
      }

      totalAmount += price_at_purchase * quantity;

      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [order.order_id, product_id, quantity, price_at_purchase]
      );
    }

    // Update order with total amount
    const { rows: updatedRows } = await pool.query(
      'UPDATE orders SET total_amount = $1 WHERE order_id = $2 RETURNING *',
      [totalAmount, order.order_id]
    );

    res.status(201).json(updatedRows[0]);
  } catch (err) {
    logger.error(`Error creating new order: ${err.stack || err.message}`);
    next(err);
  }
});


// POST /api/orders/place
router.post("/place", requireAuth, async (req, res) => {
  const form = req.body;

  try {
    // Build values
    const name = `${form.firstName} ${form.lastName}`.trim();
    const address = `${form.address1} ${form.address2}`.trim();

    const rawCardType = form.ccType?.trim().trim();
    
    // Normalize card brand to method type
    const brandToMethodMap = {
      visa: "Credit",
      mastercard: "Credit",
      "american-express": "Credit",
      discover: "Credit",
      // Add more if needed
    };

    const method = brandToMethodMap[rawCardType];

    if (!method) {
      return res.status(400).json({
      success: false,
      message: "Invalid payment method. Must be a recognized credit or debit card brand."
    });
  }

    const fulfillment_method = form.pickupChecked ? "Pickup" : "Delivery";

    const total_amount = form.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const estimated_delivery = fulfillment_method === "Delivery" ? form.deliveryDate : form.pickupDate;
    const delivery_partner = fulfillment_method === "Delivery" ? "UberEats" : null;
    const delivery_reference = fulfillment_method === "Delivery"
      ? "UE" + Math.floor(1000000000 + Math.random() * 9000000000)
      : null;
    const delivery_status = fulfillment_method === "Delivery" ? "Out for delivery" : "Not applicable";

    const email = form.email?.trim(); // Add safety check

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = req.session.user || {}; // or pull from JWT if needed
    const user_id = user.user_id;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "User ID is missing from session." });
    }   

    const status = "Pending"; 

    // Insert into orders table
    const orderResult = await pool.query(
      `INSERT INTO orders (
        user_id,
        email,
        total_amount,
        fulfillment_method,
        delivery_partner,
        delivery_reference,
        estimated_delivery,
        delivery_status,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING order_id`,
      [
        user_id,
        email,
        total_amount,
        fulfillment_method,
        delivery_partner,
        delivery_reference,
        estimated_delivery,
        delivery_status,
        status
      ]
    );

    const order_id = orderResult.rows[0].order_id;

    // Generate a transaction ID and set payment details
    const transactionId = "TX" + Math.floor(1000000000 + Math.random() * 9000000000);
    const amount = total_amount;

    await pool.query(
      `INSERT INTO payments (
        order_id,
        transaction_id,
        amount,
        status,
        method,
        user_id,
        cc_number,
        ccv,
        exp_month,
        exp_year
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        order_id,
        transactionId,
        amount,
        status,
        method,
        user_id,
        form.ccNumber,
        form.ccv,
        form.expMonth,
        form.expYear
      ]
    );


    // Insert items into order_items table
   for (const item of form.cart) {
    console.log("Received item:", item);

    const { product_id, qty: quantity, price } = item;

    console.log("product_id:", product_id);
    console.log("quantity:", quantity);
    console.log("price:", price);

    if (product_id == null || quantity == null || price == null) {
      return res.status(400).json({
      success: false,
      message: "Invalid item in cart: product_id, quantity, and price are required.",
      item
    });
  }

  await pool.query(
    `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
     VALUES ($1, $2, $3, $4)`,
    [order_id, product_id, quantity, price]
  );
}
    
    const confirmationNumber = "CN" + Math.floor(100000 + Math.random() * 900000);

    res.status(200).json({
      success: true,
      confirmationNumber,
      orderId: order_id
    });

  } catch (err) {
    console.error("Order placement error caught:", {
        message: err.message,
        stack: err.stack,
        code: err.code,
        detail: err.detail,
        constraint: err.constraint,
    });

    res.status(500).json({
        success: false,
        message: "Server error while placing order."
    });
  }
});


// PUT update order status (admin only)
router.put('/:id/status', requireAdmin, async (req, res, next) => {
  const { id } = req.params;
  const { status, delivery_status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const { rowCount, rows } = await pool.query(
      'UPDATE orders SET status = $1, delivery_status = $2 WHERE order_id = $3 RETURNING *',
      [status, delivery_status || null, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    logger.error(`Error updating order status for ID ${id}: ${err.stack || err.message}`);
    next(err);
  }
});

module.exports = router;