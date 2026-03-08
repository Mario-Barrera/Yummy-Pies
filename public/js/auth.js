function safeJson(response) {
  return response.text().then(function (text) {           // response.text()   retrieves the server's response body and returns it as a string.
    if (!text) return null;                               // .then(function (text) { ... })   When the Promise finishes and returns a result, run this function with that result
    try {
      return JSON.parse(text);
    } catch (error) {
        console.error("Invalid JSON response:", err);
      return null;
    }
  });
}

// saveAuth() stores the authentication information returned by your API after login or registration
function saveAuth(authData) {
  const { token, user } = authData;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

// Get stored JWT token from localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Check whether user appears to be logged in
// !!getToken uses double negative and means:  token exist is true   token missing is false
function isLoggedIn() {
  return !!getToken();
}

// this function builds the HTTP headers object
function getAuthHeaders() {
  const token = getToken();

  if (!token) {                                             // token does not exist and return headers without authentication
    return {
      "Content-Type": "application/json"
    };
  }

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}