async function loadComments() {
  const container = document.getElementById("review-comment-container");

  if (!container) {
    console.warn("Comment container not found.");
    return;
  }

  try {
    // get reviewId from URL
    const params = new URLSearchParams(window.location.search);                              // 'window.location.search' will return the query string of the URL, for example: ?reviewId=7
    const reviewId = params.get("reviewId");                                                // .get() looks inside the URL parameter and will return the value for reviewId

    if (!reviewId) {
      container.textContent = "Invalid review";
      return;
    }

    const response = await fetch(`/api/comments?review_id=${reviewId}`);                    // associated code: routes/comments.js  lines 37 - 76

    if (!response.ok) {
      throw new Error("Failed to fetch comments");
    }

    const data = await response.json();
    const comments = data.items || [];

    if (comments.length === 0) {
      container.textContent = "No comments yet";
      return;
    }

    container.innerHTML = "";

    comments.forEach(function (comment) {
      const div = document.createElement("div");
      div.className = "review-comment";

      const createdDate = new Date(comment.created_at).toLocaleDateString();

      div.innerHTML = `
      <h3>Comment</h3>

      <p>By: ${comment.user_name}</p>
      
      <p>${comment.comment}</p>
      <p>Created: ${createdDate}</p>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Failed to load comments:", err);
    container.textContent = "Error loading comments.";
  }
}

async function submitComment(event) {
  event.preventDefault();

  const token = getToken();

  if (!token) {
    alert("You must be logged in to leave a comment.");
    window.location.href = "account-login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const reviewId = params.get("reviewId");

  if (!reviewId) {
    alert("Missing review id");
    return;
  }

  const commentInput = document.getElementById("comment");
  const comment = commentInput ? commentInput.value.trim() : "";

  if (!comment) {
    alert("Comment cannot be empty.");
    return;
  }

  try {
    const response = await fetch("/api/comments", {                                   // associated code: routes/comments.js  lines 78 - 120
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        review_id: reviewId,
        comment
      })
    });

    const data = await safeJson(response);

    if (!response.ok) {
      const message = data?.error || "Failed to submit comment.";
      alert(message);
      return;
    }

    alert("Comment submitted successfully.");

    const commentForm = document.getElementById("commentForm");

    if (commentForm) {
      commentForm.reset();
    }

    loadComments();

  } catch (err) {
    console.error("Comment submission failed:", err);
    alert("Network error. Please try again.");
  }
}

async function updateComment(commentId, commentText) {
  const id = Number(commentId);

  if (!Number.isInteger(id) || id <= 0) {
    alert("Invalid comment id");
    return;
  }

  const comment = commentText.trim();

  if (!comment) {
    alert("Comment cannot be empty.");
    return;
  }

  try {
    const response = await fetch(`/api/comments/${id}`, {                                 // associated code: routes/comments.js  lines 122 - 171
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        comment
      })
    });

    const data = await safeJson(response);

    if (!response.ok) {
      const message = data?.error || "Failed to update comment";
      alert(message);
      return;
    }

    alert("Comment updated successfully.");

    loadComments();
    
  } catch (err) {
    console.error("Comment update failed:", err);
    alert("Network error. Please try again.");
  }
}

async function deleteComment(commentId) {
  const id = Number(commentId);

  if (!Number.isInteger(id) || id <= 0) {
    alert("Invalid comment ID.");
    return;
  }

  if (!confirm("Are you sure you want to delete this comment?")) {
    return;
  }

  try {
    const response = await fetch(`/api/comments/${id}`, {                               // associated code: router/comments.js   lines 173 - 212
      method: "DELETE",               
      headers: getAuthHeaders()
    });

    const data = await safeJson(response);

    if (!response.ok) {
      const message = data?.error || "Failed to delete comment.";
      alert(message);
      return;
    }

    alert("Comment deleted successfully.");

    loadComments();

  } catch (err) {
    console.error("Comment delete failed:", err);
    alert("Network error. Please try again.");
  }
}

const commentForm = document.getElementById("commentForm");

if (commentForm) {
  commentForm.addEventListener("submit", submitComment);
}

const commentContainer = document.getElementById("review-comment-container");

if (commentContainer) {
  loadComments();
}