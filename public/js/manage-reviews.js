
// --------------- Helper functions ---------------

function getToken() {
    return localStorage.getItem("token");
}

function getAuthHeaders() {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        Authorizaiton: `Bearer ${token}`
    };
}

async function safeJson(response) {                                                 // safely parse JSON only if the response content type is application/json
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }

    return null;
}

// --------------- Load logged-in user's reviews ---------------

async function loadMyReviews() {
    const container = document.getElementById("edit-reviews");

    if (!container) {
        return;
    }

    const token = getToken();

    if (!token) {
        container.innerHTML = "<p>Please log in to view your reviews.</p>";
        return;
    }

    try {
        const response = await fetch("/api/reviews/me", {
            headers: getAuthHeaders()
        });

        const data = await safeJson(response);

        if (!response.ok) {
            container.innerHTML = `<p>${data?.error || "Unable to load reviews."}</p>`;
            return;
        }

        renderMyReviews(data?.items || []);

    } catch (err) {
        console.error("Failed to load user reviews:", err);
        container.innerHTML = "<p>Unable to load reviews.</p>";
    }
}

// --------------- Render reviews ---------------

function renderMyReviews(reviews) {
    const container = document.getElementById("edit-reviews");

    if (!container) {
        return;
    }

    if (!reviews.length) {
        container.innerHTML = "<p>You have not posted any reviews yet.</p>";
        return;
    }

    container.innerHTML = "";                                            // clears out any existing html inside the container before adding the new review cards

    reviews.forEach(function (review) {
        const card = document.createElement("div");
        card.className = "review-card";
        card.dataset.reviewId = review.review_id;

        const createdAt = review.created_at ? new Date(review.create_at) : null;
        const createdDate = createdAt && !Number.isNaN(createdAt.getTime())
            ? createdAt.toLocalDateString()
            : "Unknown date";
        
        const safeRating = Math.max(1, Math.min(5, Number(review.rating) || 1));                // 1 is the fallback default

        card.innerHTML = `
            <div class="review-view">
                <h3>${review.product_name || "Unknown product name"}</h3>
                <p class="rating">
                    <span class="filled-stars">${"★".repeat(safeRating)}</span>
                    <span class="empty-stars">${"☆".repeat(5 - safeRating)}</span>
                </p>
                
                <p><strong>Review: </strong> ${review.review || "No reviews provided."}</p>
                <p><strong>Created: </strong> ${createdDate}</p>

                <div class="review-action">
                    <button type="button" class="edit-review-btn">Edit</button>
                    <button type="button" class="delete-review-btn">Delete</button>
                </div>
            </div>

            <form class="review-edit-form" style="display: none;">
                <label>
                    Rating:
                    <!-- pre-select the users existing rating when the edit form is rendered -->
                    <select class="edit-review-rating">
                        <option value="1" ${safeRating === 1 ? "selected" : ""}>1</option>
                        <option value="2" ${safeRating === 2 ? "selected" : ""}>2</option>
                        <option value="3" ${safeRating === 3 ? "selected" : ""}>3</option>
                        <option value="4" ${safeRating === 4 ? "selected" : ""}>4</option>
                        <option value="5" ${safeRating === 5 ? "selected" : ""}>5</option>
                    </select>
                </label>

                <label>
                    Review:
                    <!-- pre-filled with the users existing review text -->
                    <textarea class = "edit-review-text" rows= "4">${review.review || ""}</textarea>
                </label>

                <div class="review-actions">
                    <button type="submit" class="save-review-btn">Save</button>
                    <button type="button" class="cancel-review-btn">Cancel</button>
                </div>
            </form>
        `;

        container.appendChild(card);
    });
}

