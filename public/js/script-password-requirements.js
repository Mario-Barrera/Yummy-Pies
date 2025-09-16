document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('password');
  const messageDiv = document.getElementById('password-requirements');

  passwordInput.addEventListener('input', () => {
    const pwd = passwordInput.value;

    const validations = [
      {
        test: pwd.length >= 10,
        message: 'Password must be at least 10 characters long.'
      },
      {
        test: /[A-Z]/.test(pwd),
        message: 'Password must contain at least one capital letter.'
      },
      {
        test: /[0-9]/.test(pwd),
        message: 'Password must contain at least one number.'
      },
      {
        test: /[^A-Za-z0-9]/.test(pwd),
        message: 'Password must contain at least one special character.'
      }
    ];

    const failedMessages = validations
      .filter(v => !v.test)
      .map(v => `<div>• ${v.message}</div>`)
      .join('');

    if (pwd.length === 0) {
      // Clear messages if blank (meaning no change)
      messageDiv.innerHTML = '';
    } else if (failedMessages) {
      // Show failed validation messages
      messageDiv.innerHTML = failedMessages;
    } else {
      // All good! Show success or clear message
      messageDiv.innerHTML = '<div style="color: green;">Password meets all requirements.</div>';
    }
  });
});
