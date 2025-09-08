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

async function updateUserUI() {
  try {
    // Fetch user session status
    const res = await fetch('/api/user-status', {
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to fetch user status');

    const data = await res.json();

    if (data.loggedIn) {
      // User is logged in, update UI accordingly
      console.log('User is logged in:', data.user);

      const userGreeting = document.getElementById('user-greeting');
      const userNameSpan = userGreeting.querySelector('.user-name');

      // Make sure userNameSpan exists before accessing
      if (userNameSpan) {
        userNameSpan.textContent = data.user.name || 'User'; // adjust this if your user object has a different field
      }

      if (userGreeting) userGreeting.style.display = 'block';

      // Hide login message
      const loginMessage = document.getElementById('login-message');
      if (loginMessage) loginMessage.style.display = 'none';
    } else {
      // User not logged in, show login message and hide greeting
      throw new Error('User not logged in');
    }
  } catch (err) {
    console.log(err.message);

    // Hide greeting UI
    const userGreeting = document.getElementById('user-greeting');
    if (userGreeting) userGreeting.style.display = 'none';

    // Show login message
    const loginMessage = document.getElementById('login-message');
    if (loginMessage) loginMessage.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  updateUserUI();
});
