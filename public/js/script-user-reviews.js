// logged-in User accessible, fetches and displays all reviews

async function loadUserReviews() {
  const container = document.getElementById('user-reviews');

  if (!container) {
    console.warn('User reviews container element not found');
    return;
  }

  const token = localStorage.getItem('token');

  if (!token) {
    container.innerHTML = '<p class="error">You are not logged in. Please log in to see your reviews.</p>';
    return;
  }

  try {
    const response = await fetch('/api/reviews/user', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      container.innerHTML = '<p class="error">Session expired or unauthorized. Please log in again.</p>';
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch your reviews');
    }

    const reviews = await response.json();

    if (reviews.length === 0) {
      container.textContent = 'You have no reviews yet.';
      return;
    }

    container.innerHTML = ''; // Clear previous content

    // Create table element
    const table = document.createElement('table');
    table.className = 'user-reviews-table'; // add class for styling if you want

    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Product</th>
        <th>Rating</th>
        <th>Comment</th>
        <th>Date Created</th>
        <th>Updated</th>
      </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    reviews.forEach(review => {
  const cleanProductName = review.product_name.replace(/\b(Slice|Whole)\b/g, '').trim();

  const createdDate = new Date(review.created_at).toLocaleDateString();
  const updatedDate = review.updated_at ? new Date(review.updated_at).toLocaleDateString() : null;
  const showUpdated = updatedDate && updatedDate !== createdDate;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${cleanProductName}</td>
    <td>${review.rating}</td>
    <td>${review.comment || 'No comment'}</td>
    <td>${createdDate}</td>
    <td>${showUpdated ? updatedDate : ''}</td>
  `;
  tbody.appendChild(tr);
});

  table.appendChild(tbody);
  container.appendChild(table);
  
} catch (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Error loading your reviews. Please try again later.</p>';
  }
}

// Call on page load
loadUserReviews();
