// Publicly accessible, fetches and displays all reviews (no login required)

async function loadAllReviews() {
  const container = document.getElementById('reviews-container');

  if (!container) {
    console.warn('Reviews container element not found');
    return;
  }

  try {
    const response = await fetch('/api/reviews/all'); // public endpoint, no auth header

    if (!response.ok) {
      throw new Error('Failed to fetch all reviews');
    }

    const reviews = await response.json();

    if (reviews.length === 0) {
      container.textContent = 'No reviews found.';
      return;
    }

    container.innerHTML = ''; // Clear loading text

    reviews.forEach(review => {
      const reviewDiv = document.createElement('div');
      reviewDiv.className = 'review';

      // Remove "Slice" and "Whole" from product_name
      const cleanProductName = review.product_name.replace(/\b(Slice|Whole)\b/g, '').trim();

      reviewDiv.innerHTML = `
        <h3>Product: ${cleanProductName}</h3>

        <p class="comment-container">
          <a href="review-comments.html?reviewId=${review.review_id}">💬 Comments</a>
        </p>
        
        <p>By: ${review.user_name}</p>
         
        <p class="rating">
          <p class="rating">
            <span class="filled-stars">${'★'.repeat(review.rating)}</span><span class="empty-stars">${'☆'.repeat(5 - review.rating)}</span>
          </p>
        
        <p>Review: ${review.comment || 'No comment'}</p>
        
        <p>Date: ${new Date(review.created_at).toLocaleDateString()}</p>
      `;
      container.appendChild(reviewDiv);
    });

  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Error loading reviews. Please try again later.</p>';
  }
}

loadAllReviews();
