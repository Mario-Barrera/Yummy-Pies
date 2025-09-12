// Load and display reviews on edit-review-comments.html
async function loadReviewComments() {
  try {
    const res = await fetch('/api/reviews', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch reviews');
    }

    const reviews = await res.json();

    const tableBody = document.querySelector('#comments-table-body'); // Make sure your HTML has this ID
    tableBody.innerHTML = ''; // Clear old data

    reviews.forEach(review => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${review.productName}</td>
        <td>${review.rating}</td>
        <td>${review.comment}</td>
      `;
      tableBody.appendChild(row);
    });

  } catch (err) {
    console.error('Error loading comments:', err);
    alert('Could not load review comments.');
  }
}

document.addEventListener('DOMContentLoaded', loadReviewComments);
