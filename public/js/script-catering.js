
// Data that will eventually be submitted
const formData = {
    eventType: "",
    pieTypes: [],
    guestCount: "",
    signageIdea: "",
    eventDate: "",
    customerInfo: {
        firstName: "",
        lastName: "",
        phone: "",
        email: ""
    }
};

// Select all form steps
const steps = document.querySelectorAll(".event-section");

// Select the step indicator
const stepIndicator = document.getElementById("step-indicator");

// define the navigation function
function goToStep(stepId) {
    steps.forEach(function (step) {
        step.style.display = "none";
    });

    const activeStep = document.getElementById(stepId);

    // the function exist safely and the app does not crash
    if (!activeStep) {
        console.error(`Step with id ${stepId} not found.`);
        return;
    }

    activeStep.style.display = "block";

    const stepNumber = stepId.replace("step", "");

    stepIndicator.textContent = `Step ${stepNumber} of 6`;
}

// Step 1: Event Type (radio)
// [name="event-type"] is a CSS Attribute Selector
// :checked is a CSS pseudo-class selector that matches elements in a specific state.
function validateStep1() {
    const selected = document.querySelector('input[name="event-type"]:checked');

    if (!selected) {
        alert("Please select an event type to continue");
        return;
    }

    formData.eventType = selected.value;
    goToStep("step2");
}

// Step 2: Pie Types (checkboxes)
// Array.from() converts a NodeList to an Array and is a static method of the Array constructor
function validateStep2() {
    const selected = document.querySelectorAll('input[name="pie-types"]:checked');

    if (selected.length === 0) {
        alert("Please select at least one type of pie to continue");
        return;
    }

    formData.pieTypes = Array.from(selected, function(checkbox) {
        return checkbox.value;
    });

    goToStep("step3");
}

// Step 3: Guest Count (radio)
function validateStep3() {
    const selected = document.querySelector('input[name="guest-count"]:checked');

    if (!selected) {
        alert("Please select the number of guests to continue");
        return;
    }

    formData.guestCount = selected.value;
    goToStep("step4");
}

// Step 4: Pie Bar Signage (radio)
function validateStep4() {
    const selected = document.querySelector('input[name="signage-idea"]:checked');

    if (!selected) {
        alert("Please choose Yes or No to continue");
        return;
    }

    formData.signageIdea = selected.value;
    goToStep("step5");
}

// Step 5: Event Date (Date Picker)
function validateStep5() {
    const dateInput = document.getElementById("event-date");
    const selectedDate = dateInput.value;

    if (!selectedDate) {
        alert("Please select a proposed date to continue");
        return;
    }

    formData.eventDate = selectedDate;
    goToStep("step6");
}

// Step 6: Customer Contact Info
function validateStep6(event) {
    event.preventDefault();

    // Grab the inputs
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');

    // trim the data
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();

    if (!firstName || !lastName || !phone || !email) {
        alert("Please fill out the form completely before submitting");
        return;
    }

    // Save data into state
    formData.customerInfo.firstName = firstName;
    formData.customerInfo.lastName = lastName;
    formData.customerInfo.phone = phone;
    formData.customerInfo.email = email;

    alert("Form submitted successfully!");
}