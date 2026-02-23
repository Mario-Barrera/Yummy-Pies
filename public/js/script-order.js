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
    pickupTime: "",
  },

  deliveryInfo: {
    deliveryAddress: "",
    deliveryDate: "",
    deliveryTime: "",
  },

  orderNowList: [],

  customerName: {
    firstName: "",
    lastName: "",
  },

  addressInfo: {
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
  },

  paymentInfo: {
    ccNumber: "",
    ccType: "",
    ccv: "",
    expMonth: "",
    expYear: "",
  },

  orderTotal: "",
};

// Select all order form steps
const steps = document.querySelectorAll(".event-section");

// define the navigation function
function goToStep(stepId) {
  const steps = document.querySelectorAll(".event-section");
  if (!steps.length) return;

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
  validateStep6("continue"); 
}


function validateStep6(direction) {
  console.log("✅ validateStep6 CALLED with:", direction);
  if (direction === "back") {
    goToStep("step5");
    return;
  }

  const orderSummary = document.getElementById("order-summary");

  if (!orderSummary) {
    alert("Missing order summary");
    return;
  }

  if (orderFormData.orderOption === "pickup") {
    const pickup = orderFormData.pickupInfo;

    // '!pickup' is used if pickup is undefined
    if (
      !pickup ||
      !pickup.pickupOption ||
      !pickup.pickupDate ||
      !pickup.pickupTime
    ) {
      alert("Pickup details are incomplete");
      goToStep("step2");
      return;
    }
  } else if (orderFormData.orderOption === "delivery") {
    const delivery = orderFormData.deliveryInfo;

    // '!delivery' is used if pickup is undefined
    if (
      !delivery ||
      !delivery.deliveryAddress ||
      !delivery.deliveryDate ||
      !delivery.deliveryTime
    ) {
      alert("Delivery details are incomplete");
      goToStep("step3");
      return;
    }
  }

  // '.isArray()' is a method and means: if orderNowList is NOT an array
  if (
    !Array.isArray(orderFormData.orderNowList) ||
    orderFormData.orderNowList.length === 0
  ) {
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

  console.log("✅ orderOption:", orderFormData.orderOption);
console.log("✅ pickupInfo:", orderFormData.pickupInfo);

  if (orderFormData.orderOption === "pickup") {
    const p = orderFormData.pickupInfo;
    fullfillmentLine = `
      Pickup: ${p.pickupOption}<br>
      Date: ${p.pickupDate}<br>
      Time: ${p.pickupTime}
      `;
  } else if (orderFormData.orderOption === "delivery") {
    const d = orderFormData.deliveryInfo;
    fullfillmentLine = `
      Delivery: ${d.deliveryAddress}<br>
      Date: ${d.deliveryDate}<br>
      Time: ${d.deliveryTime}
      `;
  }

  // Customer name and Billing
  // '?.' is Optional Chaining
  const fullName = `${orderFormData.customerName.firstName} ${orderFormData.customerName.lastName}`;

  const summaryAddress = orderFormData.addressInfo;
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
  const total = orderFormData.orderNowList.reduce(function (sum, item) {
    return sum + item.price * item.qty;
   }, 0);

  orderFormData.orderTotal = total;

  // Rendering Order Summary
  orderSummary.innerHTML = `
    <h2> Order Summary</h2>

    <h3>Fullfillment</h3> 
    <p>${fullfillmentLine}</p>

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

    <h3>Order Total</h3>
    <p>$${total.toFixed(2)}</p>
    `;
}


function startNewOrder() {

    const form = document.querySelector("form");

    if (form !== null) {
        form.reset();
    };
    
    orderFormData.orderOption = "";

    orderFormData.pickupInfo = {
      pickupOption: "",
      pickupDate: "",
      pickupTime: "",
    };

    orderFormData.deliveryInfo = {
      deliveryAddress: "",
      deliveryDate: "",
      deliveryTime: "",
    };

    orderFormData.orderNowList = [];

    orderFormData.customerName = {
      firstName: "",
      lastName: "",
    };

    orderFormData.addressInfo = {
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
    };

    orderFormData.paymentInfo = {
      ccNumber: "",
      ccType: "",
      ccv: "",
      expMonth: "",
      expYear: "",
    };

    orderFormData.orderTotal = "";

    // Clears the rendered order summary from the UI
    const orderSummary = document.getElementById("order-summary");
    if (orderSummary !== null) {
        orderSummary.innerHTML = "";
    };

    goToStep("step1");
  }
