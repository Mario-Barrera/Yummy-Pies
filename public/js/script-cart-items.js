
// Cart system, used to fetch and display the user's cart items.
// // Fetch & render cart items (fetchCartItems + renderCartItems)
async function fetchCartItems() {
  try {
    const response = await fetch('/api/cart-items', {
      credentials: 'include'  // include cookies if you use sessions
    });
    if (!response.ok) throw new Error('Failed to fetch cart items');
    const items = await response.json();
    renderCartItems(items);
  } catch (err) {
    console.error(err);
  }
}

function renderCartItems(items) {
  const container = document.getElementById('cart-items');
  container.innerHTML = ''; // clear existing

  if (items.length === 0) {
    container.innerHTML = '<p>Your cart is empty</p>';
    return;
  }

  items.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'cart-item';
    itemDiv.dataset.id = item.cart_item_id;
    itemDiv.innerHTML = `
      <img src="${item.image_key}" alt="${item.name}" width="50" />
      <span>${item.name}</span>
      <input type="number" min="1" value="${item.quantity}" class="quantity-input" />
      <button class="update-btn">Update</button>
      <button class="delete-btn">Remove</button>
    `;
    container.appendChild(itemDiv);
  });

  // Attach event listeners to buttons after rendering
  attachCartItemEventListeners();
}


// Attach event listeners for updating/removing cart items (attachCartItemEventListeners)
function attachCartItemEventListeners() {
  document.querySelectorAll('.update-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const itemDiv = e.target.closest('.cart-item');
      const cartItemId = itemDiv.dataset.id;
      const quantity = parseInt(itemDiv.querySelector('.quantity-input').value, 10);

      if (quantity < 1) {
        alert('Quantity must be at least 1');
        return;
      }

      try {
        const res = await fetch(`/api/cart-items/${cartItemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ quantity }),
        });

        if (!res.ok) throw new Error('Failed to update quantity');

        alert('Quantity updated!');
        fetchCartItems();  // Refresh UI
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Attach delete handlers
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const itemDiv = e.target.closest('.cart-item');
      const cartItemId = itemDiv.dataset.id;

      if (!confirm('Remove this item from cart?')) return;

      try {
        const res = await fetch(`/api/cart-items/${cartItemId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Failed to remove item');

        alert('Item removed!');
        fetchCartItems();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}


//Add new items to the cart (addItemToCart)
async function addItemToCart(productId, quantity) {
  try {
    const res = await fetch('/api/cart-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ product_id: productId, quantity }),
    });

    if (res.status === 409) {
      alert('Item already in cart');
      return;
    }

    if (!res.ok) throw new Error('Failed to add item');

    alert('Item added to cart!');
    fetchCartItems();
  } catch (err) {
    alert(err.message);
  }
}


// Merge local cart data with server cart on login (mergeLocalCart)
async function mergeLocalCart() {
  const localCart = JSON.parse(localStorage.getItem('cart')) || [];

  if (localCart.length === 0) return;

  try {
    const res = await fetch('/api/cart-items/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ items: localCart }),
    });

    if (!res.ok) throw new Error('Failed to merge cart');

    localStorage.removeItem('cart'); // clear local cart after merge
    alert('Cart merged successfully');
    fetchCartItems();
  } catch (err) {
    console.error(err);
  }
}


// Initialize fetching on page load (DOMContentLoaded listener)
document.addEventListener('DOMContentLoaded', () => {
  fetchCartItems();
});

