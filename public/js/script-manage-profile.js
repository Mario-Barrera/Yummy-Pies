document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('manageProfileForm');
  const cancelBtn = document.getElementById('cancelButton');
  const token = localStorage.getItem('token');

  if (!form || !token) {
    alert('Something went wrong. Please reload the page.');
    return;
  }

  // Clear password input on page load
  const passwordInput = document.getElementById('password');
  if (passwordInput) passwordInput.value = '';

  // Fetch user data
  fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(user => {
      if (!user) return;

      window.originalUser = { ...user };

      const [firstName, ...rest] = (user.name || '').split(' ');
      const lastName = rest.join(' ');

      document.getElementById('first-name').value = firstName || '';
      document.getElementById('last-name').value = lastName || '';
      document.getElementById('email').value = user.email || '';
      document.getElementById('phone').value = user.phone || '';
      document.getElementById('address').value = user.address || '';
      document.getElementById('name').value = user.name || '';
    });

  // Prevent update if nothing has changed
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = form.querySelector('#first-name').value.trim();
    const lastName = form.querySelector('#last-name').value.trim();
    const name = `${firstName} ${lastName}`.trim();

    const email = form.querySelector('#email').value.trim();
    const phone = form.querySelector('#phone').value.trim();
    const address = form.querySelector('#address').value.trim();
    const password = form.querySelector('#password').value.trim();

    const [originalFirstName, ...rest] = (window.originalUser.name || '').split(' ');
    const originalLastName = rest.join(' ');

    const hasChanges =
      firstName !== (originalFirstName || '') ||
      lastName !== (originalLastName || '') ||
      email !== (window.originalUser.email || '') ||
      phone !== (window.originalUser.phone || '') ||
      address !== (window.originalUser.address || '') ||
      password !== '';

    if (!hasChanges) {
      alert('No changes made, unable to update profile.');
      return;
    }

    const updateData = { name, email, phone, address };
    if (password) updateData.password = password;

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!res.ok) throw new Error('Update failed');

      alert('Profile updated successfully!');
      window.location.href = '/account-profile.html';
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to update profile. Please try again.');
    }
  });

  // Handle Cancel
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();

    if (!window.originalUser) return;

    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const passwordInput = document.getElementById('password');
    const passwordMessageDiv = document.getElementById('password-requirements');

    // Clear password field and any validation messages
    passwordInput.value = '';
    if (passwordMessageDiv) passwordMessageDiv.innerHTML = '';

    const [originalFirstName, ...rest] = (window.originalUser.name || '').split(' ');
    const originalLastName = rest.join(' ');

    firstNameInput.value = originalFirstName || '';
    lastNameInput.value = originalLastName || '';
    emailInput.value = window.originalUser.email || '';
    phoneInput.value = window.originalUser.phone || '';
    addressInput.value = window.originalUser.address || '';

    localStorage.removeItem('userProfileDraft');

    window.location.href = 'account-profile.html';
  });
});
