document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('manageProfileForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Combine first and last name
    const firstName = form.querySelector('#first-name').value.trim();
    const lastName = form.querySelector('#last-name').value.trim();
    const fullName = `${firstName} ${lastName}`.trim();
    form.querySelector('#name').value = fullName;

    // Prepare data to send
    const data = {
      name: fullName,
      email: form.querySelector('#email').value.trim(),
      address: form.querySelector('#address')?.value.trim() || '',
      password: form.querySelector('#password').value.trim() || undefined,
    };

    if (!data.password) delete data.password;

    // Get token from localStorage
    const token = localStorage.getItem('token');

    // Check if token exists
    if (!token) {
      alert('You are not logged in. Please log in again.');
      return;
    }

    try {
      const response = await fetch('/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Something went wrong'}`);
        return;
      }

      const result = await response.json();
      alert('Profile updated successfully!');
      // Optionally update the UI or redirect

    } catch (error) {
      alert('Network error. Please try again later.');
      console.error(error);
    }
  });
});
