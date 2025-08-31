document.addEventListener('DOMContentLoaded', async () => {
    const reviewsContainer = document.querySelector('.reviews-list');

    try {
        // Fetch all reviews from the public route
        const response = await fetch('/reviews/all');
        if (!response.ok) throw new Error('Failed to fetch reviews');

        const reviews = await response.json();

        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p>No reviews yet.</p>';
            return;
        }

        reviewsContainer.innerHTML = reviews.map(review => {
            // Generate star rating
            const maxStars = 5;
            const stars = '★'.repeat(review.rating) + '☆'.repeat(maxStars - review.rating);

            return `
                <div class="review">
                    <div class="review-header">
                        <strong>${review.user_name}</strong>
                    </div>

                    <div class="review-stars-comments">
                        <div class="stars">${stars}</div>
                        <div class="comments-link">
                            <a href="review-comments.html">View all comments<i class="fa-solid fa-comment-dots"></i></a>
                        </div>
                    </div>

                    <div class="review-product">
                        <em>${review.product_name.replace(/\b(slice|whole)\b/gi, '').trim()} Pie</em>
                    </div>
                
                    <p class="review-text">
                        ${review.comment || ''}
                    </p>

                    <div class="review-date">
                        ${new Date(review.created_at).toLocaleDateString()}
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        reviewsContainer.innerHTML = `<p>Error loading reviews: ${err.message}</p>`;
        console.error(err);
    }
});
