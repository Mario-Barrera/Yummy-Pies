document.addEventListener('DOMContentLoaded', function () {
  const accountLink = document.getElementById('account-login-link');
  const logoutBtn = document.getElementById('logout');

  initializeUserStatus();                                  // this runs the setup function

  // Function to update link based on login status
  async function initializeUserStatus() {
    await updateAccountLink();

    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout);                      // handleLogout is the event handler function that runs when the logout button is clicked
    }
  }

  async function updateAccountLink() {
    if (!accountLink) return;
  
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        accountLink.href = "account-login.html";
        accountLink.innerHTML = '<i class="fa-solid fa-circle-user"></i> Login';
        return;
      }

      const response = await fetch("/api/user-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user status: ${response.status}`);
      }

      const data = await response.json();

      if (data.loggedIn) {
        accountLink.href = 'account-profile.html';
        accountLink.innerHTML = '<i class="fa-solid fa-circle-user"></i> My Profile';
      } else {
        accountLink.href = 'account-login.html';
        accountLink.innerHTML = '<i class="fa-solid fa-circle-user"></i> Login';
      }

    } catch (err) {
      console.error('Error checking login status:', err);
      accountLink.href = "account-login.html";
      accountLink.innerHTML = `<i class="fa-solid fa-circle-user"></i> Login`;
    }
  }

  async function handleLogout(event) {
    event.preventDefault();

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }
});
