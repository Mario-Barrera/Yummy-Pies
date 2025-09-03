// script-review-comments.js

document.addEventListener('DOMContentLoaded', async () => {
    const commentsContainer = document.querySelector('.review-comments-list');

    // Get the reviewId from the URL query parameter
    const params = new URLSearchParams(window.location.search);
    const reviewId = params.get('reviewId');

    if (!reviewId) {
        commentsContainer.innerHTML = `<p>No review ID provided in the URL.</p>`;
        return;
    }

    try {
        // Fetch comments for this specific review
        const response = await fetch(`/review-comments/public/${reviewId}`);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const comments = await response.json();

        if (comments.length === 0) {
            commentsContainer.innerHTML = `<p>No comments yet for this review.</p>`;
            return;
        }

        // Display each comment
        commentsContainer.innerHTML = comments.map(comment => `
            <div class="review-comment">
                <div class="comment-header">
                    <strong>${comment.user_name}</strong> 
                    <p class="comment-text">
                        ${comment.comment}
                    </p>
                </div>
                <span class="comment-date">${new Date(comment.created_at).toLocaleDateString()}</span>
            </div>
        `).join('');

    } catch (err) {
        commentsContainer.innerHTML = `<p>Error loading comments: ${err.message}</p>`;
        console.error(err);
    }
});



// addition code I might need to add
fetch('/api/review-comments/my-comments')  // custom endpoint for current user
  .then(res => {
    if (!res.ok) throw new Error('Failed to fetch review comments');
    return res.json();
  })
  .then(comments => {
    renderUserReviewComments(comments);  // render in the DOM
  })
  .catch(err => {
    console.error('Error loading review comments:', err);
  });


  function renderUserReviewComments(comments) {
  const container = document.getElementById('user-review-comments-list');
  container.innerHTML = '';

  if (comments.length === 0) {
    container.innerHTML = '<p>You have not posted any review comments.</p>';
    return;
  }

  comments.forEach(comment => {
    const div = document.createElement('div');
    div.classList.add('user-comment');
    div.innerHTML = `
      <h4>Comment on Review #${comment.review_id}</h4>
      <p>${comment.comment}</p>
      <small>Posted on: ${new Date(comment.created_at).toLocaleString()}</small>
    `;
    container.appendChild(div);
  });
}
