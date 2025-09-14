const token = localStorage.getItem('token');

fetch('/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => res.json())
  .then(user => {
    // Populate account-profile.html if elements exist
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profilePhone = document.getElementById('profile-phone');
    const profileAddress = document.getElementById('profile-address');

    if (profileName) profileName.textContent = user.name || '';
    if (profileEmail) profileEmail.textContent = user.email || '';
    if (profilePhone) profilePhone.textContent = user.phone || '';
    if (profileAddress) profileAddress.textContent = user.address || '';

    // Populate manage-profile.html form if form exists
    const manageForm = document.getElementById('manageProfileForm');
    if (manageForm) {
      // Split full name into first and last name safely
      const [firstName, ...rest] = (user.name || '').split(' ');
      const lastName = rest.join(' '); // join any remaining parts as last name

      document.getElementById('first-name').value = firstName || '';
      document.getElementById('last-name').value = lastName || '';
      document.getElementById('email').value = user.email || '';
      document.getElementById('phone').value = user.phone || '';
      document.getElementById('address').value = user.address || '';
      document.getElementById('name').value = user.name || '';
    }
  })
  .catch(err => {
    console.error('Failed to load user profile:', err);
    // Optionally show an error message to user here
  });
