// Select the login form
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent default form submission

  // Get form values
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  // Basic front-end validation
  if (!email || !password) {
    alert('Please enter both email and password.');
    return;
  }

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      // Show error returned by server
      alert(data.error || 'Login failed. Please try again.');
      return;
    }

    // Save token and user info in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirect to homepage
    window.location.href = 'index.html';

  } catch (err) {
    console.error('Login error:', err);
    alert('An unexpected error occurred. Please try again later.');
  }
});
