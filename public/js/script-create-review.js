document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.manage-profile-form'); // match your form class
  const cancelBtn = document.getElementById('cancelButton');
  const token = localStorage.getItem('token');

  if (!form || !token) {
    alert('Something went wrong. Please reload the page.');
    return;
  }

  // Assuming you have this function somewhere to load product options:
  async function loadProductNamesIntoDropdown() {
    try {
      const response = await fetch('/api/orders/my-orders-with-items', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch orders');

      const orders = await response.json();
      const productMap = new Map();

      orders.forEach(order => {
        order.items.forEach(item => {
          if (item.product_id && item.product_name) {
            productMap.set(item.product_id, item.product_name);
          }
        });
      });

      const select = document.getElementById('product-select');
      select.innerHTML = '<option value="">Select a product</option>';

      productMap.forEach((name, id) => {
        const option = document.createElement('option');
        option.value = id;       // product_id as value
        option.textContent = name; // product name as display text
        select.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading product names:', err);
    }
  }

  loadProductNamesIntoDropdown();

  // Handle form submission for review creation
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = form.querySelector('#product-select').value;
    const rating = form.querySelector('#rating').value;
    const reviewText = form.querySelector('#review').value.trim();

    if (!productId || !rating) {
      alert('Please select a product and enter a rating.');
      return;
    }

    const reviewData = {
      product_id: Number(productId),
      rating: Number(rating),
      comment: reviewText || null  // comment can be null if empty
    };

    try {
      const res = await fetch('/api/review/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Server error:', error);
      throw new Error(error.error || 'Failed to submit review.');
    }

    const createdReview = await res.json();

    alert('Product review submitted successfully!');
    window.location.href = '/account-profile.html';

  } catch (err) {
    console.error('Error submitting review:', err);
    alert(`Failed to submit product review. ${err.message}`);
  }

});

  // Handle cancel button click
  cancelBtn.addEventListener('click', () => {
    // Optionally clear form inputs or redirect
    form.reset(); // clears all inputs to default values
    window.location.href = '/account-profile.html'; // redirect as per your original flow
  });
});
