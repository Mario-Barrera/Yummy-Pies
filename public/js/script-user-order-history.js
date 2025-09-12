async function loadOrderHistory() {
  try {
    const response = await fetch('/api/orders/my-orders-with-items', { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch orders');

    const orders = await response.json();
    const container = document.getElementById('order-history');
    container.innerHTML = ''; // Clear existing content

    if (orders.length === 0) {
      container.innerHTML = '<p>No orders found.</p>';
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

function createOrderTable(order) {
  const table = document.createElement('table');
  table.classList.add('order-table');

  // Table header with order number spanning all columns
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
  headerCell.colSpan = 10;  // Adjust to number of columns
  headerCell.textContent = `Order #${order.order_id}`;
  headerRow.appendChild(headerCell);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  // Define labels and corresponding values (horizontal layout)
  const headerLabels = [
    'Date', 'Status', 'Total Amount', 'Fulfillment Method', 'Delivery Partner',
    'Delivery Reference', 'Delivery Status', 'Estimated Delivery',
    'Created At', 'Email'
  ];

  const formatDate = date => date ? new Date(date).toLocaleDateString() : 'N/A';

  const dataValues = [
    formatDate(order.order_date),
    order.status,
    typeof order.total_amount === 'number' ? `$${order.total_amount.toFixed(2)}` : 'N/A',
    order.fulfillment_method,
    order.delivery_partner,
    order.delivery_reference,
    order.delivery_status,
    formatDate(order.estimated_delivery),
    formatDate(order.created_at),
    order.email
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
  itemsHeaderCell.colSpan = headerLabels.length; // span all columns
  itemsHeaderCell.innerHTML = '<strong>Items</strong>';
  itemsHeaderRow.appendChild(itemsHeaderCell);
  tbody.appendChild(itemsHeaderRow);

  // Add items sub-table
  const itemsRow = document.createElement('tr');
  const itemsCell = document.createElement('td');
  itemsCell.colSpan = headerLabels.length;

  const itemsTable = document.createElement('table');
  itemsTable.classList.add('items-table');

  // Items header
  const itemsThead = document.createElement('thead');
  const itemsHeader = document.createElement('tr');
  ['Product Name', 'Quantity'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    itemsHeader.appendChild(th);
  });
  itemsThead.appendChild(itemsHeader);
  itemsTable.appendChild(itemsThead);

  // Items body
  const itemsTbody = document.createElement('tbody');
  order.items.forEach(item => {
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
