function updateStepIndicator(stepNumber, totalSteps) {
    const indicator = document.getElementById('step-indicator');
    indicator.textContent = `Step ${stepNumber} of ${totalSteps}`;
}

// display a form one step at a time on catering page
function goToStep(stepId) {
    const steps = document.querySelectorAll(".event-section");
    steps.forEach(step => step.style.display = "none");

    const activeStep = document.getElementById(stepId);
    if (activeStep) {
        activeStep.style.display = "block";

        // Update indicator
        const stepNumber = Array.from(steps).indexOf(activeStep) + 1;       /*automatically calculates the current step number */
        updateStepIndicator(stepNumber, steps.length);
    }
}

// Initialize first step and set minimum date
window.onload = function() {
    goToStep("step1");

    const dateInput = document.getElementById('event-date');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const minDate = `${yyyy}-${mm}-${dd}`;
        dateInput.setAttribute('min', minDate);
    }
};

/* --- Step Validations --- */
function validateStep1() {
    const radios = document.querySelectorAll('input[name="event-type"]');
    const isChecked = Array.from(radios).some(radio => radio.checked);

    if (!isChecked) {
        alert("Please select the type of event.");
        return;
    }
    goToStep('step2');
}

function validateStep2() {
    const checkboxes = document.querySelectorAll('input[name="pie-types"]');
    const isChecked = Array.from(checkboxes).some(cb => cb.checked);

    if (!isChecked) {
        alert("Please select the type of pie(s) you want for your event.");
        return;
    }
    goToStep('step3');
}

function validateStep3() {
    const radios = document.querySelectorAll('input[name="guest-count"]');
    const isChecked = Array.from(radios).some(radio => radio.checked);

    if (!isChecked) {
        alert("Please select the approximate number of guests.");
        return;
    }
    goToStep('step4');
}

function validateStep4() {
    const radios = document.querySelectorAll('input[name="signage-idea"]');
    const isChecked = Array.from(radios).some(radio => radio.checked);

    if (!isChecked) {
        alert("Please select if you would like pie bar signage.");
        return;
    }
    goToStep('step5');
}

function validateStep5() {
    const dateInput = document.getElementById('event-date');
    if (!dateInput.value) {
        alert('Please select the date for your event.');
        return;
    }

    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    selectedDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    if (selectedDate < today) {
        alert('Please choose a future date.');
        return;
    }
    goToStep('step6');
}

/* --- Step 6 / Form Submission --- */
async function validateStep6(event) {
    event.preventDefault();

    const firstName = document.getElementById('first-name');
    const lastName = document.getElementById('last-name');
    const phone = document.getElementById('phone');
    const email = document.getElementById('email');

    if (!firstName.value.trim()) {
        alert('Please enter your first name.');
        firstName.focus();
        return;
    }
    if (!lastName.value.trim()) {
        alert('Please enter your last name.');
        lastName.focus();
        return;
    }
    if (!phone.value.trim()) {
        alert('Please enter your phone number.');
        phone.focus();
        return;
    }
    if (!email.value.trim()) {
        alert('Please enter your email.');
        email.focus();
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value)) {
        alert('Please enter a valid email address.');
        email.focus();
        return;
    }

    // Collect all form data including previous steps (adjust selectors as needed)
    const formData = {
        'event-type': document.querySelector('input[name="event-type"]:checked')?.value,
        'pie-types': Array.from(document.querySelectorAll('input[name="pie-types"]:checked')).map(el => el.value),
        'guest-count': document.querySelector('input[name="guest-count"]:checked')?.value,
        'signage-idea': document.querySelector('input[name="signage-idea"]:checked')?.value,
        'event-date': document.getElementById('event-date').value,
        'first-name': firstName.value.trim(),
        'last-name': lastName.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim()
    };

    try {
        const response = await fetch('/api/catering', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to submit form');
        }

        const result = await response.json();
        alert(result.message || 'Form submitted successfully!');

        // Optionally, redirect or reset form here
    } catch (error) {
        alert('There was an error submitting the form. Please try again.');
        console.error(error);
    }
}
