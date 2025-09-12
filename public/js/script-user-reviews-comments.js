function renderComments(comments) {
  comments.forEach(comment => {
    const createdAt = new Date(comment.created_at).toLocaleDateString();
    const updatedAt = comment.updated_at ? new Date(comment.updated_at).toLocaleDateString() : 'N/A';
    console.log(`Comment on ${comment.product_name} (Rating: ${comment.rating})`);
    console.log(`Created: ${createdAt}, Updated: ${updatedAt}`);
    console.log(comment.comment);
  });
}

async function loadUserReviewComments() {
  const container = document.getElementById('user-review-comments');

  if (!container) {
    console.error('Container element not found!');
    return;
  }

  try {
    const response = await fetch('/api/review-comments/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // send cookies with the request
    });

    if (!response.ok) throw new Error('Failed to fetch user comments.');

    const comments = await response.json();

    if (comments.length === 0) {
      container.innerHTML = '<p id="no-commentHistory-message">You haven’t posted any comments yet.</p>';
      return;
    }

    // Call the renderComments function to log comments or do any extra handling
    renderComments(comments);

    let html = `
      <table class="user-reviews-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Date Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
    `;

    comments.forEach(comment => {
      const createdAt = new Date(comment.created_at).toLocaleDateString();
      const updatedAt = comment.updated_at ? new Date(comment.updated_at).toLocaleDateString() : 'N/A';

      html += `
        <tr>
          <td>${comment.product_name}</td>
          <td>${comment.rating}</td>
          <td>${comment.comment}</td>
          <td>${createdAt}</td>
          <td>${updatedAt}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;

  } catch (error) {
    console.error('Error fetching user review comments:', error);
    container.innerHTML = '<p>Unable to load your comments. Please try again later.</p>';
  }
}

window.addEventListener('DOMContentLoaded', loadUserReviewComments);
