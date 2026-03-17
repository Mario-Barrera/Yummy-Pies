const express = require('express');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// --------------- Helper function to group order items by order ---------------

function groupOrders(rows) {
    const orders = new Map();

    for (const row of rows) {
       let order = orders.get(row.order_id);

       // if the order_id has not been seen yet, create a new order object
       if (!order) {
        order = {
            order_id: row.order_id,
            order_date: row.order_date,
            status: row.status,
            total_amount: row.total_amount,
            fulfillment_method: row.fulfillment_method,
            delivery_partner: row.delivery_partner,
            delivery_reference: row.delivery_reference,
            delivery_status: row.delivery_status,
            estimated_delivery: row.estimated_delivery,
            pickup_time: row.pickup_time,
            created_at: row.created_at,
            items: []
        };

        orders.set(row.order_id, order);                                   // adds the order object into Map
       }

       if (row.order_item_id) {                                           // if the row contains a valid order item, add it to the order's item array
        order.items.push({
            order_item_id: row.order_item_id,
            product_id: row.product_id,
            product_name: row.product_name || "Unknown product",
            quantity: row.quantity,
            price_at_purchase: row.price_at_purchase
        });
       }
    }

    return [...orders.values()];                                    // convert Map values into an array
}

// --------------- Get logged-in user's order history ---------------

router.get("/my-orders", requireAuth, async function (req, res, next) {

   try {
    const userId = req.user.user_id;

    const { rows } = await db.query(
        `SELECT
          o.order_id,
          o.order_date,
          o.user_id,
          o.status,
          o.total_amount,
          o.fulfillment_method,
          o.delivery_partner,
          o.delivery_reference,
          o.delivery_status,
          o.estimated_delivery,
          o.pickup_time,
          o.created_at,
          oi.order_item_id,
          oi.product_id,
          oi.quantity,
          oi.price_at_purchase,
          p.name AS product_name
        FROM orders o
        LEFT JOIN order_items oi
            ON o.order_id = oi.order_id
        LEFT JOIN products p
            ON oi.product_id = p.product_id
        WHERE o.user_id = $1
        ORDER BY o.order_date DESC, o.order_id DESC, oi.order_item_id ASC;
        `,
        [userId]
    );

    const orders = groupOrders(rows);

    res.json({ orders});

   } catch (err) {
        return next(err);
   }
});

module.exports = router;