async function updateCartCount() {
  try {
    const res = await fetch('/api/cart-items', {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Could not fetch cart');

    const items = await res.json();
    document.getElementById('cart-count').textContent = items.length;
  } catch (err) {
    console.warn('Cart count fetch failed:', err);
    document.getElementById('cart-count').textContent = 0;
  }
}

document.addEventListener('DOMContentLoaded', updateCartCount);
