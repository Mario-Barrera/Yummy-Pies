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

//start here