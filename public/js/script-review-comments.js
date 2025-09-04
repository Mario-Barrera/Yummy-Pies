async function loadReviewComments() {
  const container = document.getElementById('review-comments');

  const token = localStorage.getItem('token');
  
  if (!token) {
    container.innerHTML = '<p class="error">You are not logged in. Please log in to see your comments.</p>';
    return;
  }

  try {
    // Fetch user info (to check role)
    const userResponse = await fetch('/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const user = await userResponse.json();
    const isAdmin = user.role === 'admin';

    // Fetch comments depending on role
    const commentsResponse = await fetch(isAdmin ? '/review-comments' : '/review-comments/user', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (commentsResponse.status === 401) {
      container.innerHTML = '<p class="error">Session expired or unauthorized. Please log in again.</p>';
      return;
    }

    if (!commentsResponse.ok) {
      throw new Error('Failed to fetch comments');
    }

    const comments = await commentsResponse.json();

    if (comments.length === 0) {
      container.textContent = 'No comments found.';
      return;
    }

    container.innerHTML = '';

    comments.forEach(comment => {
      const canModify = isAdmin || comment.user_id === user.user_id;

      const commentDiv = document.createElement('div');
      commentDiv.className = 'comment';
      commentDiv.dataset.commentId = comment.comment_id;

      commentDiv.innerHTML = `
        <p><strong>${comment.user_name || 'User'}:</strong></p>
        <p class="comment-text">${escapeHtml(comment.comment)}</p>
        <p><small>Posted on: ${new Date(comment.created_at).toLocaleString()}</small></p>
        ${canModify ? `
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        ` : ''}
      `;

      container.appendChild(commentDiv);
    });

    // Attach event listeners for edit and delete
    container.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', onEditComment);
    });

    container.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', onDeleteComment);
    });

  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Error loading comments. Please try again later.</p>';
  }
}

loadReviewComments();
