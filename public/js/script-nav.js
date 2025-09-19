async function updateCartCount() {
  try {
    const token = localStorage.getItem('token'); // or however you store your JWT

    const res = await fetch('/api/cart-items', {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      credentials: 'include', // optional, depending on your backend setup
    });

    if (!res.ok) throw new Error('Could not fetch cart');

    const items = await res.json();

    const cartCountElement = document.getElementById('cart-count');
    if (!cartCountElement) {
      console.warn('Cart count element not found.');
      return; 
    }

    cartCountElement.textContent = itemCount > 0 ? `Order Online (${itemCount})` : "Order Online";

  } catch (err) {
    console.warn('Cart count fetch failed:', err);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = 0;
    }
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
      const reviewGuidance = document.getElementById('review-guidance')

      // Make sure userNameSpan exists before accessing
      if (userNameSpan) {
        userNameSpan.textContent = data.user.name || 'User';
      }

      if (userGreeting) userGreeting.style.display = 'block';

      if (reviewGuidance) reviewGuidance.style.display = 'block';

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

    const reviewGuidance = document.getElementById('review-guidance');
    if (reviewGuidance) reviewGuidance.style.display = 'none';

    // Show login message
    const loginMessage = document.getElementById('login-message');
    if (loginMessage) loginMessage.style.display = 'block';
  }
}

function updateOrderOnlineLink() {
    const link = document.getElementById("order-online-link");
    if (!link) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const formState = JSON.parse(localStorage.getItem("formState") || "{}");

    const iconHTML = '<i class="fa-solid fa-cart-shopping"></i> ';

    // Use innerHTML instead of textContent
    link.innerHTML = iconHTML + "Order Online";

    if (user && formState.cart && formState.cart.length > 0) {
        link.innerHTML = iconHTML + `Order Online(${formState.cart.length})`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  updateUserUI();
  updateOrderOnlineLink();
});
