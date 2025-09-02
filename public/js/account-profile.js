document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Redirect to login if not authenticated
    window.location.href = 'account-login.html';
    return;
  }

  const user = JSON.parse(localStorage.getItem('user'));

  // DOM elements
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profilePhone = document.getElementById('profile-phone');
  const profileAddress = document.getElementById('profile-address');
  const ordersList = document.getElementById('orders-list');
  const reviewsList = document.getElementById('reviews-list');
  const commentsList = document.getElementById('comments-list');
  const logoutBtn = document.getElementById('logout');

  try {
    // Fetch full user profile
    const profileRes = await fetch('/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!profileRes.ok) throw new Error('Failed to fetch user profile');
    const profileData = await profileRes.json();

    // Populate DOM
    profileName.textContent = profileData.name;
    profileEmail.textContent = profileData.email;
    profilePhone.textContent = profileData.phone || 'N/A';
    profileAddress.textContent = profileData.address || 'N/A';

    const userId = profileData.id;

    // Fetch user orders
    const ordersRes = await fetch(`/orders/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const ordersData = ordersRes.ok ? await ordersRes.json() : [];
    ordersList.innerHTML = ordersData.length
      ? ordersData.map(order => `
          <li>
            <strong>${order.item}</strong> - ${order.date} - ${order.status}
          </li>
        `).join('')
      : '<li>No past orders.</li>';

    // Fetch user reviews
    const reviewsRes = await fetch(`/reviews/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const reviewsData = reviewsRes.ok ? await reviewsRes.json() : [];
    reviewsList.innerHTML = reviewsData.length
      ? reviewsData.map(review => `
          <li id="review-${review.id}">
            <p>${review.content}</p>
            <button class="edit-review" data-id="${review.id}">Edit</button>
            <button class="delete-review" data-id="${review.id}">Delete</button>
          </li>
        `).join('')
      : '<li>No reviews yet.</li>';

    // Fetch user comments
    const commentsRes = await fetch(`/reviewComments/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const commentsData = commentsRes.ok ? await commentsRes.json() : [];
    commentsList.innerHTML = commentsData.length
      ? commentsData.map(comment => `
          <li id="comment-${comment.id}">
            <p>${comment.content}</p>
            <button class="edit-comment" data-id="${comment.id}">Edit</button>
            <button class="delete-comment" data-id="${comment.id}">Delete</button>
          </li>
        `).join('')
      : '<li>No comments yet.</li>';

    // Add event listeners for Edit/Delete reviews
    reviewsList.addEventListener('click', async (e) => {
      if (e.target.classList.contains('edit-review')) {
        const reviewId = e.target.dataset.id;
        const newContent = prompt('Edit your review:', e.target.previousElementSibling.textContent);
        if (newContent) {
          const res = await fetch(`/reviews/${reviewId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: newContent })
          });
          if (res.ok) e.target.previousElementSibling.textContent = newContent;
        }
      } else if (e.target.classList.contains('delete-review')) {
        const reviewId = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this review?')) {
          const res = await fetch(`/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) document.getElementById(`review-${reviewId}`).remove();
        }
      }
    });

    // Add event listeners for Edit/Delete comments
    commentsList.addEventListener('click', async (e) => {
      if (e.target.classList.contains('edit-comment')) {
        const commentId = e.target.dataset.id;
        const newContent = prompt('Edit your comment:', e.target.previousElementSibling.textContent);
        if (newContent) {
          const res = await fetch(`/reviewComments/${commentId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: newContent })
          });
          if (res.ok) e.target.previousElementSibling.textContent = newContent;
        }
      } else if (e.target.classList.contains('delete-comment')) {
        const commentId = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this comment?')) {
          const res = await fetch(`/reviewComments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) document.getElementById(`comment-${commentId}`).remove();
        }
      }
    });

  } catch (err) {
    console.error('Error loading profile page:', err);
    alert('Failed to load profile data. Please try again later.');
  }

  // Logout button
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'account-login.html';
  });

});
