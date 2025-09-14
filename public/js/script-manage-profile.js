document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('manageProfileForm');
  const cancelBtn = document.getElementById('cancelButton');
  const token = localStorage.getItem('token');

  if (!form || !token) {
    alert('Something went wrong. Please reload the page.');
    return;
  }

  // Fetch user and populate form
  fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(user => {
      if (!user) return;

      // Store original user data for cancel
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

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = form.querySelector('#first-name').value.trim();
    const lastName = form.querySelector('#last-name').value.trim();
    const name = `${firstName} ${lastName}`.trim();

    const updateData = {
      name,
      email: form.querySelector('#email').value.trim(),
      phone: form.querySelector('#phone').value.trim(),
      address: form.querySelector('#address').value.trim()
    };

    const password = form.querySelector('#password').value.trim();
    if (password) {
      updateData.password = password;
    }

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',                                // This is the database update trigger
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)              // This sends the updated data to the server
      });

      if (!res.ok) throw new Error('Failed to update profile.');

      const updatedUser = await res.json();
      alert('Profile updated successfully!');
      window.location.href = '/account-profile.html';
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    }
  });

  // Handle cancel button
  cancelBtn.addEventListener('click', () => {
    if (!window.originalUser) return;

    const [firstName, ...rest] = (window.originalUser.name || '').split(' ');
    const lastName = rest.join(' ');

    document.getElementById('first-name').value = firstName || '';
    document.getElementById('last-name').value = lastName || '';
    document.getElementById('email').value = window.originalUser.email || '';
    document.getElementById('phone').value = window.originalUser.phone || '';
    document.getElementById('address').value = window.originalUser.address || '';
    document.getElementById('password').value = '';
  });
});
