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
    const pickupTimeInput = document.getElementById("pickup-time");
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
        const formState = { cart: cart || [] }; // keep cart as before

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
            if (section.id !== "order-summary") {  
                section.style.display = index === step - 1 ? "block" : "none";
            }
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
        console.log('validateStep5 called with direction:', direction);
        if (direction === "back") return showStep(4);

        const fields = [
            'input[name="first-name"]',
            'input[name="last-name"]',
            'input[name="address1"]',
            'input[name="address2"]',
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
    }
    

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

// ---------------- GOOGLE AUTOCOMPLETE FOR DELIVERY ----------------
let deliveryAutocomplete;

window.initDeliveryAutocomplete = function() {
    const input = document.getElementById("delivery-address");
    if (!input || deliveryAutocomplete) return; // prevent multiple init

    deliveryAutocomplete = new google.maps.places.Autocomplete(input, {
        fields: ["formatted_address", "geometry"],
        componentRestrictions: { country: "us" }
    });

    deliveryAutocomplete.addListener("place_changed", () => {
        const place = deliveryAutocomplete.getPlace();
        console.log("Selected address:", place.formatted_address);

        // Restrict to Texas
        if (!place.formatted_address.toUpperCase().includes("TX")) {
            alert("Please select an address in Texas.");
            input.value = "";
        }
    });
};