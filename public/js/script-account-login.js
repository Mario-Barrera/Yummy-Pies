// === Select the login form ===
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async function(event) {
  event.preventDefault(); // Prevent default form submission

  // === Get form values ===
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  // === Basic front-end validation ===
  if (!email || !password) {
    alert('Please enter both email and password.');
    return;
  }

  try {
    // === Send login request ===
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    // === Try to safely parse JSON ===
    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      console.warn('Response not valid JSON or empty:', parseErr);
      data = null;
    }

    // === Handle server errors ===
    if (!response.ok) {
      const errorMsg = data?.error || `Login failed (status ${response.status}).`;
      alert(errorMsg);
      console.error('Login error:', errorMsg, data);
      return;
    }

    // === Handle missing or malformed server data ===
    if (!data || !data.token || !data.user) {
      alert('Unexpected server response. Please try again.');
      console.error('Invalid response:', data);
      return;
    }

    // === Save token and user info in localStorage ===
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('userEmail', email);

    // === Redirect to homepage ===
    window.location.href = 'index.html';

  } catch (err) {
    console.error('Network or unexpected login error:', err);
    alert('An unexpected error occurred. Please try again.');
  }
});
