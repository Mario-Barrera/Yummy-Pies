let cart = [];
let total = 0;

const orderListEl = document.querySelector("#orderList");
const emptyMessageEl = document.querySelector(".empty-message");
const orderTotalEls = document.querySelectorAll(".order-total");

function addItemToCart(productId, quantity) {
  console.log(`addItemToCart called with ID: ${productId}, quantity: ${quantity}`);
  const buttons = document.querySelectorAll(".order-btn");

  for (const btn of buttons) {
    const onclickAttr = btn.getAttribute("onclick");
    if (onclickAttr && onclickAttr.includes(`addItemToCart(${productId},`)) {
      const pieText = btn.previousElementSibling.textContent.trim();
      const priceMatch = pieText.match(/\$([\d.]+)/);
      const name = pieText.replace(/\$\d+\.\d+/, "").trim();
      const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
      const imgSrc = btn.closest(".content")?.querySelector("img")?.src || "https://via.placeholder.com/50";

      for (let i = 0; i < quantity; i++) {
        addToCart(name, price, imgSrc);
      }

      break;
    }
  }
}


function addToCart(name, price, imgSrc) {
  const existingItem = cart.find(i => i.name === name);
  if (existingItem) {
    existingItem.qty++;
  } else {
    cart.push({ name, price, qty: 1, imgSrc });
  }

  total += price;
  updateCartDisplay();
}

function updateCartDisplay() {
  orderListEl.innerHTML = "";

  if (cart.length === 0) {
    emptyMessageEl.style.display = "block";
  } else {
    emptyMessageEl.style.display = "none";
  }

  cart.forEach(item => {
    const itemEl = document.createElement("div");
    itemEl.className = "order-item";

    itemEl.innerHTML = `
      <img src="${item.imgSrc}" alt="${item.name}" class="order-img-small">
      <span class="pie-name">${item.name}</span>
      <span>Qty:</span>
      <button class="qty-minus">−</button>
      <input type="number" class="qty-input" value="${item.qty}" min="1">
      <button class="qty-plus">+</button>
      <button class="remove-item">🗑️</button>
    `;

    // Quantity controls
    itemEl.querySelector(".qty-minus").addEventListener("click", () => {
      if (item.qty > 1) {
        item.qty--;
        total -= item.price;
        updateCartDisplay();
      }
    });

    itemEl.querySelector(".qty-plus").addEventListener("click", () => {
      item.qty++;
      total += item.price;
      updateCartDisplay();
    });

    itemEl.querySelector(".qty-input").addEventListener("change", e => {
      const newQty = Math.max(1, parseInt(e.target.value) || 1);
      total += (newQty - item.qty) * item.price;
      item.qty = newQty;
      updateCartDisplay();
    });

    itemEl.querySelector(".remove-item").addEventListener("click", () => {
      total -= item.price * item.qty;
      cart = cart.filter(c => c !== item);
      updateCartDisplay();
    });

    orderListEl.appendChild(itemEl);
  });

  orderTotalEls.forEach(el => {
    el.textContent = `Total: $${total.toFixed(2)}`;
  });
}
