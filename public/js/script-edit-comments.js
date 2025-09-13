async function loadUserReviewComments() {
  const container = document.getElementById('user-comments');
  const token = localStorage.getItem('token');

  if (!container) {
    console.error('Container element not found!');
    return;
  }

  if (!token) {
    container.innerHTML = '<p class="error">You are not logged in. Please log in to see your comments.</p>';
    return;
  }

  try {
    const response = await fetch('/api/review-comments/user', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      container.innerHTML = '<p class="error">Session expired or unauthorized. Please log in again.</p>';
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch your comments');
    }

    const comments = await response.json();

    if (comments.length === 0) {
      container.innerHTML = '<p id="no-commentHistory-message">You have no comments yet.</p>';
      return;
    }

    container.innerHTML = ''; // Clear previous content

    const table = document.createElement('table');
    table.className = 'user-comments-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Product</th>
        <th>Comment</th>
        <th>Date Created</th>
        <th>Updated</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    comments.forEach(comment => {
      const cleanProductName = comment.product_name.replace(/\b(Slice|Whole)\b/g, '').trim();
      const createdAt = new Date(comment.created_at);
      const updatedAt = comment.updated_at ? new Date(comment.updated_at) : null;
      const createdDate = createdAt.toLocaleDateString();
      const updatedDate = updatedAt ? updatedAt.toLocaleDateString() : '';

      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${cleanProductName}</td>
        <td>${comment.comment}</td>
        <td>${createdDate}</td>
        <td>${updatedDate}</td>
        <td>
          <button class="edit-comment-btn" data-comment-id="${comment.comment_id}">Edit</button>
          <button class="delete-comment-btn" data-comment-id="${comment.comment_id}">Delete</button>
        </td>
      `;

      tbody.appendChild(tr);  
    });


    table.appendChild(tbody);
    container.appendChild(table);

    // --- Delete handler
    document.querySelectorAll('.delete-comment-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const commentId = e.target.dataset.commentId;

        if (confirm('Are you sure you want to delete this comment?')) {
          try {
            const res = await fetch(`/api/review-comments/${commentId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
              alert('Comment deleted successfully');
              loadUserReviewComments(); 
            } else {
              alert('Failed to delete comment');
            }
          } catch (err) {
            console.error('Delete error:', err);
            alert('An error occurred while deleting the comment.');
          }
        }
      });
    });

    // --- Edit handler
    document.querySelectorAll('.edit-comment-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const commentId = e.target.dataset.commentId;
        const row = e.target.closest('tr');
        const currentComment = row.children[1].textContent;

        const newComment = prompt('Edit your comment about the product:', currentComment);

        if (!newComment || !newComment.trim()) {
          alert('Invalid input. Edit canceled.');
          return;
        }

        try {
          const res = await fetch(`/api/review-comments/${commentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              comment: newComment.trim()
            })
          });

          if (res.ok) {
            alert('Comment edited successfully');
            loadUserReviewComments(); 
          } else {
            alert('Failed to edit comment');
          }
        } catch (err) {
          console.error('Edit error:', err);
          alert('An error occurred while editing the comment.');
        }
      });
    });

  } catch (error) {
    console.error('Error loading comments:', error);
    container.innerHTML = '<p class="error">Error loading your comments. Please try again later.</p>';
  }
}

// Run on page load
loadUserReviewComments();
