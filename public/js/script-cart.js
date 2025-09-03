//rontend JavaScript example to fetch and display cart items (public/js/script-cart.js)
async function fetchCartItems() {
  try {
    const response = await fetch('/api/cart-items');
    if (!response.ok) throw new Error('Failed to fetch cart items');
    const cartItems = await response.json();
    renderCartItems(cartItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
  }
}

function renderCartItems(cartItems) {
  const container = document.getElementById('cart-items-list');
  container.innerHTML = '';

  if (cartItems.length === 0) {
    container.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  cartItems.forEach(item => {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
      <h4>${item.name}</h4>
      <p>Quantity: ${item.quantity}</p>
      <p>Price per unit: $${item.price_at_purchase}</p>
      <p>Total: $${(item.price_at_purchase * item.quantity).toFixed(2)}</p>
      <button onclick="removeCartItem(${item.cart_item_id})">Remove</button>
    `;
    container.appendChild(div);
  });
}

async function removeCartItem(cartItemId) {
  try {
    const response = await fetch(`/api/cart-items/${cartItemId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to remove item');
    await fetchCartItems();  // Refresh cart display
  } catch (error) {
    console.error('Error removing cart item:', error);
  }
}

// Call this on page load or when user navigates to cart page
fetchCartItems();
