async function loadUserReviews() {
    const container = document.getElementById('user-reviews');

    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
        container.innerHTML = '<p class="error">You are not logged in. Please log in to see your reviews.</p>';
        return;
    }

    try {
        const response = await fetch('/reviews/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          container.innerHTML = '<p class="error">Session expired or unauthorized. Please log in again.</p>';
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
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
        container.innerHTML = '<p class="error">Error loading reviews. Please try again later.</p>';
    }
}

// Call function on page load
loadUserReviews();