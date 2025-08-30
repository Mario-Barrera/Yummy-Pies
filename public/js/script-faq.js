document.addEventListener("DOMContentLoaded", () => {
  const accordions = document.querySelectorAll(".accordion-header");

  accordions.forEach(header => {
    header.addEventListener("click", () => {
      const expanded = header.getAttribute("aria-expanded") === "true";
      const content = document.getElementById(header.getAttribute("aria-controls"));

      // Toggle current accordion
      header.setAttribute("aria-expanded", !expanded);
      content.hidden = expanded; // hide if it was open, show if it was closed
    });
  });
});
