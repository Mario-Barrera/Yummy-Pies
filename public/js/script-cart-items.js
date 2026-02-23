document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll(".order-btn");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      const card = button.closest(".content");
      const textElement = card.querySelector(".pie-text");

      const id = button.dataset.productId;
      const pieText = textElement.textContent.trim();

      const priceMatch = pieText.match(/\$([\d.]+)/);
      const price = priceMatch ? Number(priceMatch[1]) : NaN;

      const name = pieText.replace(/\$[\d.]+/, "").trim();

      if (!id || !name || !Number.isFinite(price)) return;

      addToCart(id, name, price);
      renderCart();
    });
  });

  renderCart();
});

function addToCart(id, name, price) {
  const cart = orderFormData.orderNowList || (orderFormData.orderNowList = []);

  const existing = cart.find(function (item) {
    return item.id === id;
  });

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: id, name: name, price: price, qty: 1 });
  }
}

function renderCart() {
  const listElement = document.querySelector(".orderNow-list");
  const totalElement = document.querySelector(".order-total");

  if (!listElement || !totalElement) return;

  listElement.innerHTML = "";
  let total = 0;

  orderFormData.orderNowList.forEach(function (item) {
    const row = document.createElement("div");
    row.className = "cart-row";

    const textSpan = document.createElement("span");
    textSpan.textContent = `${item.name} x ${item.qty} — $${(item.price * item.qty).toFixed(2)}`;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "cart-remove";
    removeBtn.textContent = "🗑️";
    removeBtn.addEventListener("click", function () {
      removeItem(item.id);
    });

    row.appendChild(textSpan);
    row.appendChild(removeBtn);
    listElement.appendChild(row);

    total += item.price * item.qty;
  });

  totalElement.textContent = `Total: $${total.toFixed(2)}`;
}

function removeItem(id) {
  orderFormData.orderNowList = orderFormData.orderNowList.filter(
    function (item) {
      return item.id !== id;
    },
  );

  renderCart();
}
