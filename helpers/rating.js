const pool = require('../db/client');

async function updateProductRating(productId) {
  try {
    await pool.query(
      `UPDATE products
       SET star_rating = COALESCE((
         SELECT AVG(rating)::numeric(2,1) FROM reviews WHERE product_id = $1
       ), 0)
       WHERE product_id = $1`,
      [productId]
    );
  } catch (error) {
    console.error('Failed to update product star rating:', error);
  }
}

module.exports = { updateProductRating };
