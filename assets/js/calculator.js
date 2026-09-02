/* ==========================================================================
   Prestige Paint Depot — paint calculator

   Written for a customer who has never used a calculator like this: three
   plain questions, one plain answer. The answer leads with buckets, because
   buckets are what you carry out of the shop; litres come second.

   Everything can be driven with a thumb — every number has a minus and a plus
   — and it works in feet as well as metres, because plenty of people here
   think in feet. No framework, no build step, works straight from disk.
   ========================================================================== */
(function () {
  "use strict";

  var form = document.getElementById("calc");
  if (!form) return;

  /* Spread rates are working planning estimates, not manufacturer
     specifications — the page says so in plain words. Pack sizes are the
     sizes actually sold over the counter. */
  var FINISHES = {
    emulsion: { label: "emulsion", spread: 12, packs: [20, 4] },
    matt: { label: "matt", spread: 11, packs: [20, 4] },
    satin: { label: "satin", spread: 11, packs: [20, 4] },
    gloss: { label: "gloss", spread: 13, packs: [4] },
    texcote: { label: "Texcote textured", spread: 5, packs: [20] }
  };

  var DOOR = 1.9;    // m² taken off per door
  var WINDOW = 1.4;  // m² taken off per window
  var FT = 0.3048;   // one foot in metres

  var el = function (id) { return document.getElementById(id); };
  var LEN_IDS = ["q-len", "q-wid", "q-hgt"];
  var COUNT_IDS = ["q-doors", "q-wins", "q-coats"];

  var unit = "m";  // what the visitor is typing in; the maths is always metric

  function num(node, fallback) {
    var v = parseFloat(node && node.value);
    return isFinite(v) && v >= 0 ? v : (fallback || 0);
  }

  function metres(id) {
    var v = num(el(id));
    return unit === "ft" ? v * FT : v;
  }

  function round(v, dp) {
    var f = Math.pow(10, dp);
    return Math.round(v * f) / f;
  }

  /* ---- pack selection --------------------------------------------------
     A plain greedy fill is wasteful at the boundaries: 39 litres in 20s and
     4s greedily becomes 1×20 + 5×4 — six containers to hold what two buckets
     would. So try every plausible count of the biggest size and keep whichever
     valid combination buys the least paint, breaking ties on fewest tins. */
  function bestPacks(need, packs) {
    var sizes = packs.slice().sort(function (a, b) { return b - a; });
    var best = null;
    var maxLarge = Math.ceil(need / sizes[0]) + 1;

    for (var n = 0; n <= maxLarge; n++) {
      var remaining = need - n * sizes[0];
      var counts = [n];
      for (var i = 1; i < sizes.length; i++) {
        var last = i === sizes.length - 1;
        var c = remaining <= 0 ? 0 : (last ? Math.ceil(remaining / sizes[i]) : Math.floor(remaining / sizes[i]));
        counts.push(c);
        remaining -= c * sizes[i];
      }
      if (remaining > 1e-6) continue;

      var litres = counts.reduce(function (s, c, i) { return s + c * sizes[i]; }, 0);
      var units = counts.reduce(function (s, c) { return s + c; }, 0);
      if (litres <= 0) continue;

      if (!best || litres < best.litres - 1e-6 ||
          (Math.abs(litres - best.litres) < 1e-6 && units < best.units)) {
        best = { counts: counts, sizes: sizes, litres: litres, units: units };
      }
    }
    return best;
  }

  /* "2 buckets of 20 litres + 1 gallon of 4 litres" — said the way it is
     bought, not as a row of pack codes. Gideon's correction: across the
     counter the 4-litre size is called a "gallon" for every finish except
     gloss, which is sold as a "tin". 20-litre stays "bucket" throughout. */
  function inWords(best, finishKey) {
    if (!best) return "";
    var parts = [];
    best.counts.forEach(function (c, i) {
      if (!c) return;
      var size = best.sizes[i];
      var noun;
      if (size >= 20) {
        noun = c === 1 ? "bucket" : "buckets";
      } else if (finishKey === "gloss") {
        noun = c === 1 ? "tin" : "tins";
      } else {
        noun = c === 1 ? "gallon" : "gallons";
      }
      parts.push(c + " " + noun + " of " + size + " litres");
    });
    return parts.join("  +  ");
  }

  function finishKey() {
    var picked = form.querySelector('input[name="finish"]:checked');
    return (picked && FINISHES[picked.value]) ? picked.value : "emulsion";
  }

  function finish() {
    return FINISHES[finishKey()];
  }

  function unitWord() { return unit === "ft" ? " feet" : " metres"; }

  /* ---- the sum ---------------------------------------------------------- */
  function compute() {
    var L = metres("q-len"), W = metres("q-wid"), H = metres("q-hgt");
    var doors = num(el("q-doors")), wins = num(el("q-wins"));
    var coats = Math.max(1, num(el("q-coats"), 2));
    var f = finish();

    var walls = 2 * (L + W) * H;
    var net = Math.max(0, walls - (doors * DOOR + wins * WINDOW));
    var litres = (net * coats) / f.spread;

    var packsEl = el("q-packs"), litEl = el("q-litres"), sumEl = el("q-summary");
    if (!packsEl) return;

    if (!L || !W || !H) {
      packsEl.textContent = "—";
      litEl.textContent = "Fill in the room size above.";
      sumEl.textContent = "";
      return;
    }

    var best = bestPacks(Math.ceil(litres * 10) / 10, f.packs);
    var words = inWords(best, finishKey());
    var size = round(num(el("q-len")), 1) + " by " + round(num(el("q-wid")), 1) + unitWord();
    var height = round(num(el("q-hgt")), 1) + unitWord();

    /* Be honest about the spare. Where a finish only comes in 20-litre
       buckets, the smallest legal buy can be well over what the room needs —
       saying "a little left over" there would be a lie. */
    var spare = best ? best.litres - litres : 0;
    var spareWords = ".";
    if (spare > 5) {
      spareWords = ", so about " + spare.toFixed(0) + " litres would be spare — " +
        "that is the smallest amount this pack size allows.";
    } else if (spare > 0.75) {
      spareWords = ", with a little left over for touch-ups.";
    }

    packsEl.textContent = words || "—";
    var mini = el("q-packs-mini");
    if (mini) mini.textContent = words || "—";
    litEl.textContent = "Your room needs about " + litres.toFixed(1) + " litres" + spareWords;
    sumEl.textContent = "A room " + size + ", walls " + height + " high · " +
      coats + " coat" + (coats > 1 ? "s" : "") + " of " + f.label + " · " +
      doors + " door" + (doors === 1 ? "" : "s") + " and " +
      wins + " window" + (wins === 1 ? "" : "s") + " taken off.";

    var link = el("q-wa");
    if (link) {
      link.href = "https://wa.me/2347035600054?text=" + encodeURIComponent(
        "Hello Prestige Paint Depot. My room is " + size + ", walls " + height +
        " high, with " + doors + " door(s) and " + wins + " window(s). I want " +
        coats + " coat(s) of " + f.label + ". The calculator says " +
        (words || litres.toFixed(1) + " litres") +
        ". Please confirm the price and whether this is enough."
      );
    }
  }

  /* ---- controls --------------------------------------------------------- */
  function clamp(input, v) {
    var min = parseFloat(input.min);
    if (isFinite(min) && v < min) v = min;
    return v < 0 ? 0 : v;
  }

  form.addEventListener("click", function (e) {
    /* minus / plus. A room moves in half metres or whole feet — the smallest
       change worth making — everything else moves one at a time. */
    var b = e.target.closest("[data-step]");
    if (b) {
      var bits = b.getAttribute("data-step").split("|");
      var input = el(bits[0]);
      if (!input) return;
      var isLen = LEN_IDS.indexOf(bits[0]) > -1;
      var step = isLen ? (unit === "ft" ? 1 : 0.5) : 1;
      var next = clamp(input, round(num(input) + parseFloat(bits[1]) * step, 2));
      input.value = isLen ? round(next, 1) : Math.round(next);
      compute();
      return;
    }

    /* room presets — one tap fills all three sizes */
    var p = e.target.closest(".preset");
    if (p) {
      var vals = p.getAttribute("data-preset").split(",").map(parseFloat);
      LEN_IDS.forEach(function (id, i) {
        el(id).value = unit === "ft" ? Math.round(vals[i] / FT) : vals[i];
      });
      form.querySelectorAll(".preset").forEach(function (x) {
        x.classList.toggle("is-on", x === p);
      });
      compute();
      return;
    }

    /* metres / feet — convert what is already there so it stays the same
       room, then re-label every box */
    var s = e.target.closest("[data-unit]");
    if (s) {
      var next2 = s.getAttribute("data-unit");
      if (next2 === unit) return;
      LEN_IDS.forEach(function (id) {
        var input = el(id);
        var v = num(input);
        if (!v) return;
        input.value = next2 === "ft" ? Math.round(v / FT) : round(v * FT, 1);
      });
      unit = next2;
      form.querySelectorAll("[data-unit]").forEach(function (btn) {
        btn.classList.toggle("is-on", btn === s);
      });
      form.querySelectorAll("[data-unit-label]").forEach(function (l) {
        l.textContent = unit === "ft" ? "ft" : "m";
      });
      LEN_IDS.forEach(function (id) { el(id).step = unit === "ft" ? 1 : 0.5; });
      compute();
    }
  });

  LEN_IDS.concat(COUNT_IDS).forEach(function (id) {
    var node = el(id);
    if (!node) return;
    node.addEventListener("input", compute);
    node.addEventListener("change", compute);
  });
  form.querySelectorAll('input[name="finish"]').forEach(function (r) {
    r.addEventListener("change", compute);
  });

  form.addEventListener("submit", function (e) { e.preventDefault(); });

  /* ---- the phone summary bar -------------------------------------------
     On a small screen the answer card sits below every question, so you are
     changing numbers with the result off-screen. This bar carries the answer
     down the form with you, and taking it back to the full card is one tap.
     It only exists on narrow screens, and only while the questions are in
     view — never over the answer itself, and never on desktop. */
  var bar = document.getElementById("calcbar");
  var card = form.querySelector(".answer");
  var steps = form.querySelector(".calc2__steps");

  if (bar && card && steps && "IntersectionObserver" in window) {
    var stepsSeen = false, cardSeen = false;
    var narrow = window.matchMedia("(max-width: 900px)");

    var sync = function () {
      bar.hidden = !(narrow.matches && stepsSeen && !cardSeen);
    };

    new IntersectionObserver(function (es) {
      es.forEach(function (e) { stepsSeen = e.isIntersecting; });
      sync();
    }, { threshold: 0 }).observe(steps);

    new IntersectionObserver(function (es) {
      es.forEach(function (e) { cardSeen = e.isIntersecting; });
      sync();
    }, { threshold: 0.2 }).observe(card);

    (narrow.addEventListener ? narrow.addEventListener("change", sync) : narrow.addListener(sync));
    bar.addEventListener("click", function () {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    sync();
  }

  compute();
})();
