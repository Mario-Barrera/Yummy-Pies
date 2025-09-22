# 🍰 Yummy Pies – Final Project Submission

## 📊 Data Overview

This project includes the following pre-seeded data:

- 🛍️ 20 Products  
- 👤 12 Users  
- 📦 18 Orders  
- 💳 18 Payments  
- 🧾 22 Order Items
- ⭐ 19 Reviews  
- 💬 53 Review Comments  
- 🚧 Known Issues / Incomplete Features

---

## 🧁 Summary

This project showcases key features for an e-commerce pie shop including:

- Account registration & login  
- Product listing and reviews  
- Order placement with fulfillment options  
- Review & comment system  
- Profile management  
- Cart functionality with persistence  
- Google Maps API integration (limited to Texas)
- Dynamic cart count displaying current items for logged-in users
- Database schema managed via PostgreSQL ALTER commands for seamless updates

---

## 🧭 Navigation Behavior

### Sidebar Displays
- Upon initial visit, the sidebar dynamically updates based on user authentication:
  - **Non-logged-in users** see a simplified menu.
  - **Logged-in users** see additional options such as Profile and Order History.

---

## 🛒 Order Online Access

- If a **non-logged-in user** clicks on **Order Online**, they are shown the message:  
  > **"Please log in to place an order."**

This ensures that only authenticated users can place online orders.

---

## 🧁 Catering Form

- The catering form is available to **both logged-in and non-logged-in users**.
- If a valid email address is entered, a confirmation email will be sent to the user.
  - The subject of the email is:  
    > **"Your Catering Request Confirmation"**

This demonstrates the working form submission and email functionality for all users.

---

## ⭐ Customer Reviews & Comments

### Public Access
- The **Customer Reviews** page is **publicly accessible**.
- **Both logged-in and non-logged-in users** can:
  - View all product reviews
  - See all user comments associated with each review

### Authenticated Features
- Only **logged-in registered users** can:
  - **Create** a new product review (limited to products they have purchased)
  - **Comment** on reviews written by other users
  - **Edit or delete** their own reviews and comments

### Review Display
- All reviews and comments are shown in:
  - The **Customer Reviews** page (public view)
  - The **user’s profile page** (personal account area)

---

## 👤 Demo User Accounts

For demonstration purposes, use one of the following **pre-seeded fake user accounts**:

- **User email addresses and passwords** are listed in **chronological order** (based on creation).
- This also helps identify which password belongs to which user.

> _Instructor Note: The passwords follow the same sequence as the user data in the seed file._

---

## 🧾 Order Numbering

- Orders are labeled with `Order #` followed by a number.
- This number reflects the **chronological order** in which the order was placed during seed setup.
  - Example:  
    **Order #9** → the **ninth** order placed in the database

---

## 📝 Profile & Review Management

- Logged-in users can **edit their profile** at any time.
  - Clicking **Cancel** discards unsaved changes.

- Users may **edit or delete**:
  - Their own **product reviews**
  - Their own **comments on reviews**

These updates will reflect immediately in:
- The **Customer Reviews** page
- The **user’s profile page**

---

## 🛒 Order Placement & Local Storage Behavior

### Cart & Order Persistence
- While placing an online order, all form and cart data is saved to **localStorage**.
- If a user **leaves the site before completing checkout**, the data will still be there when they return.
- This allows users to resume where they left off and complete their purchase later.

---

## 🗺️ Delivery Location Limitations (Google Maps API)

- For delivery orders, users enter a **Texas address** using Google Maps API.
- I decided to **restrict delivery addresses to Texas only**.  
  > _(Honestly, not sure why — it just seemed like a good idea at the time... LOL)_

---

## ✍️ Reviews & Comments Logic Recap

- Logged-in users can:
  - Leave **reviews** on products they have actually purchased
  - Write **comments** on other users’ reviews
- All submitted reviews and comments are shown in:
  - The **Customer Reviews** page (public)
  - The **user’s profile page** (private)

---

## 🔄 Post-Order Behavior

- After a successful order is placed:
  - The page **automatically refreshes**
  - Any data saved in **localStorage is cleared**
- This ensures that leftover cart or form data doesn't persist after the order is complete.

### ⚠️ Note About Stock Quantities
- Although users can purchase items, the **`stock_quantity` in the seed data does not update**.
- This is intentional for demonstration purposes and does not currently reflect live inventory changes.

---

## 🍽️ Menu & Cart Experience

- Menu images are **locally stored** in the project folder (VS Code)
- Product images are dynamically inserted into the page using **JavaScript**
- When a user clicks the **“Add to Cart”** button:
  - The selected product is added to a visible cart list (client-side)
  - The cart persists through localStorage until checkout or page refresh

---

## 📬 Mailing List & Social Media Icons

- **Join Our Mailing List** feature is **non-functional** in this version  
  > (The input box exists but is not connected to any backend or email service.)

- **Social media icons** redirect users to the **homepage of each respective platform**  
  (e.g., Facebook, Instagram, Twitter)

---

## 🛒 Shopping Cart Indicator Feature

One of the key interactive features I implemented is a **dynamic shopping cart count** that appears next to the "Order Online" link in the navigation bar. For example:

> **Order Online (2)**

This count reflects the number of items currently in the logged-in user's cart **that have not yet been checked out** (i.e., a persistent cart stored in `localStorage`).

- For demonstration purposes, the user **Bob Johnson** has a cart with preloaded items.
- However, this feature is **not limited to him** — you can log in as **any user**, add items to the cart, and see the count update accordingly.
- The count will automatically refresh on page load, thanks to JavaScript logic that checks for saved cart data.

---

## 🛠️ SQL Modifications Using `ALTER`

During development, I used a variety of PostgreSQL `ALTER` commands to evolve and modify my database schema **without dropping or recreating tables**. This allowed me to:

- Add new columns
- Modify existing constraints
- Adjust table relationships
- Improve data integrity rules
- Keep seeded data intact while making schema updates

Some of the `ALTER` commands I used include: ALTER TABLE
ALTER TABLESPACE
ALTER TEXT SEARCH CONFIGURATION
ALTER TEXT SEARCH DICTIONARY
ALTER TEXT SEARCH PARSER
ALTER TEXT SEARCH TEMPLATE
ALTER TRIGGER
ALTER TYPE
ALTER USER

> **Viewing SQL Help in PostgreSQL**

To look up all the syntax and usage for any SQL command — including `ALTER TABLE` and others I used while modifying my schema — you can use this built-in PostgreSQL command:

```sql
\h
```

## 🚧 Known Issues / Incomplete Features

**Order Form and Order History Integration**  
Due to time constraints, I was unable to complete the functionality where a user’s order created through the order form is saved in the database and then reflected in their recent order history on the account profile page. This feature is planned but not yet implemented.

**Forgot Password**  
The "Forgot Password" feature is currently not working. When a user enters their email address to receive a password reset link, the system does not send the reset email, and the password reset process is not functional yet.

