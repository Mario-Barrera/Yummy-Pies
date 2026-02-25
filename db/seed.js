const bcrypt = require('bcrypt');               // imports the bcrypt library used for password hashing 

require('dotenv').config();                     // dotenv is the library, that reads the .env file, and Inject them into Node’s runtime environment
const { Pool } = require('pg');                 // imports PostgreSQL’s connection pool    pg is the Node.js PostgreSQL client library installed from npm

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');                // pool gives you one dedicated connection
    console.log('Connected to DB');

    // performs a full database reset before inserting new seed data
    await client.query(`
      TRUNCATE TABLE
        review_comments,
        reviews,
        order_items,
        payments,
        cart_items,
        orders,
        products,
        users
      RESTART IDENTITY                    -- resets auto-increment IDs back to the beginning
      CASCADE;                            -- lets PostgreSQL delete data from related tables that depend on each other
    `)

    // Development-only demo passwords for seeded users
    // Passwords are hashed before insertion into the database
    const plainPasswords = [
      'Password1!',
      'Password2!',
      'Password3!',
      'Password4!',
      'Password5!',
      'Password6!',
      'Password7!',
      'Password8!',
      'Password9!',
      'Password10!',
      'Password11!',
      'Password12!'
    ];
    const hashedPasswords = await Promise.all (                 // bcrypt hashes each password
      plainPasswords.map(function (plainPassword) {
      return bcrypt.hash(plainPassword, 10)
    }));

    // Insert products
    const products = [
      ['Apple Slice',3.99,'Slice','appleSlice',4],
      ['Cherry Slice',3.99,'Slice','cherrySlice',4],
      ['Blueberry Slice',3.99,'Slice','blueberrySlice',4],
      ['Pumpkin Slice',3.99,'Slice','pumpkinSlice',4],
      ['Pecan Slice',4.29,'Slice','pecanSlice',4],
      ['Chocolate Cream Slice',4.29,'Slice','chocolateCreamSlice',4],
      ['Key Lime Slice',4.29,'Slice','keyLimeSlice',4],
      ['Banana Cream Slice',4.29,'Slice','bananaCreamSlice',4],
      ['Coconut Cream Slice',4.29,'Slice','coconutCreamSlice',4],
      ['Peach Slice',3.99,'Slice','peachSlice',4],

      ['Apple Whole Pie',14.99,'Whole Pie','appleWhole',4],
      ['Cherry Whole Pie',14.99,'Whole Pie','cherryWhole',4],
      ['Blueberry Whole Pie',14.99,'Whole Pie','blueberryWhole',4],
      ['Pumpkin Whole Pie',14.99,'Whole Pie','pumpkinWhole',4],
      ['Pecan Whole Pie',16.99,'Whole Pie','pecanWhole',4],
      ['Chocolate Cream Whole Pie',16.99,'Whole Pie','chocolateCreamWhole',4],
      ['Key Lime Whole Pie',16.99,'Whole Pie','keyLimeWhole',4],
      ['Banana Cream Whole Pie',16.99,'Whole Pie','bananaCreamWhole',4],
      ['Coconut Cream Whole Pie',16.99,'Whole Pie','coconutCreamWhole',4],
      ['Peach Whole Pie',14.99,'Whole Pie','peachWhole',4],
    ];

    // Insert product into database using parameterized query
    // RETURNING - PostgreSQL returns the new product_id so Node.js can track the product that was just inserted
    // each p is one product row
    // { row } is object destructuring in JS
    // $1 is a parameterized query placeholders that prevent SQL injections
    // 'push' adds it to the productIds array in JavaScript
    const productIds = [];                                                    
    for (const product of products) {                                               
      const { rows } = await client.query(                                    
        `INSERT INTO products (name, price, image_key, star_rating)           
         VALUES ($1,$2,$3,$4)                                                 
         RETURNING product_id`,                                               
        product
      );
      productIds.push(rows[0].product_id);
    }
    console.log(`✅ Inserted ${productIds.length} products`);
        
    // Insert users
    const users = [
      ['Alice Smith','alice@example.com',hashedPasswords[0],'123 Apple St Austin TX 78705','512-555-1234','customer'],
      ['Bob Johnson','bob@example.com',hashedPasswords[1],'456 Orange Ave Arlington TX 78613','682-555-5678','customer'],
      ['Charlie Brown','charlie.brown@example.com',hashedPasswords[2],'789 Peach Blvd Dallas TX 75201','214-555-2345','customer'],
      ['Dana White','dana.white@example.com',hashedPasswords[3],'1010 Grape St Lubbock TX 79401','806-555-3456','customer'],
      ['Evelyn King','evelyn.king@example.com',hashedPasswords[4],'2020 Banana Rd San Marcos TX 78666','512-555-4567','customer'],
      ['Frank Castle','frank.castle@example.com',hashedPasswords[5],'3030 Cherry Ln San Antonio TX 78282','210-555-5678','customer'],
      ['Grace Lee','grace.lee@example.com',hashedPasswords[6],'4040 Blueberry Dr Fredericksburg TX 78624','830-555-6789','customer'],
      ['Henry Ford','henry.ford@example.com',hashedPasswords[7],'5050 Pumpkin Way Galveston TX 77550','409-555-7890','customer'],
      ['Ivy Green','ivy.green@example.com',hashedPasswords[8],'6060 Lemon Ct Round Rock TX 78664','512-555-8901','customer'],
      ['Jack Black','jack.black@example.com',hashedPasswords[9],'7070 Pear Pkwy Buda TX 78610','737-555-9012','customer'],
      ['Karen White','karen.white@example.com',hashedPasswords[10],'8080 Plum Ave Fort Worth TX 76101','682-555-0123','customer'],
      ['Caitlyn Jenner','jenner@example.com',hashedPasswords[11],'406 Buffalo Drive Plano TX 75002','214-675-8890','customer']
    ];

    const userIds = [];
    for (const user of users) {
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password, address, phone, role)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING user_id`,
        user
      );
      userIds.push(rows[0].user_id);
    }
    console.log(`✅ Inserted ${userIds.length} users`);


    // Helper function to generate a date relative to today (past or future)
    function daysFromNow(days) {
      const today = new Date();
      today.setDate(today.getDate() + days);
      return today.toISOString();
    }

    // Orders data
    const ordersData = [
      [userIds[3], daysFromNow(-30), 'Completed', 11.97, 'Delivery', 'UberEats', 'UE123456789', 'Delivered', daysFromNow(-30), null],
      [userIds[4], daysFromNow(-45), 'Completed', 11.97, 'Pickup', null, null, null, daysFromNow(-45), '12:30 PM'],
      [userIds[5], daysFromNow(-60), 'Cancelled', 0.00, 'Delivery', 'DoorDash', 'DD0987654321', 'Cancelled', daysFromNow(-60), null],
      [userIds[6], daysFromNow(-15), 'Completed', 12.57, 'Delivery', 'UberEats', 'UE654321987', 'Delivered', daysFromNow(-15), null],
      [userIds[7], daysFromNow(-25), 'Completed', 8.58, 'Pickup', null, null, null, daysFromNow(-25), '1:00 PM'],         
      [userIds[8], daysFromNow(-5), 'Completed', 4.29, 'Delivery', 'Grubhub', 'GH1122334455', 'Delivered', daysFromNow(-5), null], 
      [userIds[9], daysFromNow(-3), 'Completed', 8.58, 'Pickup', null, null, null, daysFromNow(-3), '2:30 PM'],             
      [userIds[0], daysFromNow(-10), 'Completed', 33.97, 'Delivery', 'DoorDash', 'DD5566778899', 'Delivered', daysFromNow(-10), null],
      [userIds[1], daysFromNow(-20), 'Completed', 14.99, 'Pickup', null, null, null, daysFromNow(-20), '10:00 AM'],
      [userIds[2], daysFromNow(-8), 'Cancelled', 0.00, 'Delivery', 'UberEats', 'UE9988776655', 'Cancelled', daysFromNow(-8), null],
      [userIds[3], daysFromNow(-13), 'Completed', 29.98, 'Pickup', null, null, null, daysFromNow(-13), '11:30 AM'],
      [userIds[4], daysFromNow(-35), 'Completed', 16.99, 'Delivery', 'Grubhub', 'GH2233445566', 'Delivered', daysFromNow(-33), null],
      [userIds[6], daysFromNow(-18), 'Completed', 33.98, 'Pickup', null, null, null, daysFromNow(-18), '4:00 PM'],
      [userIds[7], daysFromNow(-11), 'Completed', 16.99, 'Delivery', 'DoorDash', 'DD3344556677', 'Delivered', daysFromNow(-9), null],
      [userIds[9], daysFromNow(-2), 'Completed', 14.99, 'Pickup', null, null, null, daysFromNow(-2), '3:30 PM'],
      [userIds[2], daysFromNow(-7), 'Completed', 7.98, 'Delivery', 'Grubhub', 'GH7788990011', 'Delivered', daysFromNow(-5), null],
    ];

    const orderIds = [];
    for (const order of ordersData) {
      const { rows } = await client.query(
        `INSERT INTO orders (user_id,order_date,status,total_amount,fulfillment_method,
          delivery_partner,delivery_reference,delivery_status,estimated_delivery,pickup_time)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING order_id`,
        order
      );
      orderIds.push(rows[0].order_id);
    }
    console.log(`✅ Inserted ${orderIds.length} orders`);

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
      [orderIds[13],'TXN100014',33.98,'Completed','Credit'], 
      [orderIds[14],'TXN100015',16.99,'Completed','Debit'], 
      [orderIds[16],'TXN100017',14.99,'Completed','Debit'], 
      [orderIds[17],'TXN100018',7.98,'Completed','Credit'],
    ];

    for (const pay of payments) {
      await client.query(
        `INSERT INTO payments (order_id,transaction_id,amount,status,method)
         VALUES ($1,$2,$3,$4,$5)`,
        pay
      );
    }
    console.log(`✅ Inserted ${payments.length} payments`);

    // Order Items - use productIds for product references
    const orderItems = [
      [orderIds[0], productIds[0], 2, 3.99],    // Apple Slice
      [orderIds[0], productIds[2], 1, 3.99],    // Blueberry Slice
      [orderIds[1], productIds[1], 2, 3.99],    // Cherry Slice
      [orderIds[1], productIds[3], 1, 3.99],    // Pumpkin Slice
      [orderIds[2], productIds[4], 2, 4.29],    // Pecan Slice (cancelled)
      [orderIds[3], productIds[0], 1, 3.99],    // Apple Slice
      [orderIds[3], productIds[5], 2, 4.29],    // Chocolate Cream Slice
      [orderIds[4], productIds[6], 2, 4.29],    // Key Lime Slice
      [orderIds[5], productIds[7], 1, 4.29],    // Banana Cream Slice
      [orderIds[6], productIds[8], 2, 4.29],    // Coconut Cream Slice
      [orderIds[7], productIds[9], 1, 3.99],    // Peach Slice
      [orderIds[7], productIds[10], 2, 14.99],  // Apple Whole Pie
      [orderIds[8], productIds[11], 1, 14.99],  // Cherry Whole Pie
      [orderIds[9], productIds[12], 1, 14.99],  // Blueberry Whole Pie (cancelled)
      [orderIds[10], productIds[13], 2, 14.99], // Pumpkin Whole Pie
      [orderIds[11], productIds[14], 1, 16.99], // Pecan Whole Pie
      [orderIds[13], productIds[16], 2, 16.99], // Key Lime Whole Pie
      [orderIds[14], productIds[17], 1, 16.99], // Banana Cream Whole Pie
      [orderIds[16], productIds[19], 1, 14.99], // Peach Whole Pie
      [orderIds[17], productIds[0], 2, 3.99],   // Apple Slice
    ];

    for (const orderItem of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1,$2,$3,$4)`,
        orderItem
      );
    }
    console.log(`✅ Inserted ${orderItems.length} order items`);

    // Reviews - use userIds and productIds
    const reviews = [
      [userIds[7], productIds[2], 5, 'Absolutely perfect!'],
      [userIds[0], productIds[0], 5, 'Flaky crust and rich filling, it was amazing!'],
      [userIds[8], productIds[3], 3, 'Not bad, just not for me.'],
      [userIds[6], productIds[1], 4, 'A bit tart, but really good.'],
      [userIds[3], productIds[0], 5, 'Amazing pie, will order again!'],
      [userIds[4], productIds[6], 5, 'Delicious! I would buy again.'],
      [userIds[3], productIds[5], 3, 'Interesting flavor, not my favorite.'],
      [userIds[7], productIds[1], 4, 'Sweet and satisfying.'],
      [userIds[4], productIds[1], 4, 'Great balance of flavors.'],
      [userIds[1], productIds[4], 4, 'Nice and fruity, not too sweet.'],
      [userIds[6], productIds[5], 4, 'Nice twist on the usual.'],
      [userIds[0], productIds[3], 4, 'I really liked it! Great quality.'],
      [userIds[5], productIds[7], 5, 'Incredible texture and taste.'],
      [userIds[8], productIds[2], 3, 'Pretty good overall.'],
      [userIds[4], productIds[3], 3, 'Good, but a little too rich.'],
      [userIds[1], productIds[0], 4, 'Very good pie, perfectly sweet.'],
    ];

    const reviewIds = [];
    for (const review of reviews) {
      const { rows } = await client.query(
        `INSERT INTO reviews (user_id, product_id, rating, comment)
         VALUES ($1,$2,$3,$4)
         RETURNING review_id`,
        review
      );
      reviewIds.push(rows[0].review_id);
    }
    console.log(`✅ Inserted ${reviewIds.length} reviews`);

    // Review comments
    const comments = [
      [reviewIds[0], userIds[1], 'Totally agree!'],      
      
      [reviewIds[1], userIds[3], 'Interesting perspective.'],
      [reviewIds[1], userIds[0], 'Couldn’t have said it better.'],
      [reviewIds[1], userIds[4], 'Helpful review, much appreciated.'],

      [reviewIds[2], userIds[3], 'I felt the same way!'],
      
      [reviewIds[3], userIds[4], 'Good point.'],
      [reviewIds[3], userIds[0], 'Loved this review!'],
      
      [reviewIds[4], userIds[5], 'Definitely.'],
      [reviewIds[4], userIds[3], 'Couldn’t have said it better.'],
      
      [reviewIds[5], userIds[0], 'I agree completely!'],
      [reviewIds[5], userIds[3], 'Nice explanation!'],
      [reviewIds[5], userIds[4], 'Well said!'],

      [reviewIds[6], userIds[1], 'Yum! Must try.'],
      [reviewIds[6], userIds[3], 'Sounds delicious.'],
      [reviewIds[6], userIds[4], 'I want one too!'],
      [reviewIds[6], userIds[0], 'Perfectly described.'],

      [reviewIds[7], userIds[4], 'Couldn’t have said it better.'],
      
      [reviewIds[8], userIds[5], 'So true, very helpful.'],
      [reviewIds[8], userIds[0], 'Well explained!'],
      [reviewIds[8], userIds[3], 'Absolutely right.'],
      [reviewIds[8], userIds[1], 'Nice perspective.'],

      [reviewIds[9], userIds[6], 'Absolutely loved this!'],
      [reviewIds[9], userIds[2], 'Very informative.'],
      [reviewIds[9], userIds[4], 'Helpful review!'],
      
      [reviewIds[10], userIds[7], 'Good insight, thanks for sharing.'],
      [reviewIds[10], userIds[1], 'Really helpful!'],
      [reviewIds[10], userIds[3], 'Well explained.'],

      [reviewIds[11], userIds[8], 'Nice review, informative.'],
      [reviewIds[11], userIds[0], 'Excellent comment!'],
      
      [reviewIds[12], userIds[1], 'Exactly what I thought too.'],
      [reviewIds[12], userIds[3], 'Great perspective!'],
      [reviewIds[12], userIds[6], 'Totally agree!'],

      [reviewIds[13], userIds[3], 'Helpful review, much appreciated.'],
  
      [reviewIds[14], userIds[0], 'I learned a lot from this comment.'],
      [reviewIds[14], userIds[2], 'Great explanation!'],
      [reviewIds[14], userIds[3], 'Well put!'],
      [reviewIds[14], userIds[4], 'Informative and helpful.'],

      [reviewIds[15], userIds[2], 'Perfectly said!'],
      [reviewIds[15], userIds[1], 'I completely agree!'],
  
      [reviewIds[16], userIds[4], 'Totally agree with your thoughts.'],
      [reviewIds[16], userIds[0], 'Helpful comment!'],
      [reviewIds[16], userIds[2], 'Great perspective.'],
      [reviewIds[16], userIds[3], 'Nice insight.'],

      [reviewIds[17], userIds[5], 'Couldn’t have put it better myself.'],
      [reviewIds[17], userIds[1], 'Very helpful!'],
      [reviewIds[17], userIds[0], 'Absolutely agree.'],
    ];

    for (const comment of comments) {
      await client.query(
        `INSERT INTO comments (review_id, user_id, comment)
        VALUES ($1, $2, $3)`,
        comment
      );  
    }    
    console.log(`✅ Inserted ${reviewComments.length} review comments`);

    await client.query('COMMIT');
    console.log('🌱 Seed successful!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
  } finally {
    client.release();                   // returns the database connection back to the pool so it can be reused
    await pool.end();
    console.log('🔌 Disconnected from DB');
  }
}

seed();