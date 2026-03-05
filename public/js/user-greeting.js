// Safely retrieve the stored user object from localStorage
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));                    // tries to convert JSON string to JavaScript object

  } catch (err) {
    console.error("Invalid user data in localStorage");
    return null;
  }
}

const user = getStoredUser();                                          // store the returned function value in a variable named user

// create variables that reference DOM elements.
const greetingDiv = document.getElementById("user-greeting");
const userNameSpan = greetingDiv?.querySelector(".user-name");        // ?. is optional chaining, Only call querySelector if greetingDiv is not null or undefined
const logoutLink = document.getElementById("logout");

if (user && greetingDiv && userNameSpan) {
  userNameSpan.textContent = `Hi, ${user.name}`;

  if (logoutLink) {
    logoutLink.addEventListener("click", function (event) {
      event.preventDefault();

      // Clear authentication data
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      window.location.href = "index.html";
    });
  }
} else if (greetingDiv) {
  greetingDiv.style.display = "none";                                       // hide greeting when user is logged out
}