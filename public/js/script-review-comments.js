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
