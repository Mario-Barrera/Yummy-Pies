
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
      container.innerHTML = '<p id="no-reviewHistory-message">You have no reviews yet.</p>';
      return;
    }

    container.innerHTML = ''; // Clear previous content

    // Create table element
    const table = document.createElement('table');
    table.className = 'user-reviews-table'; 

    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Product</th>
        <th>Rating</th>
        <th>Comment</th>
        <th>Date Created</th>
        <th>Updated</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    reviews.forEach(review => {
    const cleanProductName = review.product_name.replace(/\b(Slice|Whole)\b/g, '').trim();
    const createdDate = new Date(review.created_at).toLocaleDateString();
    const updatedDate = review.updated_at ? new Date(review.updated_at).toLocaleDateString() : null;
    const showUpdated = updatedDate && updatedDate !== createdDate;

    const tr = document.createElement('tr');

    const editBtn = `<button class="edit-btn" data-review-id="${review.review_id}">Edit</button>`;
    const deleteBtn = `<button class="delete-btn" data-review-id="${review.review_id}">Delete</button>`;

    tr.innerHTML = `
      <td>${cleanProductName}</td>
      <td>${review.rating}</td>
      <td>${review.comment || 'No comment'}</td>
      <td>${createdDate}</td>
      <td>${showUpdated ? updatedDate : ''}</td>
      <td>${editBtn} ${deleteBtn}</td>
    `;
    tbody.appendChild(tr);  
  });

    table.appendChild(tbody);
    container.appendChild(table);

    // Event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const reviewId = e.target.dataset.reviewId;
        if (confirm('Are you sure you want to delete this review?')) {
          try {
            const res = await fetch(`/api/reviews/${reviewId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              alert('Review deleted successfully');
              loadUserReviews(); // reload reviews
            } else {
              alert('Failed to delete review');
            }
          } catch (err) {
            console.error('Delete error:', err);
            alert('An error occurred');
          }
        }
      });
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const reviewId = e.target.dataset.reviewId;
        const row = e.target.closest('tr');
        const currentRating = row.children[1].textContent;
        const currentComment = row.children[2].textContent;

        const newRating = prompt('Edit review rating (1-5):', currentRating);
        const newComment = prompt('Edit your customer review about the product:', currentComment);

        if (newRating && newComment) {
          try {
            const res = await fetch(`/api/reviews/${reviewId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                rating: parseInt(newRating),
                comment: newComment.trim()
              })
            });

            if (res.ok) {
              alert('Review edited successfully');
              loadUserReviews(); // Reload to reflect changes
            } else {
              alert('Failed to edit review');
            }
          } catch (err) {
            console.error('Edit error:', err);
            alert('An error occurred');
          }
        } else {
          alert('Edit canceled or invalid input.');
        }
      });
    });

  
    } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Error loading your reviews. Please try again later.</p>';
  }
}

// Call on page load
loadUserReviews();
