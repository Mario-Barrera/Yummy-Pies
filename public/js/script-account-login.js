// safely convert a server response into a JavaScript object without crashing the program
function safeJson(response) {
  return response.text().then(function (text) {           // response.text()   retrieves the server's response body and returns it as a string.
    if (!text) return null;                               // .then(function (text) { ... })   When the Promise finishes and returns a result, run this function with that result
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  });
}

function saveAuth({ token, user }) {
  localStorage.setItem("token", token);                           // localStorage.setItem() requires two arguments: "token" (key) and token (value)
  localStorage.setItem("user", JSON.stringify(user));             // "user" (key) and JSON.stringify(user) converts the object into a string (which becomes the actual value)
}

const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) {
      alert("Please enter both email and password");
      return;           
    }

    
    try {
      // associated code: router/auth.js lines 71 - 116
      const response = await fetch ("/api/auth/login", {                            // send request to this backend route
        method: "POST",                                                             // create/send data                                         
        headers: { "Content-Type": "application/json" },                            // tells server the data is JSON
        body: JSON.stringify({ email, password }),                                  // send email and password
      });

      const data = await safeJson(response);                                    // Run the safeJson() function with the server response

      if (!response.ok) {
        const message = data?.error || `Login failed (status ${response.status}).`;           // data is the object returned from the server; so the data.error would be "Invalid email or password"
        alert(message);                                                                       // associated code: routes/auth.js lines: 89 - 94, 96 - 101
        console.error("Login failed:", message, data);                                        // console.error() is a JS debugging function that prints an error message to the browser developer console
        return;
      }

      if (!data?.token || !data?.user) {                                          // Ensure the login response includes both a token and user object; stop if missing
        alert("Unexpected server response. Please try again");
        console.error("Invalid login response:", data);
        return;
      }

      saveAuth({ token: data.token, user: data.user });                               // login was successful, and the authentication data will now be saved in the browser

      // Redirect after successful registration
      window.location.href = "index.html";

    } catch (err) {
      console.error("Network/Unexpected login error:", err);
      alert("Network error, please try again");
    } 
  });
}