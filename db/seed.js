const bcrypt = require('bcrypt');
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  try {
    await client.connect();
    await client.query('BEGIN');
    console.log('Connected to DB');

    // Clear all tables before seeding
    await client.query(`
      TRUNCATE TABLE
        Review_Comments,
        Reviews,
        Order_Items,
        Payments,
        Cart_Items,
        Orders,
        Products,
        Users,
        TokenBlacklist
      RESTART IDENTITY CASCADE;
    `);

    await client.query(`ALTER SEQUENCE custom_user_id_seq RESTART WITH 1;`);


    // Pre-hash passwords
    const plainPasswords = [
      'password1','password2','password3','password4','password5',
      'password6','password7','password8','password9','password10',
      'password11','password12','password13','password14', 'adminpassword'
    ];
    const hashedPasswords = await Promise.all(
      plainPasswords.map(pw => bcrypt.hash(pw, 10))
    );

    // Insert products
    const products = [
      ['Apple Slice',3.99,20,'Slice','appleSlice',4.6],
      ['Cherry Slice',3.99,20,'Slice','cherrySlice',4.7],
      ['Blueberry Slice',3.99,20,'Slice','blueberrySlice',4.5],
      ['Pumpkin Slice',3.99,20,'Slice','pumpkinSlice',4.4],
      ['Pecan Slice',4.29,20,'Slice','pecanSlice',4.8],
      ['Chocolate Cream Slice',4.29,20,'Slice','chocolateCreamSlice',4.6],
      ['Key Lime Slice',4.29,20,'Slice','keyLimeSlice',4.5],
      ['Banana Cream Slice',4.29,20,'Slice','bananaCreamSlice',4.6],
      ['Coconut Cream Slice',4.29,20,'Slice','coconutCreamSlice',4.5],
      ['Peach Slice',3.99,20,'Slice','peachSlice',4.4],

      ['Apple Whole Pie',14.99,10,'Whole Pie','appleWhole',4.7],
      ['Cherry Whole Pie',14.99,10,'Whole Pie','cherryWhole',4.8],
      ['Blueberry Whole Pie',14.99,10,'Whole Pie','blueberryWhole',4.6],
      ['Pumpkin Whole Pie',14.99,10,'Whole Pie','pumpkinWhole',4.5],
      ['Pecan Whole Pie',16.99,10,'Whole Pie','pecanWhole',4.9],
      ['Chocolate Cream Whole Pie',16.99,10,'Whole Pie','chocolateCreamWhole',4.7],
      ['Key Lime Whole Pie',16.99,10,'Whole Pie','keyLimeWhole',4.6],
      ['Banana Cream Whole Pie',16.99,10,'Whole Pie','bananaCreamWhole',4.7],
      ['Coconut Cream Whole Pie',16.99,10,'Whole Pie','coconutCreamWhole',4.6],
      ['Peach Whole Pie',14.99,10,'Whole Pie','peachWhole',4.5],
    ];

    const productIds = [];
    for (const p of products) {
      const { rows } = await client.query(
        `INSERT INTO Products (name, price, stock_quantity, category, image_key, star_rating)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING product_id`,
        p
      );
      productIds.push(rows[0].product_id);
    }

    // Insert users
    const users = [
      ['Alice Smith','alice@example.com',hashedPasswords[0],'123 Apple St','512-555-1234','customer'],
      ['Bob Johnson','bob@example.com',hashedPasswords[1],'456 Orange Ave','512-555-5678','customer'],
      ['Charlie Brown','charlie.brown@example.com',hashedPasswords[2],'789 Peach Blvd','512-555-2345','customer'],
      ['Dana White','dana.white@example.com',hashedPasswords[3],'1010 Grape St','512-555-3456','customer'],
      ['Evelyn King','evelyn.king@example.com',hashedPasswords[4],'2020 Banana Rd','512-555-4567','customer'],
      ['Frank Castle','frank.castle@example.com',hashedPasswords[5],'3030 Cherry Ln','512-555-5678','customer'],
      ['Grace Lee','grace.lee@example.com',hashedPasswords[6],'4040 Blueberry Dr','512-555-6789','customer'],
      ['Henry Ford','henry.ford@example.com',hashedPasswords[7],'5050 Pumpkin Way','512-555-7890','customer'],
      ['Ivy Green','ivy.green@example.com',hashedPasswords[8],'6060 Lemon Ct','512-555-8901','customer'],
      ['Jack Black','jack.black@example.com',hashedPasswords[9],'7070 Pear Pkwy','512-555-9012','customer'],
      ['Karen White','karen.white@example.com',hashedPasswords[10],'8080 Plum Ave','512-555-0123','customer'],
      ['Leo King','leo.king@example.com',hashedPasswords[11],'9090 Peach Blvd','512-555-1235','customer'],
      ['Mona Lisa','mona.lisa@example.com',hashedPasswords[12],'1111 Apple Rd','512-555-2346','customer'],
      ['Nina Simone','nina.simone@example.com',hashedPasswords[13],'1212 Cherry Ln','512-555-3457','customer'],
      ['Admin User','admin@example.com',hashedPasswords[14],'999 Admin Rd','512-555-9999','admin']

    ];

    const userIds = [];
    for (const u of users) {
      const { rows } = await client.query(
        `INSERT INTO Users (name, email, password, address, phone, role)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING user_id`,
        u
      );
      userIds.push(rows[0].user_id);
    }

    function daysFromNow(days) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    }

    // Orders data
    const ordersData = [
      [userIds[3], daysFromNow(-30), 'Completed', 11.97, 'Delivery', 'Uber Eats', 'UE123456789', 'Delivered', daysFromNow(-28)],
      [userIds[4], daysFromNow(-45), 'Completed', 11.97, 'Pickup', null, null, 'Not applicable', daysFromNow(-43)],
      [userIds[5], daysFromNow(-60), 'Cancelled', 0.00, 'Delivery', 'DoorDash', 'DD0987654321', 'Cancelled', daysFromNow(-58)],
      [userIds[6], daysFromNow(-15), 'Completed', 12.57, 'Delivery', 'Uber Eats', 'UE654321987', 'Delivered', daysFromNow(-13)],
      [userIds[7], daysFromNow(-25), 'Completed', 8.58, 'Pickup', null, null, 'Not applicable', daysFromNow(-23)],         
      [userIds[8], daysFromNow(-5), 'Completed', 4.29, 'Delivery', 'Grubhub', 'GH1122334455', 'Delivered', daysFromNow(-3)], 
      [userIds[9], daysFromNow(-3), 'Completed', 8.58, 'Pickup', null, null, 'Not applicable', daysFromNow(-1)],             
      [userIds[0], daysFromNow(-10), 'Completed', 33.97, 'Delivery', 'DoorDash', 'DD5566778899', 'Delivered', daysFromNow(-8)],
      [userIds[1], daysFromNow(-20), 'Completed', 14.99, 'Pickup', null, null, 'Not applicable', daysFromNow(-18)],
      [userIds[2], daysFromNow(-8), 'Cancelled', 0.00, 'Delivery', 'Uber Eats', 'UE9988776655', 'Cancelled', daysFromNow(-6)],
      [userIds[3], daysFromNow(-13), 'Completed', 29.98, 'Pickup', null, null, 'Not applicable', daysFromNow(-11)],
      [userIds[4], daysFromNow(-35), 'Completed', 16.99, 'Delivery', 'Grubhub', 'GH2233445566', 'Delivered', daysFromNow(-33)],
      [userIds[5], daysFromNow(-22), 'Cancelled', 0.00, 'Pickup', null, null, 'Not applicable', daysFromNow(-20)],
      [userIds[6], daysFromNow(-18), 'Completed', 33.98, 'Pickup', null, null, 'Not applicable', daysFromNow(-16)],
      [userIds[7], daysFromNow(-11), 'Completed', 16.99, 'Delivery', 'DoorDash', 'DD3344556677', 'Delivered', daysFromNow(-9)],
      [userIds[8], daysFromNow(-4), 'Cancelled', 0.00, 'Delivery', 'Uber Eats', 'UE4455667788', 'Cancelled', daysFromNow(-2)],
      [userIds[9], daysFromNow(-2), 'Completed', 14.99, 'Pickup', null, null, 'Not applicable', daysFromNow(-1)],
      [userIds[2], daysFromNow(-7), 'Completed', 7.98, 'Delivery', 'Grubhub', 'GH7788990011', 'Delivered', daysFromNow(-5)],
    ];


    const orderIds = [];
    for (const o of ordersData) {
      const { rows } = await client.query(
        `INSERT INTO Orders (user_id,order_date,status,total_amount,fulfillment_method,
          delivery_partner,delivery_reference,delivery_status,estimated_delivery)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING order_id`,
        o
      );
      orderIds.push(rows[0].order_id);
    }

    // Payments
    const payments = [
      [orderIds[0],'TXN100001',11.97,'Completed','Credit'],
      [orderIds[1],'TXN100002',11.97,'Completed','Debit'],
      [orderIds[2],'TXN100003',0.00,'Cancelled','Credit'],
      [orderIds[3],'TXN100004',12.57,'Completed','Credit'], 
      [orderIds[4],'TXN100005',8.58,'Completed','Debit'], 
      [orderIds[5],'TXN100006',4.29,'Completed','Credit'], 
      [orderIds[6],'TXN100007',8.58,'Completed','Debit'], 
      [orderIds[7],'TXN100008',33.97,'Completed','Credit'],
      [orderIds[8],'TXN100009',14.99,'Completed','Credit'], 
      [orderIds[9],'TXN100010',0.00,'Cancelled','Debit'],
      [orderIds[10],'TXN100011',29.98,'Completed','Credit'], 
      [orderIds[11],'TXN100012',16.99,'Completed','Debit'],  
      [orderIds[12],'TXN100013',0.00,'Refunded','Credit'],
      [orderIds[13],'TXN100014',33.98,'Completed','Credit'], 
      [orderIds[14],'TXN100015',16.99,'Completed','Debit'], 
      [orderIds[15],'TXN100016',0.00,'Refunded','Credit'],
      [orderIds[16],'TXN100017',14.99,'Completed','Debit'], 
      [orderIds[17],'TXN100018',7.98,'Completed','Credit'],
    ];

    for (const pay of payments) {
      await client.query(
        `INSERT INTO Payments (order_id,transaction_id,amount,status,method)
         VALUES ($1,$2,$3,$4,$5)`,
        pay
      );
    }

    // Order Items - use productIds for product references
    const orderItems = [
      [orderIds[0], productIds[0], 2, 3.99],    // Apple Slice
      [orderIds[0], productIds[2], 1, 3.99],    // Blueberry Slice
      [orderIds[1], productIds[1], 2, 3.99],    // Cherry Slice
      [orderIds[1], productIds[3], 1, 3.99],    // Pumpkin Slice
      [orderIds[2], productIds[4], 2, 4.29],    // Pecan Slice (cancelled)
      [orderIds[3], productIds[0], 1, 3.99],    // Apple Slice
      [orderIds[3], productIds[5], 2, 4.29],    // Chocolate Cream Slice
      [orderIds[4], productIds[6], 3, 4.29],    // Key Lime Slice
      [orderIds[5], productIds[7], 1, 4.29],    // Banana Cream Slice
      [orderIds[6], productIds[8], 2, 4.29],    // Coconut Cream Slice
      [orderIds[7], productIds[9], 1, 3.99],    // Peach Slice
      [orderIds[7], productIds[10], 2, 14.99],  // Apple Whole Pie
      [orderIds[8], productIds[11], 1, 14.99],  // Cherry Whole Pie
      [orderIds[9], productIds[12], 1, 14.99],  // Blueberry Whole Pie (cancelled)
      [orderIds[10], productIds[13], 2, 14.99], // Pumpkin Whole Pie
      [orderIds[11], productIds[14], 1, 16.99], // Pecan Whole Pie
      [orderIds[12], productIds[15], 1, 16.99], // Chocolate Cream Whole Pie (refunded)
      [orderIds[13], productIds[16], 2, 16.99], // Key Lime Whole Pie
      [orderIds[14], productIds[17], 1, 16.99], // Banana Cream Whole Pie
      [orderIds[15], productIds[18], 2, 16.99], // Coconut Cream Whole Pie (refunded)
      [orderIds[16], productIds[19], 1, 14.99], // Peach Whole Pie
      [orderIds[17], productIds[0], 2, 3.99],   // Apple Slice
    ];

    for (const oi of orderItems) {
      await client.query(
        `INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1,$2,$3,$4)`,
        oi
      );
    }

    // Cart items
    const cartItems = [
      [userIds[0], productIds[0], 2, 3.99],
      [userIds[1], productIds[1], 1, 3.99],
      [userIds[2], productIds[2], 3, 3.99],
      [userIds[3], productIds[3], 1, 3.99],
      [userIds[4], productIds[4], 4, 4.29],
      [userIds[5], productIds[5], 2, 4.29],
      [userIds[6], productIds[6], 1, 4.29],
      [userIds[7], productIds[7], 3, 4.29],
      [userIds[8], productIds[8], 2, 4.29],
      [userIds[9], productIds[9], 1, 3.99],
    ];

    for (const ci of cartItems) {
      await client.query(
        `INSERT INTO Cart_Items (user_id, product_id, quantity, price_at_purchase)
        VALUES ($1, $2, $3, $4)`,
        ci
      );
    }


    // Reviews - use userIds and productIds
    const reviews = [
      [userIds[7], productIds[2], 5, 'Absolutely perfect!'],
      [userIds[0], productIds[0], 5, 'Flaky crust and rich filling, it was amazing!'],
      [userIds[8], productIds[3], 3, 'Not bad, just not for me.'],
      [userIds[6], productIds[1], 4, 'A bit tart, but really good.'],
      [userIds[3], productIds[0], 5, 'Amazing pie, will order again!'],
      [userIds[9], productIds[4], 4, 'Solid pie, would recommend.'],
      [userIds[4], productIds[6], 5, 'Delicious! I would buy again.'],
      [userIds[3], productIds[5], 3, 'Interesting flavor, not my favorite.'],
      [userIds[7], productIds[1], 4, 'Sweet and satisfying.'],
      [userIds[9], productIds[7], 5, 'Perfectly baked and flavorful.'],
      [userIds[4], productIds[1], 4, 'Great balance of flavors.'],
      [userIds[1], productIds[4], 4, 'Nice and fruity, not too sweet.'],
      [userIds[6], productIds[5], 4, 'Nice twist on the usual.'],
      [userIds[0], productIds[3], 4, 'I really liked it! Great quality.'],
      [userIds[5], productIds[7], 5, 'Incredible texture and taste.'],
      [userIds[8], productIds[2], 3, 'Pretty good overall.'],
      [userIds[2], productIds[0], 3, 'It was okay. I prefer something with more tartness.'],
      [userIds[4], productIds[3], 3, 'Good, but a little too rich.'],
      [userIds[1], productIds[0], 4, 'Very good pie, perfectly sweet.'],
    ];

    const reviewIds = [];
    for (const r of reviews) {
      const { rows } = await client.query(
        `INSERT INTO Reviews (user_id, product_id, rating, comment)
         VALUES ($1,$2,$3,$4)
         RETURNING review_id`,
        r
      );
      reviewIds.push(rows[0].review_id);
    }

    // Review comments
    const reviewComments = [
      [reviewIds[0], userIds[0], 'Totally agree!'],
      [reviewIds[1], userIds[1], 'Yum, I want to try that one!'],
      [reviewIds[2], userIds[2], 'I felt the same way!'],
      [reviewIds[3], userIds[3], 'Good point.'],
      [reviewIds[4], userIds[4], 'Definitely.'],
    ];

    for (const rc of reviewComments) {
      await client.query(
        `INSERT INTO Review_Comments (review_id, user_id, comment)
         VALUES ($1,$2,$3)`,
        rc
      );
    }

    await client.query('COMMIT');
    console.log('Seed successful!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
  } finally {
    await client.end();
  }
}

seed();