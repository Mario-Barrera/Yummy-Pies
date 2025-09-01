const user = JSON.parse(localStorage.getItem('user'));
const greetingDiv = document.getElementById('user-greeting');
const userNameSpan = greetingDiv.querySelector('.user-name');
const logoutLink = document.getElementById('logout');

if (user && greetingDiv) {
  userNameSpan.textContent = `Hi ${user.name}`;

  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();          // prevent default link behavior
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'index.html'; // redirect to home page
  });
} else if (greetingDiv) {
  greetingDiv.style.display = 'none';  // hide for non-logged-in users
}

