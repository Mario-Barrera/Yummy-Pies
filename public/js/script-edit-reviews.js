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

    const table = document.createElement('table');
    table.className = 'user-reviews-table';

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

    const tbody = document.createElement('tbody');

    reviews.forEach(review => {
      const cleanProductName = review.product_name.replace(/\b(Slice|Whole)\b/g, '').trim();
      const createdAt = new Date(review.created_at);
      const updatedAt = new Date(review.updated_at);
      const showUpdated = review.updated_at && updatedAt.getTime() !== createdAt.getTime();


      const createdDate = createdAt.toLocaleDateString(); // display only
      const updatedDate = updatedAt.toLocaleDateString(); // display only


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

    // DELETE HANDLER — still okay here, because it targets fresh elements each time
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
              loadUserReviews(); // refresh reviews
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

  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Error loading your reviews. Please try again later.</p>';
  }
}

document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('edit-btn')) {
    const reviewId = e.target.dataset.reviewId;
    const row = e.target.closest('tr');

    // SAFER lookup using querySelector inside the row
    const cells = row.querySelectorAll('td');
    const currentRating = cells[1]?.textContent?.trim();
    const currentComment = cells[2]?.textContent?.trim();

    // Show prompts
    const newRatingInput = prompt('Edit review rating (1-5):', currentRating);
    if (newRatingInput === null) return; // Cancelled

    const parsedRating = parseInt(newRatingInput, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      alert('Rating must be a number between 1 and 5.');
      return;
    }

    const newComment = prompt('Edit your comment about the product:', currentComment);
    if (newComment === null || newComment.trim() === '') {
      alert('Comment cannot be empty.');
      return;
    }

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rating: parsedRating,
          comment: newComment.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Failed to edit review: ${data.error || 'Unknown error'}`);
      } else {
        alert('Review edited successfully.');
        loadUserReviews(); // refresh UI
      }
    } catch (err) {
      console.error('Edit error:', err);
      alert('An error occurred while editing.');
    }
  }
});


// Load on page
loadUserReviews();
