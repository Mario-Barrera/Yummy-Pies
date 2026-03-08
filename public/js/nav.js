async function renderGreeting() {
  const greeting = document.getElementById("user-greeting");

  if (!greeting) return;

  const nameElement = greeting.querySelector(".user-name");

  try {
    const response = await fetch("/api/user-status", {
      credentials: "include",                                           // ensure auth cookies are sent with the request
    });

    if (!response.ok) {
      throw new Error("Unable to fetch user status")
    }

    const data = await response.json();

    if (!data.loggedIn) {                                       // loggedIn is a property of the data object
      throw new Error("User not logged in");
    }

    // Insert user name
    if (nameElement) {
      nameElement.textContent = `Welcome, ${data.user?.name || "User"}`;
    }

    greeting.style.display = "block";

  } catch (err) {
    greeting.style.display = "none";
  }
}

function setupLogout() {
  const logoutLink = document.getElementById("logout");

  if (!logoutLink) return;

  logoutLink.addEventListener("click", function () {
    // Remove frontend auth data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  });
}