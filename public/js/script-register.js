document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // prevent default form submission

    // Collect input values
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const address = document.getElementById('address') ? document.getElementById('address').value.trim() : '';
    const phone = document.getElementById('phone') ? document.getElementById('phone').value.trim() : '';

    // Basic validation
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `${firstName} ${lastName}`, 
          email, 
          password, 
          address, 
          phone 
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Registration successful! You can now log in.');
        window.location.href = 'account-login.html';
      } else {
        alert(data.error || 'Registration failed');
      }

    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong. Try again.');
    }
  });
});
