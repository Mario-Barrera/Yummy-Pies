document.addEventListener("DOMContentLoaded", function () {
  const accordionHeaders = document.querySelectorAll(".accordion-header");

  accordionHeaders.forEach(function (button) {

    button.addEventListener("click", function () {

      // dynamically read the relationship between the button and the content panel it controls using the aria-controls attribute
      const contentId = button.getAttribute("aria-controls");

      // contentId is a variable that contains a string, and that string matches the id of the element you want to select
      const content = document.getElementById(contentId);

      const icon = button.querySelector(".toggle-icon");

      // this checks if the accordion is currently open
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      // this code flips the current state
      button.setAttribute("aria-expanded", !isExpanded);

      // Toggle visibility of content
      content.hidden = isExpanded;

      icon.textContent = isExpanded ? "+" : "-";
    });

  });

});
