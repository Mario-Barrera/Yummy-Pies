async function loadReviewComments() {
  try {
    const res = await fetch('/api/reviews', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch reviews');
    }

    const reviews = await res.json();

    const tableBody = document.querySelector('#comments-table-body');
    tableBody.innerHTML = ''; // Clear old data

    reviews.forEach(review => {
      const row = document.createElement('tr');
      row.dataset.reviewId = review.review_id; // store ID for update/delete
      row.innerHTML = `
        <td>${review.productName}</td>
        <td>${review.rating}</td>
        <td>${review.comment || 'No comment'}</td>
        <td><button class="edit-review-btn">Edit</button></td>
      `;
      tableBody.appendChild(row);
    });

    attachEditButtons();
  } catch (err) {
    console.error('Error loading comments:', err);
    alert('Could not load review comments.');
  }
}

function attachEditButtons() {
  document.querySelectorAll('.edit-review-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const row = e.target.closest('tr');
      const reviewId = row.dataset.reviewId;
      const currentRating = row.children[1].textContent;
      const currentComment = row.children[2].textContent;

      const newRating = prompt('Edit rating (1-5):', currentRating);
      const newComment = prompt('Edit comment:', currentComment);

      if (
        !newRating ||
        !newComment ||
        isNaN(newRating) ||
        newRating < 1 ||
        newRating > 5
      ) {
        alert('Invalid input. Edit cancelled.');
        return;
      }

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
          alert('Review updated successfully!');
          loadReviewComments(); // Refresh the list
        } else {
          alert('Failed to update review.');
        }
      } catch (err) {
        console.error('Edit error:', err);
        alert('An error occurred while updating.');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', loadReviewComments);
