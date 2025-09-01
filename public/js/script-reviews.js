document.addEventListener('DOMContentLoaded', async () => {
    const reviewsContainer = document.querySelector('.reviews-list'); // adjust selector as needed

    try {
        const response = await fetch('/reviews/all'); // or your endpoint to fetch all reviews
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const reviews = await response.json();

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
                            <a href="review-comments.html?reviewId=${review.review_id}">
                                View all comments
                            </a>
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
