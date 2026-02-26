// Purpose of this block of code is to recalculate and update a product’s star_rating whenever reviews change
const pool = require('../db/client');

// COALESCE returns the first non-NULL value, defaulting to 0 if no reviews exist
// '$1' is a parameter placeholder for the star rating value
// ' [productId]' is array provides the value that gets assigned to $1
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
