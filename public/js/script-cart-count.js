// Get cart count for current user
function getCartItemCount() {
  const savedFormState = localStorage.getItem("formState");
  if (!savedFormState) return 0;

  const formState = JSON.parse(savedFormState);
  if (!formState.cart || !Array.isArray(formState.cart)) return 0;

  // Sum all quantities
  return formState.cart.reduce((total, item) => total + (item.qty || 0), 0);
}

// Update cart count in nav
function updateOrderOnlineLink() {
  const orderLink = document.getElementById("order-online-link");
  if (!orderLink) return;

  const count = getCartItemCount();
  const iconHTML = '<i class="fa-solid fa-cart-shopping"></i>';

  if (count > 0) {
    orderLink.innerHTML = `${iconHTML} Order Online (${count})`;
  } else {
    orderLink.innerHTML = `${iconHTML} Order Online`;
  }
}

// Save cart into the same formState object
function saveCart(cart) {
  const saved = JSON.parse(localStorage.getItem("formState") || "{}");
  saved.cart = cart;
  localStorage.setItem("formState", JSON.stringify(saved));
}

// Clear cart in formState by emptying the cart array
function clearCartOnLogout() {
  const saved = JSON.parse(localStorage.getItem("formState") || "{}");
  saved.cart = [];
  localStorage.setItem("formState", JSON.stringify(saved));
}

// Initialize cart count display on page load
document.addEventListener("DOMContentLoaded", () => {
  updateOrderOnlineLink();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Remove user/session info
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Remove entire formState, clearing cart and any saved data
      localStorage.removeItem("formState");

      // Redirect to login page
      window.location.href = "/account-login.html";
    });
  }
});

