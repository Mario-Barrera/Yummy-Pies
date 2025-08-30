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
function validateStep6(event) {
    event.preventDefault(); // prevent default submit

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

    // Simple email format check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value)) {
        alert('Please enter a valid email address.');
        email.focus();
        return;
    }

    // If all validations pass, submit the form
    document.querySelector('.form-container form').submit();
}
