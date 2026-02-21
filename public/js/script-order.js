// DOMContentLoaded only initializes the first state
document.addEventListener("DOMContentLoaded", function () {
    goToStep("step1");
});

// Data that will eventually be submitted
const orderFormData = {
    orderOption: "",

    pickupInfo: {
        pickupOption: "",
        pickupDate: "",
        pickupTime: ""
    },

    deliveryInfo: {
        deliveryAddress: "",
        deliveryDate: "",
        deliveryTime: ""
    },

    orderNowList: [],

    customerName: {
        firstName: "",
        lastName: ""
    },

    addressInfo: {
        address1: "",
        address2: "",
        city: "",
        state: "",
        zip: ""
    },

    paymentInfo: {
        ccNumber: "",
        ccType: "",
        ccv: "",
        expMonth: "",
        expYear: ""
    },

    orderTotal: ""
};

// Select all order form steps
const steps = document.querySelectorAll(".event-section");

// define the navigation function
function goToStep(stepId) {
    steps.forEach(function (step) {
        step.style.display = "none";
    });

    const activeStep = document.getElementById(stepId);

    // the function exist safely and the app does not crash
    if (!activeStep) {
        console.log(`Step with id ${stepId} not found.`);
        return;
    }

    activeStep.style.display = "block";
}

function validateStep1() {
    const selectedOrderOption = document.querySelector('input[name="orderOption"]:checked');

    if (!selectedOrderOption) {
        alert("Please make a choice: pickup or delivery");
        return;
    }

    orderFormData.orderOption = selectedOrderOption.value;

    if (selectedOrderOption.value === "pickup") {
        goToStep("step2");
    } else if (selectedOrderOption.value === "delivery") {
        goToStep("step3");
    }
}

function validateStep2(direction) {

    // Each validation function handles its own navigation logic
    if (direction === "back") {
        goToStep("step1");
        return;
    }

    const selectedPickupLocation = document.querySelector('input[name="pickupOption"]:checked');
    const selectedPickupDate = document.getElementById("pickup-date");
    const selectedPickupTime = document.getElementById("pickup-time");

    if (!selectedPickupLocation) {
        alert("Please choose a location for pickup");
        return;
    }

    if (!selectedPickupDate.value) {
        alert("Please select a pickup date");
        return;
    }

    if (!selectedPickupTime.value) {
        alert("Please select a pickup time");
        return;
    }

    orderFormData.pickupInfo.pickupOption = selectedPickupLocation.value;
    orderFormData.pickupInfo.pickupDate = selectedPickupDate.value;
    orderFormData.pickupInfo.pickupTime = selectedPickupTime.value;

    goToStep("step4");
}

function validateStep3(direction) {

    if (direction === "back") {
        goToStep("step1");
        return;
    }
    const deliveryAddressInput = document.getElementById("delivery-address");
    const selectedDeliveryDate = document.getElementById("delivery-date");
    const selectedDeliveryTime = document.getElementById("delivery-time");

    const deliveryAddress = deliveryAddressInput.value.trim();

    if (!deliveryAddress) {
        alert("Please enter an address for delivery");
        return;
    }

    if (!selectedDeliveryDate.value) {
        alert("Please select a date for delivery");
        return;
    }
    
    if (!selectedDeliveryTime.value) {
        alert("Please select a delivery time");
        return;
    }

    orderFormData.deliveryInfo.deliveryAddress = deliveryAddress;
    orderFormData.deliveryInfo.deliveryDate = selectedDeliveryDate.value;
    orderFormData.deliveryInfo.deliveryTime = selectedDeliveryTime.value;

    goToStep("step4");
}

function validateStep4(direction) {

    if (direction === "back") {

        if (orderFormData.orderOption === "pickup") {
            goToStep("step2");
        } else if (orderFormData.orderOption === "delivery") {
            goToStep("step3");
        }

        return;
    }

    if (orderFormData.orderNowList.length === 0) {
        alert("Please add at least one item to your cart");
        return;
    }

    goToStep("step5");
}

function validateStep5(direction) {

    if (direction === "back") {
        goToStep("step4");
        return;
    }

    const firstNameInput = document.getElementById("first-name");
    const lastNameInput = document.getElementById("last-name");
    const address1Input = document.getElementById("address1");
    const cityInput = document.getElementById("city");
    const selectedState = document.getElementById("state");
    const zipInput = document.getElementById("zip");
    const creditCardInput = document.getElementById("cc-number");
    const selectedCCType = document.getElementById("cc-type");
    const securityCodeInput = document.getElementById("ccv");
    const selectedExpirationMonth = document.getElementById("exp-month");
    const selectedExpirationYear = document.getElementById("exp-year");

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const address1 = address1Input.value.trim();
    const city = cityInput.value.trim();
    const zipCode = zipInput.value.trim();
    const creditCard = creditCardInput.value.trim();
    const securityCode = securityCodeInput.value.trim();

    if (!firstName) {
        alert("Please enter your first name");
        return;
    }

    if (!lastName) {
        alert("Please enter your last name");
        return;
    }

    if (!address1) {
        alert("Please enter the billing address");
        return;
    }

    if (!city) {
        alert("Please enter the city on your billing address");
        return;
    }

    if (!selectedState.value) {
        alert("Please select the state on your billing address");
        return;
    }

    if (!zipCode) {
        alert("Please enter the zip code on your billing address");
        return;
    }

    if (!selectedCCType.value) {
        alert("Please select the type of credit card");
        return;
    }

    if (!creditCard) {
        alert("Please enter the credit card number");
        return;
    }

    if (!securityCode) {
        alert("Please enter the credit card security code");
        return;
    }

    if (!selectedExpirationMonth.value) {
        alert("Please enter the credit card expiration month");
        return;
    }

    if (!selectedExpirationYear.value) {
        alert("Please select the credit card expiration year");
        return;
    }

    orderFormData.customerName.firstName = firstName;
    orderFormData.customerName.lastName = lastName;

    orderFormData.addressInfo.address1 = address1;
    orderFormData.addressInfo.city = city;
    orderFormData.addressInfo.state = selectedState.value;
    orderFormData.addressInfo.zip = zipCode;

    orderFormData.paymentInfo.ccNumber = creditCard;
    orderFormData.paymentInfo.ccType = selectedCCType.value;
    orderFormData.paymentInfo.ccv = securityCode;
    orderFormData.paymentInfo.expMonth = selectedExpirationMonth.value;
    orderFormData.paymentInfo.expYear = selectedExpirationYear.value;

    goToStep("step6");
}

function validateStep6(direction) {

    if (direction === "back") {
        goToStep("step5");
        return;
    }

    const orderSummary = document.getElementById("order-summary");

    if (!orderSummary){
        alert("Missing order summary");
        return;
    }

    if (orderFormData.orderOption === "pickup") {
        const pickup = orderFormData.pickupInfo;

        // '!pickup' is used if pickup is undefined
        if (!pickup || !pickup.pickupOption || !pickup.pickupDate || !pickup.pickupTime) {
            alert("Pickup details are incomplete");
            goToStep("step2");
            return;
        } 
        
    } else if (orderFormData.orderOption === "delivery") {
        const delivery = orderFormData.deliveryInfo;

        // '!delivery' is used if pickup is undefined
        if (!delivery || !delivery.deliveryAddress || !delivery.deliveryDate || !delivery.deliveryTime) {
            alert("Delivery details are incomplete");
            goToStep("step3");
            return;
        }
    }

    // '.isArray()' is a method and means: if orderNowList is NOT an array
    if (!Array.isArray(orderFormData.orderNowList) || orderFormData.orderNowList.length === 0) {
        alert("Your cart is empty, please add at least one item");
        goToStep("step4");
        return;
    }

    // '?.' is Optional Chaining
    const name = orderFormData.customerName;
    if (!name || !name.firstName.trim() || !name.lastName?.trim()) {
        alert("Customer name is missing");
        goToStep("step5");
        return;
    }

    const address = orderFormData.addressInfo;
    if (
        !address ||
        !address.address1?.trim() || 
        !address.city?.trim() || 
        !address.state?.trim() || 
        !address.zip?.trim()
    ) {
        alert("Billing address is incomplete");
        goToStep("step5");
        return;
    }

    const payment = orderFormData.paymentInfo;
    if (
        !payment ||
        !payment.ccNumber?.trim() || 
        !payment.ccType || 
        !payment.ccv?.trim() || 
        !payment.expMonth || 
        !payment.expYear
    ) {
        alert("Payment information is incomplete");
        goToStep("step5");
        return;
    }

    //Building HTML Order Summary
    // Fulfillment line (Pickup vs Delivery)
    let fullfillmentLine = "";

    if (orderFormData.orderOption === "pickup") {
        const p = orderFormData.pickupInfo;
        fullfillmentLine = `Pickup: ${p.pickupDate} at ${p.pickupTime}`;
    } else if (orderFormData.orderOption === "delivery") {
        const d = orderFormData.deliveryInfo;
        fullfillmentLine = `Delivery: ${d.deliveryAddress} on ${d.deliveryDate} at ${d.deliveryTime}`;
    }

    // Customer name and Billing
    // '?.' is Optional Chaining
    const fullName = `${orderFormData.customerName.firstName} ${orderFormData.customerName.lastName}`;

    const summaryAddress =  orderFormData.addressInfo;
    let billing = `${summaryAddress.address1}`;

    if (summaryAddress.address2?.trim()) {
        billing += `<br>${summaryAddress.address2.trim()}`;
    }

    billing += `<br>${summaryAddress.city}, ${summaryAddress.state} ${summaryAddress.zip}`;

    // Payment Info
    // (/\s+/g, "") is a regex literal
    const paymentType = orderFormData.paymentInfo.ccType;
    const paymentExp = `${orderFormData.paymentInfo.expMonth}/${orderFormData.paymentInfo.expYear}`;
    const ccLast4 = String(orderFormData.paymentInfo.ccNumber).replace(/\s+/g, "").slice(-4);

    // Rendering Order Summary
    orderSummary.innerHTML = `
    <h2> Order Summary</h2>

    <p>Fullfillment: ${fullfillmentLine}</p>

    <h3>Customer</h3>
    <p>${fullName}</p>

    <h3>Billing Address</h3>
    <p>${billing}</p>

    <h3>Payment</h3>
    <p>
        Type: ${paymentType}<br>
        Card: ${ccLast4}<br>
        Exp: ${paymentExp}
    </p>    
    `;
}






























document.addEventListener("DOMContentLoaded", function () {
    const steps = document.querySelectorAll(".event-section");

    // Load formState from localStorage
    const saved = JSON.parse(localStorage.getItem('formState') || '{}');

    // Initialize state from saved data
    let cart = Array.isArray(saved.cart) ? saved.cart : [];
    let currentStep = typeof saved.currentStep === "number" ? saved.currentStep : 1;

    // Calculate total from cart
    let total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const orderTotalEls = document.querySelectorAll(".order-total");
    const orderListEl = document.querySelector(".orderNow-list");

    // Date/time inputs
    const pickupDateInput = document.getElementById("pickup-date");
    const deliveryDateInput = document.getElementById("delivery-date");
    const pickupTimeInput = document.getElementById("pickupTime");
    const deliveryTimeInput = document.getElementById("delivery-time");

    loadFormState();

    // Show only the current step
    steps.forEach((step, index) => {
        step.style.display = (index + 1 === currentStep) ? 'block' : 'none';
    });

    // Check if token exists
    const token = localStorage.getItem('token');
    console.log("Token:", token);

    if (!token) {
        // Disable Step 1 radios (pickup/delivery)
        const step1Radios = document.querySelectorAll('input[name="orderOption"]');
        step1Radios.forEach(radio => radio.disabled = true);

        // Disable the Continue button
        const step1NextButton = document.querySelector("#go-button-step1");
        if (step1NextButton) step1NextButton.disabled = true;

        // Show login message
        const step1Container = document.querySelector("#step1");
        if (step1Container) {
            const message = document.createElement("p");
            message.style.color = "red";
            message.textContent = "Please log in to place an order";
            step1Container.prepend(message);
        }

        updateCartDisplay?.();
    }


    // ---------------- SAVE FORM STATE ---------------- //
    function saveFormState() {
        const formElements = document.querySelectorAll("input[data-key], select[data-key]");
        const formState = {
            cart: cart || [],
        };

        formElements.forEach(el => {
            const key = el.getAttribute("data-key");
            if (!key) return;

            if (el.type === "radio") {
                if (el.checked) formState[key] = el.value;
            } else {
                formState[key] = el.value;
            }
        });

        console.log("Saving formState dynamically:", formState);
        localStorage.setItem("formState", JSON.stringify(formState));
    }

    function loadFormState() {
        const saved = JSON.parse(localStorage.getItem('formState') || '{}');

        // Restore cart and total
        if (saved.cart) cart = saved.cart;

        total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        // Restore form fields (inputs and selects only)
        const formElements = document.querySelectorAll("input[data-key], select[data-key]");

        formElements.forEach(el => {
            const key = el.getAttribute("data-key");
            if (!key || !(key in saved)) return;

            if (el.type === "radio") {
                if (el.value === saved[key]) el.checked = true;
            } else {
                el.value = saved[key];
            }
        });

        if (saved.currentStep !== undefined) currentStep = saved.currentStep;

        updateCartCount();
        updateCartDisplay();
    }

    // Call loadFormState on page load
    window.addEventListener('DOMContentLoaded', () => {
        loadFormState();
        showStep(currentStep || 1);
    });

    // Add event listeners to save state when inputs change
    document.querySelectorAll("input[data-key], select[data-key]").forEach(el => {
        el.addEventListener("change", saveFormState);
    });


    // -------- Helper functions for past time warning --------
    function showPastTimeWarning() {
        alert("The selected time is in the past. Please choose a future time.");
    }

    function isPastTime(date, time) {
        if (!date || !time) return false;
        const [hours, minutes] = time.split(":").map(Number);
        const selectedDateTime = new Date(date);
        selectedDateTime.setHours(hours, minutes, 0, 0);
        return selectedDateTime < new Date();
    }

    showStep(1);

    // ---------------- STEP NAVIGATION FUNCTIONS ----------------
    function showStep(step) {
        steps.forEach((section, index) => {
            const displayValue = index === step - 1 ? "block" : "none";
            section.style.display = displayValue;
        });
        currentStep = step;
        saveFormState();
    }

    window.validateStep1 = function () {
        const pickup = document.getElementById("pickup").checked;
        const delivery = document.getElementById("delivery").checked;
        if (pickup) showStep(2);
        else if (delivery) showStep(3);
        else alert("Please select pickup or delivery.");
    };

    window.validateStep2 = function (direction) {
        if (direction === "back") return showStep(1);
        const locationSelected = document.querySelector('input[name="pickupOption"]:checked');
        if (!locationSelected || !pickupDateInput.value || !pickupTimeInput.value) {
            alert("Please select a location, date, and time.");
            return;
        }
        showStep(4);
    };

    window.validateStep3 = function (direction) {
        if (direction === "back") return showStep(1);
        const address = document.getElementById("delivery-address").value.trim();
        if (!address || !deliveryDateInput.value || !deliveryTimeInput.value) {
            alert("Please complete all delivery details.");
            return;
        }
        showStep(4);
    };
    
    window.validateStep4 = function (direction) {
        if (direction === "back") {
            const pickupChecked = document.getElementById("pickup").checked;
            showStep(pickupChecked ? 2 : 3);
            return;
        }
        if (cart.length === 0) {
            alert("Please add at least one item to your order.");
            return;
        }
        showStep(5);
    };

    window.validateStep5 = function (direction) {
        if (direction === "back") return showStep(4);
        const fields = [
            'input[name="first-name"]',
            'input[name="last-name"]',
            'input[name="address1"]',
            'input[name="city"]',
            'select[name="state"]',
            'input[name="zip"]',
            'select[name="cc-type"]',
            'input[name="cc-number"]',
            'input[name="ccv"]',
            'select[name="exp-month"]',
            'select[name="exp-year"]'
        ].map(sel => document.querySelector(sel));

        if (fields.some(f => !f || !f.value.trim())) {
            alert("All fields are required.");
            return;
        }

        const [ccNum, ccv, expMonth, expYear] = [fields[7], fields[8], fields[9], fields[10]];
        if (!/^\d{13,19}$/.test(ccNum.value.trim())) {
            alert("Invalid credit card number.");
            return;
        }
        if (!/^\d{3,4}$/.test(ccv.value.trim())) {
            alert("Invalid CCV.");
            return;
        }

        const now = new Date();
        if (parseInt(expYear.value) < now.getFullYear() ||
            (parseInt(expYear.value) === now.getFullYear() && parseInt(expMonth.value) < now.getMonth() + 1)) {
            alert("Your credit card expiration date is invalid or expired.");
            return;
        }

        showStep(6);
        showOrderSummary();
    };

    // ------------ START NEW ORDER BUTTON ------------ //
    window.startNewOrder = function () {
        cart = [];
        total = 0;
        updateCartDisplay();
        document.querySelector("form").reset();
        document.querySelector("#order-summary").innerHTML = "";
        showStep(1);
        setMinDates();
        updateMinTime(pickupDateInput, pickupTimeInput);
        updateMinTime(deliveryDateInput, deliveryTimeInput);
        disablePastTimeOptions(pickupDateInput, pickupTimeInput);
        disablePastTimeOptions(deliveryDateInput, deliveryTimeInput);
    };


    // ---------------- CART LOGIC ----------------
    const orderButtons = document.querySelectorAll(".order-btn");
    orderButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const pieText = btn.previousElementSibling.textContent.trim();
            const priceMatch = pieText.match(/\$([\d.]+)/);
            const name = pieText.replace(/\$\d+\.\d+/, "").trim();
            const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
            const imgSrc = btn.closest(".content")?.querySelector("img")?.src || "https://via.placeholder.com/50";
            addToCart(name, price, imgSrc);
        });
    });

    function addToCart(name, price, imgSrc) {
        const existingItem = cart.find(i => i.name === name);
        if (existingItem) existingItem.qty++;
        else cart.push({ name, price, qty: 1, imgSrc });
        total += price;
        saveFormState();
        updateCartCount();
        updateCartDisplay();
    }

    function updateCartDisplay() {
        // Recalculate total for safety
        total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        orderListEl.innerHTML = "";

        cart.forEach(item => {
            const itemEl = document.createElement("div");
            itemEl.className = "order-item";
            itemEl.innerHTML = `
                <img src="${item.imgSrc}" alt="${item.name}" class="order-img-small">
                <span class="pie-name">${item.name}</span>
                <span>Qty:</span>
                <button class="qty-minus">−</button>
                <input type="number" class="qty-input" value="${item.qty}" min="1">
                <button class="qty-plus">+</button>
                <button class="remove-item">🗑️</button>
            `;

            itemEl.querySelector(".qty-minus").addEventListener("click", () => {
                if (item.qty > 1) {
                    item.qty--;
                    updateCartDisplay();
                }
            });

            itemEl.querySelector(".qty-plus").addEventListener("click", () => {
                item.qty++;
                updateCartDisplay();
            });

            itemEl.querySelector(".qty-input").addEventListener("change", e => {
                const newQty = Math.max(1, parseInt(e.target.value) || 1);
                e.target.value = newQty; // update input UI if invalid input
                item.qty = newQty;
                updateCartDisplay();
            });

            itemEl.querySelector(".remove-item").addEventListener("click", () => {
                cart = cart.filter(c => c !== item);
                updateCartDisplay();
            });

            orderListEl.appendChild(itemEl);
        });

        orderTotalEls.forEach(el => el.textContent = `Total: $${total.toFixed(2)}`);

        saveFormState();
        updateCartCount();
        updateOrderOnlineLink();
    }

    function showOrderSummary() {
        const summaryEl = document.querySelector("#order-summary");
        summaryEl.innerHTML = "";
        const confNum = generateConfirmationNumber();
        summaryEl.innerHTML += `<h3>Thank you!<br>Your confirmation number is: ${confNum}</h3>`;

        const details = document.createElement("div");
        details.className = "order-details";

        if (document.getElementById("pickup").checked) {
            const pickupInput = document.querySelector('input[name="pickupOption"]:checked');
            const locationLabel = pickupInput?.closest("label")?.textContent.trim() || "(unknown)";
            const date = new Date(pickupDateInput.value);
            details.innerHTML += `
                <p>Pickup at: ${locationLabel}</p>
                <p>Date: ${date.toLocaleDateString()}</p>
                <p>Time: ${formatTime(pickupTimeInput.value)}</p>
            `;
        } else {
            const date = new Date(deliveryDateInput.value);
            details.innerHTML += `
                <p>Delivery to: ${document.getElementById("delivery-address").value}</p>
                <p>Date: ${date.toLocaleDateString()}</p>
                <p>Time: ${formatTime(deliveryTimeInput.value)}</p>
            `;
        }

        const itemsList = document.createElement("ul");
        cart.forEach(i => {
            itemsList.innerHTML += `<li>${i.qty} × ${i.name} - $${(i.price * i.qty).toFixed(2)}</li>`;
        });
        details.appendChild(itemsList);
        summaryEl.appendChild(details);

        // This line helps to scroll to the summary in view
        summaryEl.scrollIntoView({ behavior: "smooth" });
    }


    /* ------------ HELPER FUNCTIONS ------------ */
    function formatTime(str) {
        const [h, m] = str.split(":").map(Number);
        const suffix = h >= 12 ? "PM" : "AM";
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
    }

    function generateConfirmationNumber() {
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        let used = JSON.parse(localStorage.getItem("usedConfirmations") || "[]");
        let num;
        do {
            num = `${mm}${dd}${Math.floor(1000 + Math.random() * 9000)}`;
        } while (used.includes(num));
        used.push(num);
        localStorage.setItem("usedConfirmations", JSON.stringify(used));
        return num;
    }

    // ---------------- DATE/TIME LOGIC ----------------
    function setMinDates() {
        const todayStr = getTodayStr();
        if (pickupDateInput) pickupDateInput.min = todayStr;
        if (deliveryDateInput) deliveryDateInput.min = todayStr;
    }

    function getTodayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    function updateMinTime(dateInput, timeInput) {
        if (!dateInput || !timeInput) return;
        const selected = new Date(dateInput.value);
        const today = new Date();
        timeInput.min = "00:00";

        if (isSameDate(selected, today)) {
            let now = new Date();
            let h = now.getHours();
            let m = Math.ceil(now.getMinutes() / 5) * 5;
            if (m === 60) { m = 0; h++; }
            const minStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            timeInput.min = minStr;
            if (timeInput.value < minStr) timeInput.value = minStr;
        }
    }

    function isSameDate(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    function disablePastTimeOptions(dateInput, timeSelect) {
        if (!dateInput || !timeSelect) return;
        const selectedDate = new Date(dateInput.value);
        const now = new Date();
        const isToday = isSameDate(selectedDate, now);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        Array.from(timeSelect.options).forEach(opt => {
            if (!opt.value) return;
            const [h, m] = opt.value.split(":").map(Number);
            const optionMinutes = h * 60 + m;
            opt.disabled = isToday && optionMinutes <= currentMinutes;
            if (opt.disabled && opt.selected) timeSelect.selectedIndex = 0;
        });
    }

    // ---------------- INITIALIZATION ----------------
    if (pickupDateInput && pickupTimeInput) {
        pickupDateInput.addEventListener("change", () => {
            updateMinTime(pickupDateInput, pickupTimeInput);
            disablePastTimeOptions(pickupDateInput, pickupTimeInput);
        });

        pickupTimeInput.addEventListener("change", () => {
            if (pickupDateInput.value && pickupTimeInput.value &&
                isPastTime(new Date(pickupDateInput.value), pickupTimeInput.value)) {
                showPastTimeWarning();
            }
        });
    }

    if (deliveryDateInput && deliveryTimeInput) {
        deliveryDateInput.addEventListener("change", () => {
            updateMinTime(deliveryDateInput, deliveryTimeInput);
            disablePastTimeOptions(deliveryDateInput, deliveryTimeInput);
        });

        deliveryTimeInput.addEventListener("change", () => {
            if (deliveryDateInput.value && deliveryTimeInput.value &&
                isPastTime(new Date(deliveryDateInput.value), deliveryTimeInput.value)) {
                showPastTimeWarning();
            }
        });
    }

    setMinDates();
    updateMinTime(pickupDateInput, pickupTimeInput);
    updateMinTime(deliveryDateInput, deliveryTimeInput);
    disablePastTimeOptions(pickupDateInput, pickupTimeInput);
    disablePastTimeOptions(deliveryDateInput, deliveryTimeInput);
});