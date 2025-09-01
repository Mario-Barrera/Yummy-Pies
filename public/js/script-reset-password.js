document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgot-password-form');
  const emailInput = document.getElementById('email');

  if (!form || !emailInput) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // prevent page reload

    const email = emailInput.value.trim();
    if (!email) {
      alert('Please enter your email address.');
      return;
    }

    try {
      const res = await fetch('/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        alert('If this email exists, a reset link has been sent. Check your inbox!');
        form.reset();
      } else {
        alert(data.error || 'Something went wrong. Please try again.');
      }

    } catch (err) {
      console.error('Reset password request failed:', err);
      alert('Error sending reset link. Please try again later.');
    }
  });
});
