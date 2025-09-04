// this code only fetches and displays reviews with Edit/Delete buttons
// It does not handle the actual editing or deleting operations or updating the database
// lines of code 115 to 233 for handling these operations

async function loadUserReviews() {
  const container = document.getElementById('user-reviews');
  const token = localStorage.getItem('token');

  if (!token) {
    container.innerHTML = '<p class="error">You are not logged in. Please log in to see your reviews.</p>';
    return;
  }

  try {
    const response = await fetch('/reviews/user', {
      headers: { 'Authorization': `Bearer ${token}` }
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

    container.innerHTML = ''; // Clear previous content

    reviews.forEach(review => {
      const li = document.createElement('li');
      li.className = 'review-item';
      li.setAttribute('data-review-id', review.review_id);

      li.innerHTML = `
        <p>Product ID: ${review.product_id}</p>
        <p>Rating: ${review.rating}</p>
        <p>Comment: ${review.comment || 'No comment'}</p>
        <p>Date: ${new Date(review.created_at).toLocaleDateString()}</p>
        <button class="edit-btn" data-review-id="${review.review_id}">Edit</button>
        <button class="delete-btn" data-review-id="${review.review_id}">Delete</button>
      `;

      container.appendChild(li);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Error loading reviews. Please try again later.</p>';
  }
}

async function loadUserComments() {
  const container = document.getElementById('review-comments');
  const token = localStorage.getItem('token');

  if (!token) {
    container.innerHTML = '<p class="error">You are not logged in. Please log in to see your comments.</p>';
    return;
  }

  try {
    const response = await fetch('/reviewComments/user', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) {
      container.innerHTML = '<p class="error">Session expired or unauthorized. Please log in again.</p>';
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }

    const comments = await response.json();

    if (comments.length === 0) {
      container.textContent = 'No comments found.';
      return;
    }

    container.innerHTML = ''; // Clear previous content

    comments.forEach(comment => {
      const div = document.createElement('div');
      div.className = 'comment-item';
      div.setAttribute('data-comment-id', comment.comment_id);

      div.innerHTML = `
        <p><strong>${comment.user_name}</strong> on Review ID ${comment.review_id}: ${comment.comment}</p>
        <p><small>${new Date(comment.created_at).toLocaleString()}</small></p>
        <button class="edit-btn" data-comment-id="${comment.comment_id}">Edit</button>
		<button class="delete-btn" data-comment-id="${comment.comment_id}">Delete</button>
      `;

      container.appendChild(div);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Error loading comments. Please try again later.</p>';
  }
}

loadUserReviews();
loadUserComments();


// ------ EDIT/DELTE BUTTONS TO HANDLE REVIEWS ------ //
document.getElementById('user-reviews').addEventListener('click', async (event) => {
  const target = event.target;

  // DELETE review
  if (target.classList.contains('delete-btn')) {
    const reviewId = target.getAttribute('data-review-id');
    if (confirm('Are you sure you want to delete this review?')) {
      const token = localStorage.getItem('token');
      const response = await fetch(`/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        alert('Review deleted');
        loadUserReviews(); // Refresh after delete
      } else {
        alert('Failed to delete review');
      }
    }
  }

  // EDIT review
  if (target.classList.contains('edit-btn')) {
    const reviewId = target.getAttribute('data-review-id');

    const newRating = parseInt(prompt('Enter new rating (1-5):'), 10);
    if (isNaN(newRating) || newRating < 1 || newRating > 5) {
      alert('Invalid rating. Please enter a number between 1 and 5.');
      return;
    }

    const newComment = prompt('Enter your updated comment:');
    if (newComment === null) return; // Cancelled

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: newRating,
          comment: newComment
        })
      });

      if (response.ok) {
        alert('Review updated');
        loadUserReviews(); // Refresh after edit
      } else {
        const errorData = await response.json();
        alert('Failed to update review: ' + (errorData.error || response.statusText));
      }
    } catch (err) {
      console.error('Edit failed', err);
      alert('An error occurred while updating the review.');
    }
  }
});


// ------ EDIT/DELTE BUTTONS TO HANDLE COMMENTS ------ //
document.getElementById('review-comments').addEventListener('click', async (event) => {
  const target = event.target;

  if (target.classList.contains('delete-btn')) {
    const commentId = target.getAttribute('data-comment-id');
    if (confirm('Are you sure you want to delete this comment?')) {
      const token = localStorage.getItem('token');
      const response = await fetch(`/reviewComments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('Comment deleted');
        loadUserComments(); // Refresh comments list
      } else {
        alert('Failed to delete comment');
      }
    }
  }

  if (target.classList.contains('edit-btn')) {
    const commentId = target.getAttribute('data-comment-id');

    const newComment = prompt('Enter your updated comment:');
    if (newComment === null) return; // Cancelled

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/reviewComments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: newComment })
      });

      if (response.ok) {
        alert('Comment updated');
        loadUserComments();
      } else {
        const errorData = await response.json();
        alert('Failed to update comment: ' + (errorData.error || response.statusText));
      }
    } catch (err) {
      console.error('Edit failed', err);
      alert('An error occurred while updating the comment.');
    }
  }
});
