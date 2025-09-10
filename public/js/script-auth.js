// Logs out the user by calling the backend logout endpoint, 
// clears the authentication token from localStorage
function logout() {
  fetch('/logout', { method: 'POST' })
    .then(response => {
      if (!response.ok) throw new Error('Logout failed');
      return response.json();
    })
    .then(data => {
      console.log(data.message); // "Logged out successfully"
      localStorage.removeItem('token');  // <-- Clear the token here!
      window.location.href = '/login';   // Redirect to login or homepage
    })
    .catch(err => {
      console.error(err);
      alert('Logout failed, please try again.');
    });
}
