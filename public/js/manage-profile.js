// Password validation function
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[\W_]/.test(password); // non-word character or underscore

  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
  }

  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter.';
  }

  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter.';
  }

  if (!hasDigit) {
    return 'Password must contain at least one digit.';
  }
  
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character.';
  }

  return null; // valid password
}

document.addEventListener("DOMContentLoaded", async function () {
  const form = document.getElementById("manageProfileForm");
  const cancelBtn = document.getElementById("cancelButton");
  const token = localStorage.getItem("token");

  const firstNameInput = document.getElementById("first-name");
  const lastNameInput = document.getElementById("last-name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const addressInput = document.getElementById("address");
  const passwordInput = document.getElementById("password");
  const nameInput = document.getElementById("name");
  const passwordMessageDiv = document.getElementById("password-requirements");

  if (!form) {
    console.error("Manage profile form not found.");
    return;
  }

  if (!token) {
    alert("You must be logged in to manage your profile.");
    window.location.href = "account-login.html";
    return;
  }

  let originalUser = null;

  function splitName(fullName = "") {
    const parts = fullName.split(" ");
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ")
    };
  }

  function fillForm(user) {
    const { firstName, lastName } = splitName(user.name);

    if (firstNameInput) {
      firstNameInput.value = firstName;
    }

    if (lastNameInput) {
      lastNameInput.value = lastName;
    }

    if (emailInput) {
      emailInput.value = user.email || "";
    }

    if (phoneInput) {
      phoneInput.value = user.phone || "";
    }

    if (addressInput) {
      addressInput.value = user.address || "";
    }

    if (nameInput) {                                        // this represents the full namne combinded
      nameInput.value = user.name || "";
    }

    if (passwordInput) {
      passwordInput.value = "";
    }
   
    if (passwordMessageDiv) {                                   // associated code:  manage-profile.html   line 135
      passwordMessageDiv.textContent = "";
    }
  }

  if (passwordInput && passwordMessageDiv) {
    passwordInput.addEventListener("input", function () {
      const password = passwordInput.value.trim();

      if (!password) {
        passwordMessageDiv.textContent = "";
        passwordMessageDiv.style.color = "red";
        return;
      }

      const errorMessage = validatePassword(password);

      if (errorMessage) {
        passwordMessageDiv.textContent = errorMessage;
        passwordMessageDiv.style.color = "red";
      } else {
        passwordMessageDiv.textContent = "Password looks good.";
        passwordMessageDiv.style.color = "green";
      }
    });
  }

  try {
    const response = await fetch("/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`                                      // sends the JWT in the Authorization header
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Failed to load profile");
    }

    originalUser = data.user;
    fillForm(data.user);
    
  } catch (err) {
    console.error("Error loading profile:", err);
    alert(err.message || "Failed to load profile.");
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const name = `${firstName} ${lastName}`.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const password = passwordInput.value.trim();

    const originalName = splitName(originalUser.name);

    const hasChanges = 
      firstName !== originalName.firstName ||
      lastName !== originalName.lastName ||
      email !== (originalUser.email || "") ||
      phone !== (originalUser.phone || "") ||
      address !== (originalUser.address || "") ||
      password !== "";

    if (!hasChanges) {
      alert("No changes made. Unable to update profile.");
      return;
    }

    const updateData = {
      name,
      email,
      phone,
      address
    };

    if (password) {                                           // adds the password field to the updateData object only if the user actually entered a password
      updateData.password = password;
    }

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
      });

      const updatedUser = await response.json();

      if (!response.ok) {
        throw new Error(updatedUser?.error || "Failed to update profile.");
      }

      const storedUser = localStorage.getItem("user");                                // user is a string there is because localStorage only stores strings

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.name = updatedUser.name || updateData.name;
          parsedUser.email = updatedUser.email || updateData.email;
          parsedUser.phone = updatedUser.phone || updateData.phone;
          parsedUser.address = updatedUser.address || updateData.address;
          localStorage.setItem("user", JSON.stringify(parsedUser));                            // converts a JavaScript object into a JSON string
        } catch (err) {
          console.warn("Could not update localStorage user:", err);
        }
      }

      alert("Profile updated successfully");
      window.location.href = "account-profile.html";
    
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(err.message || "Failed to update profile. Please try again.");  
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", function (event) {
      event.preventDefault();

      if (originalUser) {
        fillForm(originalUser);                             // Reset form only if the original user data has been loaded
      }

       window.location.href = "account-profile.html";
    });
  }
});