/* ==========================================================================
   Prestige Paint Depot — chrome & motion
   Masthead state · full-screen menu · scroll reveals · category hover peek
   Motion is here to support the layout; everything degrades to a static,
   fully readable page if JS never runs or motion is reduced.
   ========================================================================== */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- masthead ---------------------------------------------------------- */
const masthead = document.querySelector(".masthead");
if (masthead) {
  const onScroll = () => masthead.classList.toggle("is-stuck", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---- full-screen menu -------------------------------------------------- */
const menuBtn = document.querySelector(".menu-btn");
const menu = document.getElementById("menu");

function setMenu(open) {
  document.documentElement.toggleAttribute("data-menu-open", open);
  menuBtn?.setAttribute("aria-expanded", String(open));
  menu?.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";

  // stagger the links in on open
  menu?.querySelectorAll(".menu__list a").forEach((a, i) => {
    a.style.transitionDelay = open ? `${120 + i * 55}ms` : "0ms";
  });
}

menuBtn?.addEventListener("click", () =>
  setMenu(menuBtn.getAttribute("aria-expanded") !== "true")
);
menu?.addEventListener("click", (e) => {
  if (e.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

/* ---- scroll reveals ---------------------------------------------------- */
/* One observer for every animated element on the page. Elements are marked
   in the markup, so a JS failure leaves plain, visible content. */
const SEL = ".reveal:not(.is-in), .reveal-img:not(.is-in), .reveal-line:not(.is-in)";

function initReveals() {
  const targets = [...document.querySelectorAll(SEL)];
  if (reduced) {
    targets.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  targets.forEach((el) => io.observe(el));

  /* Safety net. An observer only reports what actually passes through the
     viewport — an anchor jump, a restored scroll position or a hard fling can
     skip a section entirely, leaving it invisible until the user scrolls back
     up. So on every settled scroll, anything already at or above the fold is
     revealed regardless. Content is never allowed to stay hidden. */
  let ticking = false;
  const sweep = () => {
    ticking = false;
    document.querySelectorAll(SEL).forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
        el.classList.add("is-in");
        io.unobserve(el);
      }
    });
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sweep);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("load", onScroll);
  onScroll();
  // late images and web fonts shift the layout; re-check once things settle
  setTimeout(sweep, 1200);
}
window.__reveal = initReveals;
initReveals();

// hero elements animate on load rather than on scroll
requestAnimationFrame(() => document.documentElement.classList.add("is-ready"));

/* ---- year ------------------------------------------------------------- */
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});
