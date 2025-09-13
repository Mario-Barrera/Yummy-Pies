async function loadUserReviewComments() {
  const container = document.getElementById('user-comments');
  if (!container) return console.error('Container element not found!');

  try {
    const response = await fetch('/api/review-comments/user', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to fetch user comments.');
    const comments = await response.json();

    if (comments.length === 0) {
      container.innerHTML = '<p id="no-commentHistory-message">You haven’t posted any comments yet.</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'user-comments-table';

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

    comments.forEach(comment => {
      const createdAt = new Date(comment.created_at).toLocaleString();
      const updatedAt = comment.updated_at ? new Date(comment.updated_at).toLocaleString() : '';
      const showUpdated = updatedAt && comment.updated_at !== comment.created_at;

      const row = document.createElement('tr');
      row.dataset.commentId = comment.comment_id;
      row.innerHTML = `
        <td>${comment.product_name}</td>
        <td>${comment.rating}</td>
        <td>${comment.comment}</td>
        <td>${createdAt}</td>
        <td>${showUpdated ? updatedAt : ''}</td>
        <td>
          <button class="edit-comment-btn" data-comment-id="${comment.comment_id}">Edit</button>
          <button class="delete-comment-btn" data-comment-id="${comment.comment_id}">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);

    container.innerHTML = ''; // Clear container content
    container.appendChild(table); // Append the new table

    attachCommentActionListeners();
  } catch (error) {
    console.error('Error fetching user review comments:', error);
    container.innerHTML = '<p>Unable to load your comments. Please try again later.</p>';
  }
}

function attachCommentActionListeners() {
  document.querySelectorAll('.edit-comment-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const commentId = e.target.dataset.commentId;
      const row = e.target.closest('tr');
      const currentRating = row.children[1].textContent;
      const currentComment = row.children[2].textContent;

      const newRating = prompt('Edit rating (1-5):', currentRating);
      const newComment = prompt('Edit your comment:', currentComment);

      if (!newRating || !newComment || isNaN(newRating) || newRating < 1 || newRating > 5) {
        alert('Invalid input. Edit cancelled.');
        return;
      }

      try {
        const res = await fetch(`/api/review-comments/${commentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            rating: parseInt(newRating),
            comment: newComment.trim()
          })
        });

        if (res.ok) {
          alert('Comment updated successfully!');
          loadUserReviewComments();
        } else {
          alert('Failed to update comment.');
        }
      } catch (err) {
        console.error('Edit error:', err);
        alert('An error occurred while updating.');
      }
    });
  });

  document.querySelectorAll('.delete-comment-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const commentId = e.target.dataset.commentId;

      if (!confirm('Are you sure you want to delete this comment?')) return;

      try {
        const res = await fetch(`/api/review-comments/${commentId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (res.ok) {
          alert('Comment deleted successfully.');
          loadUserReviewComments();
        } else {
          alert('Failed to delete comment.');
        }
      } catch (err) {
        console.error('Delete error:', err);
        alert('An error occurred while deleting.');
      }
    });
  });
}

// Initial load
loadUserReviewComments();
