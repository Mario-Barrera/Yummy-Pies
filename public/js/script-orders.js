// backend route (/my-orders) will fetche only the logged-in user’s orders. 
// But to display that order history on the user’s profile page, I need to write some frontend JavaScript


async function loadOrderHistory() {
  try {
    const response = await fetch('/api/orders/my-orders-with-items', { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch orders');
    const orders = await response.json();

    const container = document.getElementById('order-history');
    container.innerHTML = ''; // clear existing

    if (orders.length === 0) {
      container.innerHTML = '<p>No orders found.</p>';
      return;
    }

    orders.forEach(order => {
      // Format the order date nicely
      const orderDate = new Date(order.order_date).toLocaleDateString();

      // Create a container for this order
      const orderEl = document.createElement('div');
      orderEl.classList.add('order');

      // Header with order info and date
      orderEl.innerHTML = `
        <h3>Order #${order.order_id} - Date: ${orderDate}</h3>
      `;

      // Create a list for the products in this order
      const itemsList = document.createElement('ul');
      itemsList.classList.add('order-items');

      order.items.forEach(item => {
        const itemEl = document.createElement('li');
        itemEl.textContent = `${item.product_name} — Quantity: ${item.quantity}`;
        itemsList.appendChild(itemEl);
      });

      orderEl.appendChild(itemsList);
      container.appendChild(orderEl);
    });
  } catch (error) {
    console.error(error);
    const container = document.getElementById('order-history');
    container.innerHTML = `<p>Unable to load your orders. Please try again later.</p>`;
  }
}

window.onload = loadOrderHistory;

