async function loadAllReviews() {
  const container = document.getElementById('reviews-container');

  if (!container) {
    console.warn("Reviews container element not found.");
    return;
  }

  try {
    const response = await fetch("/api/reviews");                                 // associated code: routes/reviews.js  lines 40 -80

    if (!response.ok) {
      throw new Error(`Failed to fetch reviews (status ${response.status})`);
    }

    const data = await response.json();
    const reviews = data.items || [];                                       // [] is a fallback value

    if (reviews.length === 0) {
      container.textContent = 'No reviews found.';
      return;
    }

    container.innerHTML = '';                                               // Clear loading text

    reviews.forEach(function (review) {
      const reviewDiv = document.createElement('div');
      reviewDiv.className = 'review';

      const rawProductName = review.product_name || "Unknown product name";
      const cleanProductName = rawProductName
        .replace(/\b(Slice|Whole)\b/g, "")                          // '\b' is word boundary, to ensure it matches the whole word
        .replace(/\s+/g, " ")                                       // '\s' represents any whitespace character
        .trim();
      
      const createdAt = review.created_at ? new Date(review.created_at) : null;
      const updatedAt = review.updated_at ? new Date(review.updated_at) : null;

      const createdDate = createdAt
        ? createdAt.toLocaleDateString() 
        : "Unknown date";

      const showUpdated = updatedAt && createdAt && updatedAt.getTime() !== createdAt.getTime();

      const updatedDate = showUpdated ? updatedAt.toLocaleDateString() : null;

      reviewDiv.innerHTML = `
        <h3>Product: ${cleanProductName}</h3>

        <p class="comment-container">
          <a href="comments.html?reviewId=${review.review_id}">💬 Comments</a>
          <!-- ? separates the page path from the query parameters -->       
        </p>
  
        <p>By: ${review.user_name || "Anonymous"}</p>
   
        <p class="rating">
          <span class="filled-stars">${'★'.repeat(review.rating || 0)}</span>
          <span class="empty-stars">${'☆'.repeat(5 - (review.rating || 0))}</span>
          <!-- 5 represents the maximum number of stars in the rating system -->
        </p>

        <p>Review: ${review.review || "No review provided"}</p>
  
        <p>Created: ${createdDate}</p>
          ${updatedDate ? `<p>Updated: ${updatedDate}</p>` : ""}
      `;

      container.appendChild(reviewDiv);
    });

  } catch (err) {
    console.error("Error loading reviews:", err);
    container.innerHTML = '<p class="error">Error loading reviews. Please try again later.</p>';
  }
}

async function submitReview(event) {
  event.preventDefault();

  const productSelect = document.getElementById("product-select");
  const ratingInput = document.getElementById("rating");
  const reviewInput = document.getElementById("review");

  const product_id = productSelect.value;
  const rating = ratingInput.value;
  const review = reviewInput.value.trim();

  const token = getToken();

  if (!token) {
    alert("You must be logged in to submit a review.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("/api/reviews", {                                // associated code: routes/reviews.js  lines 82 - 126
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        product_id,
        rating,
        review
      })
    });
  
    const data = await safeJson(response);

    if (!response.ok) {
      const message = data?.error || "Failed to submit review.";
      alert(message);
      return;
    }

    alert("Review submitted successfully.");

    document.getElementById("reviewForm").reset();                    // clears the form fields after a successful submission

  } catch (err) {
    console.error("Review subission failed:", err);
    alert("Network error. Please try again");
  }
}

async function updateReview(reviewId, rating, review) {
  const id = Number(reviewId);

  if (!Number.isInteger(id) || id <= 0) {
    alert("Invalid review id");
    return;
  }

  const body = {};

  if (rating !== undefined && rating !== "") {
    body.rating = Number(rating);
  }

  if (review !== undefined) {
    body.review = review.trim();
  }

  if (body.rating === undefined && body.review === undefined) {
    alert("No changes to update");
    return;
  }

  try {
    const response = await fetch(`/api/reviews/${id}`, {                              // associated code routes/reviews.js  lines 128 - 197
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await safeJson(response);

    if (!response.ok) {
      alert(data?.error || "Failed to update review");
      return;
    }

    alert("Review updated successfully");

  } catch (err) {
    console.error("Update failed:", err);
    alert("Network error. Please try again.");
  }
}

async function deleteReview(reviewId) {
  if (!confirm("Are you sure you want to delete this review?")) {            // confirm() is a built-in browser dialog function used to ask the user a yes/no question before performing an action
    return;
  }

  try {
    const response = await fetch(`/api/reviews/${reviewId}`, {                              // associated code: routes/reviews.js   lines 199 - 232
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  
    const data = await safeJson(response);

    if (!response.ok) {
      alert(data?.error) || "Failed to delete review";
      return;
    }

    alert("Review deleted successfully.");

  } catch (err) {
    console.error("Delete failed:", err);
    alert("Network error. Please try again.");
  }
}

const reviewForm = document.getElementById("reviewForm");

if (reviewForm) {
  reviewForm.addEventListener("submit", submitReview);
}

const reviewContainer = document.getElementById("reviews-container");

if (reviewContainer) {
  loadAllReviews();
}
