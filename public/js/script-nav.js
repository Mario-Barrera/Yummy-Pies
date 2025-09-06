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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/user-status');
    const data = await res.json();

    const accountLink = document.querySelector('#account-login-link'); // your link needs an ID or class
    if (accountLink && data.loggedIn) {
      accountLink.href = '/account/profile';
      accountLink.textContent = 'My Profile';
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
});
