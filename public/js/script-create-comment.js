document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.manage-profile-form');
  const cancelBtn = document.getElementById('cancelButton');
  const token = localStorage.getItem('token');

  if (!form || !token) {
    alert('Something went wrong. Please reload the page.');
    return;
  }

  // Load all reviews with user & product names into the dropdown
  async function loadReviewsIntoDropdown() {
    try {
      const response = await fetch('/api/reviews/all', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch reviews');

      const reviews = await response.json();
      const select = document.getElementById('comment-select');

      // Clear existing options except the default
      select.innerHTML = '<option value="">Select a review</option>';

      reviews.forEach(review => {
        const option = document.createElement('option');
        option.value = review.review_id;
        option.textContent = `${review.user_name} on ${review.product_name}: "${(review.comment || '').slice(0, 50)}..."`;
        select.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading reviews:', err);
      alert('Failed to load reviews for commenting.');
    }
  }

  loadReviewsIntoDropdown();


  // Handle form submission to post a review comment
  form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get review ID and comment text from the form
  const reviewId = form.querySelector('#comment-select').value;
  const commentText = form.querySelector('#comment').value.trim();

  if (!reviewId || !commentText) {
    alert('Please select a review and enter your comment.');
    return;
  }

  try {
    // POST comment to the correct endpoint including the reviewId param
    const res = await fetch(`/api/review-comments/${reviewId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`, // make sure you have the token set
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment: commentText })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to submit comment.');
    }

    alert('Comment submitted successfully!');
    // Optionally reset the form or redirect
    form.reset();
    // Or redirect to profile page
    // window.location.href = '/account-profile.html';

  } catch (err) {
    console.error('Error submitting comment:', err);
    alert(`Failed to submit comment: ${err.message}`);
  }
});


  // Cancel button resets form and redirects
  cancelBtn.addEventListener('click', () => {
    form.reset();
    window.location.href = '/account-profile.html';
  });
});
