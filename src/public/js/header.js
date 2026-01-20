document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navbar = document.querySelector(".navbar");
  
    if (!menuToggle || !navbar) return;
  
    menuToggle.addEventListener("click", () => {
      menuToggle.classList.toggle("active");
      navbar.classList.toggle("active");
    });
  
    // Auto-close after click
    document.querySelectorAll(".navbar a").forEach(link => {
      link.addEventListener("click", () => {
        navbar.classList.remove("active");
        menuToggle.classList.remove("active");
      });
    });
  });
  