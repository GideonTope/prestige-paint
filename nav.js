(function () {
  var toggle = document.getElementById("nav-toggle");
  var nav = document.querySelector("ul.nav");

  if (!toggle || !nav) return;

  // Toggle open/close
  toggle.addEventListener("click", function () {
    var isOpen = nav.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close when any nav link is tapped
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  // Close when tapping outside the header
  document.addEventListener("click", function (e) {
    var header = document.getElementById("header");
    if (header && !header.contains(e.target)) {
      nav.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
})();