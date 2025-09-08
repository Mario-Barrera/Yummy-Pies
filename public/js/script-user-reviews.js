// logged-in User accessible, fetches and displays all reviews

async function loadUserReviews() {
  const container = document.getElementById('user-reviews');

  if (!container) {
    console.warn('User reviews container element not found');
    return;
  }

  const token = localStorage.getItem('token');

  if (!token) {
    container.innerHTML = '<p class="error">You are not logged in. Please log in to see your reviews.</p>';
    return;
  }

  try {
    const response = await fetch('/api/reviews/user', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      container.innerHTML = '<p class="error">Session expired or unauthorized. Please log in again.</p>';
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch your reviews');
    }

    const reviews = await response.json();

    if (reviews.length === 0) {
      container.textContent = 'You have no reviews yet.';
      return;
    }

    container.innerHTML = ''; // Clear previous content

    reviews.forEach(review => {
      const reviewDiv = document.createElement('div');
      reviewDiv.className = 'review';
      reviewDiv.innerHTML = `
        <h4>Product ID: ${review.product_id}</h4>
        <p>Rating: ${review.rating}</p>
        <p>Comment: ${review.comment || 'No comment'}</p>
        <p>Date: ${new Date(review.created_at).toLocaleDateString()}</p>
      `;
      container.appendChild(reviewDiv);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Error loading your reviews. Please try again later.</p>';
  }
}

// Call on page load
loadUserReviews();
