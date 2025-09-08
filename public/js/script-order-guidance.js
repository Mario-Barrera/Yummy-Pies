/*
  Shows or hides the "Add items to start your order" placeholder (.order-guidance)
  depending on whether #orderList has items. Uses a MutationObserver to detect 
  added/removed items and handles remove-item button clicks. Runs on DOMContentLoaded.
*/

document.addEventListener("DOMContentLoaded", () => {
  const placeholderEl = document.querySelector(".order-guidance");
  const orderListEl = document.getElementById("orderList");

  // Function to show/hide placeholder
  function updatePlaceholder() {
    if (!placeholderEl || !orderListEl) return;
    placeholderEl.style.display = orderListEl.children.length === 0 ? "block" : "none";
  }

  // Initial check on page load
  updatePlaceholder();

  // Watch #orderList for changes (items added or removed)
  const observer = new MutationObserver(() => {
    updatePlaceholder();
  });

  observer.observe(orderListEl, { childList: true, subtree: true });

  // Optional: If you have "remove" buttons inside orderList, ensure placeholder updates when clicked
  orderListEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-item")) {
      e.target.closest(".order-item").remove();
      updatePlaceholder();
    }
  });
});

