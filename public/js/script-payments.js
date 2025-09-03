// code you might need to add
async function fetchPayments() {
  try {
    const response = await fetch('/api/payments');
    if (!response.ok) throw new Error('Failed to fetch payments');
    const payments = await response.json();
    renderPayments(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
  }
}

function renderPayments(payments) {
  const container = document.getElementById('payments-list');
  container.innerHTML = '';

  if (payments.length === 0) {
    container.innerHTML = '<p>No payment records found.</p>';
    return;
  }

  payments.forEach(payment => {
    const div = document.createElement('div');
    div.classList.add('payment-item');
    div.innerHTML = `
      <p><strong>Order ID:</strong> ${payment.order_id}</p>
      <p><strong>Transaction ID:</strong> ${payment.transaction_id}</p>
      <p><strong>Amount:</strong> $${payment.amount}</p>
      <p><strong>Status:</strong> ${payment.status}</p>
      <p><strong>Method:</strong> ${payment.method}</p>
      <p><em>Paid on: ${new Date(payment.created_at).toLocaleString()}</em></p>
      <hr>
    `;
    container.appendChild(div);
  });
}

// Call fetchPayments when page loads
fetchPayments();
