async function loadReviewComments() {
  const params = new URLSearchParams(window.location.search);
  const reviewId = params.get('reviewId');

  const container = document.getElementById('review-comment-container');
  if (!reviewId) {
    container.innerHTML = '<p>No review specified.</p>';
    return;
  }

  container.innerHTML = 'Loading comments...';

  try {
    const response = await fetch(`/api/review-comments/${reviewId}`);
    if (!response.ok) throw new Error('Failed to fetch comments');

    const comments = await response.json();

    if (comments.length === 0) {
      container.innerHTML = '<p>No comments yet for this review.</p>';
      return;
    }

    let html = '';

    comments.forEach(comment => {
    const commentDate = new Date(comment.created_at).toLocaleDateString();
    html += `
    <div class="comment-block">
      <p><strong>${comment.user_name}</strong></p>
      <p>${comment.comment}</p>
      <p><em>${commentDate}</em></p>
    </div>
  `;
});

container.innerHTML = html;

  } catch (error) {
    console.error(error);
    container.innerHTML = '<p>Error loading comments.</p>';
  }
}

window.addEventListener('DOMContentLoaded', loadReviewComments);
