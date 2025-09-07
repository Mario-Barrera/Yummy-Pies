document.addEventListener('DOMContentLoaded', async () => {
  const accountLink = document.querySelector('#account-login-link');
  const logoutBtn = document.querySelector('#logout');

  // Function to update link based on login status
  async function updateAccountLink() {
    try {
      const res = await fetch('/api/user-status');
      const data = await res.json();

      if (accountLink) {
        if (data.loggedIn) {
          accountLink.href = 'account-profile.html';
          accountLink.innerHTML = '<i class="fa-solid fa-circle-user"></i> My Profile';
        } else {
          accountLink.href = 'account-login.html';
          accountLink.innerHTML = '<i class="fa-solid fa-circle-user"></i> Login';
        }
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  }

  // Run it on load
  await updateAccountLink();

  // Add logout event if the button exists
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (res.ok) {
          // Update the link before redirect
          await updateAccountLink();

          // Delay to let DOM update before redirecting
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        } else {
          console.error('Logout failed');
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }
});
