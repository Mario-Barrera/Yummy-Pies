async function loadOrderHistory() {
  try {
    const response = await fetch('/api/orders/my-orders-with-items', { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch orders');

    const orders = await response.json();

    console.log('API Response:', orders); 
    const container = document.getElementById('order-history');
    container.innerHTML = ''; // Clear existing content

    if (orders.length === 0) {
      container.innerHTML = '<p id="no-orderHistory-message">No orders found.</p>';
      return;
    }

    orders.forEach(order => {
      const orderTable = createOrderTable(order);
      container.appendChild(orderTable);
    });
  } catch (err) {
    console.error(err);
    document.getElementById('order-history').innerHTML = `<p>Unable to load your orders. Please try again later.</p>`;
  }
}

function formatTime(timeString) {
  if (!timeString) return 'N/A';

  const [hourStr, minuteStr] = timeString.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12; // Convert to 12-hour format
  return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}


function createOrderTable(order) {
  console.log('Order:', order);
  const {
    order_id,
    order_date,
    status,
    total_amount,
    fulfillment_method,
    delivery_partner,
    delivery_reference,
    delivery_status,
    estimated_delivery,
    pickup_time,
    email,
    items = []
  } = order;

  const table = document.createElement('table');
  table.classList.add('order-table');

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
  headerCell.colSpan = 10;  // Adjust if columns change
  headerCell.textContent = `Order #${order_id}`;
  headerRow.appendChild(headerCell);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  const headerLabels = [
    'Date', 'Status', 'Total Amount', 'Fulfillment Method', 'Delivery Partner',
    'Delivery Reference', 'Delivery Status', 'Estimated Delivery',
    'Pickup Time', 'Email'
  ];

  const formatDate = date => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d) ? 'N/A' : d.toLocaleDateString();
  };

  const dataValues = [
    formatDate(order_date),
    status,
    typeof total_amount === 'number' ? `$${total_amount.toFixed(2)}` : 'N/A',
    fulfillment_method,
    delivery_partner,
    delivery_reference,
    delivery_status,
    fulfillment_method === "Delivery" ? formatDate(estimated_delivery) : "N/A",
    fulfillment_method === "Pickup"
      ? (pickup_time ? formatTime(pickup_time) : 'N/A')
      : 'N/A',
    email
  ];

  // Create header row with labels
  const labelsRow = document.createElement('tr');
  headerLabels.forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    labelsRow.appendChild(th);
  });
  tbody.appendChild(labelsRow);

  // Create data row with values
  const dataRow = document.createElement('tr');
  dataValues.forEach(value => {
    const td = document.createElement('td');
    td.textContent = value || 'N/A';
    dataRow.appendChild(td);
  });
  tbody.appendChild(dataRow);

  // Add Items sub-table header row
  const itemsHeaderRow = document.createElement('tr');
  const itemsHeaderCell = document.createElement('td');
  itemsHeaderCell.colSpan = headerLabels.length;
  itemsHeaderCell.innerHTML = '<strong>Items</strong>';
  itemsHeaderRow.appendChild(itemsHeaderCell);
  tbody.appendChild(itemsHeaderRow);

  // Add items sub-table
  const itemsRow = document.createElement('tr');
  const itemsCell = document.createElement('td');
  itemsCell.colSpan = headerLabels.length;

  const itemsTable = document.createElement('table');
  itemsTable.classList.add('items-table');

  const itemsThead = document.createElement('thead');
  const itemsHeader = document.createElement('tr');
  ['Product Name', 'Quantity'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    itemsHeader.appendChild(th);
  });
  itemsThead.appendChild(itemsHeader);
  itemsTable.appendChild(itemsThead);

  const itemsTbody = document.createElement('tbody');
  items.forEach(item => {
    const itemRow = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.textContent = item.product_name;
    const qtyTd = document.createElement('td');
    qtyTd.textContent = item.quantity;
    itemRow.appendChild(nameTd);
    itemRow.appendChild(qtyTd);
    itemsTbody.appendChild(itemRow);
  });
  itemsTable.appendChild(itemsTbody);

  itemsCell.appendChild(itemsTable);
  itemsRow.appendChild(itemsCell);
  tbody.appendChild(itemsRow);

  table.appendChild(tbody);
  return table;
}

// When page loads
window.onload = loadOrderHistory;
