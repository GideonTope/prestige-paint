/* ==========================================================================
   Prestige Paint Depot — colour experience

   One module drives two contexts:
     · the homepage, where a condensed strip previews the library
     · /colours, where the full 108 shades are browsable

   Selecting a shade fills the large stage panel rather than opening a modal:
   the point of a colour library is to see the colour big, not to read a card
   about it. Texcote shades carry the stone relief because that range really
   does have aggregate in it.
   ========================================================================== */
(function () {
  "use strict";

  var DATA = (window.PPD || {});
  var COLOURS = DATA.COLOURS || [];
  var RANGES = DATA.RANGES || [];
  var FAMILIES = DATA.FAMILIES || [];
  if (!COLOURS.length) return;

  COLOURS.forEach(function (c, i) { c.i = i; });

  var WA = "https://wa.me/2347035600054?text=";

  var stage = document.querySelector("[data-colour-stage]");
  var grids = document.querySelector("[data-colour-grids]");
  var strip = document.querySelector("[data-colour-strip]");
  var chipsWrap = document.querySelector("[data-colour-families]");
  var search = document.querySelector("[data-colour-search]");
  var sort = document.querySelector("[data-colour-sort]");
  var count = document.querySelector("[data-colour-count]");

  var family = "All";

  /* ---- helpers --------------------------------------------------------- */
  function onColour(hex) {
    var h = hex.replace("#", "");
    var p = [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; });
    var lin = p.map(function (c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    var L = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    return L > 0.45 ? "#141412" : "#f2f0eb";
  }

  function tint(hex, amount) {
    var h = hex.replace("#", "");
    return "#" + [0, 2, 4].map(function (i) {
      var c = parseInt(h.slice(i, i + 2), 16);
      return Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0");
    }).join("");
  }

  function matches() {
    var q = ((search && search.value) || "").trim().toLowerCase();
    return COLOURS.filter(function (c) {
      var okFam = family === "All" || c.family === family;
      var okQ = !q ||
        c.name.toLowerCase().indexOf(q) > -1 ||
        (c.code || "").toLowerCase().indexOf(q) > -1 ||
        c.family.toLowerCase().indexOf(q) > -1 ||
        c.rangeLabel.toLowerCase().indexOf(q) > -1;
      return okFam && okQ;
    });
  }

  function sorted(rows) {
    var mode = (sort && sort.value) || "chart";
    var out = rows.slice();
    if (mode === "light") out.sort(function (a, b) { return b.lrv - a.lrv; });
    else if (mode === "dark") out.sort(function (a, b) { return a.lrv - b.lrv; });
    else if (mode === "name") out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else out.sort(function (a, b) { return a.i - b.i; });
    return out;
  }

  /* ---- the stage ------------------------------------------------------- */
  function paintStage(c) {
    if (!stage) return;
    var fill = stage.querySelector("[data-stage-fill]");
    var body = stage.querySelector("[data-stage-body]");
    if (!fill || !body) return;

    fill.style.backgroundColor = c.hex;
    fill.classList.toggle("is-textured", !!c.textured);

    var pairs = COLOURS
      .filter(function (x) { return x.lrv > 78 && x.hex !== c.hex; })
      .sort(function (a, b) { return b.lrv - a.lrv; })
      .slice(0, 4)
      .concat([{ name: "A softer tint of " + c.name, hex: tint(c.hex, 0.6) }]);

    body.innerHTML =
      '<p class="label"><span class="label-num">' + (c.code || "—") + "</span> " + c.rangeLabel + "</p>" +
      "<h3>" + c.name + "</h3>" +
      '<p class="lede">' + c.desc + (c.textured ? " · stone-textured finish" : "") + "</p>" +
      '<dl class="colour-facts">' +
        "<div><dt>How bright</dt><dd>" + c.lrv + " out of 100" +
          (c.lrv >= 70 ? " — bright" : c.lrv >= 40 ? " — mid" : " — deep") + "</dd></div>" +
        "<div><dt>Colour family</dt><dd>" + c.family + "</dd></div>" +
        "<div><dt>Chart</dt><dd>" + c.rangeLabel + "</dd></div>" +
      "</dl>" +
      '<div><p class="meta" style="margin-bottom:10px">Pairs well with</p><div style="display:flex;gap:8px">' +
        pairs.map(function (p) {
          return '<span title="' + p.name + '" style="width:44px;height:44px;background:' + p.hex + ';border:1px solid rgba(20,20,18,.14)"></span>';
        }).join("") +
      "</div></div>" +
      '<div style="display:flex;gap:14px;flex-wrap:wrap">' +
        '<a class="btn btn--sm" target="_blank" rel="noopener" href="' + WA +
          encodeURIComponent("Hello Prestige Paint Depot, I'd like to ask about " + c.name +
            (c.code ? " (" + c.code + ")" : "") + " from the " + c.rangeLabel + " chart.") +
        '"><span>Enquire about this shade</span></a>' +
      "</div>" +
      '<p class="meta" style="text-transform:none;letter-spacing:0;font-size:.78rem;line-height:1.5">' +
        "Screen colour is a guide, not a match. Check " + c.name +
        " against the printed chart in store — the light in your own room changes everything.</p>";

    stage.setAttribute("data-current", String(c.i));
  }

  /* ---- swatch markup --------------------------------------------------- */
  function swatch(c) {
    return '<button class="sw' + (c.textured ? " is-textured" : "") + '" data-i="' + c.i +
      '" aria-label="' + c.name + (c.code ? ", " + c.code : "") + ", LRV " + c.lrv + '">' +
      '<span class="sw__fill" style="background:' + c.hex + '"></span>' +
      '<span class="sw__meta"><span class="sw__name">' + c.name + "</span>" +
      '<span class="sw__code">' + (c.code || "—") + " · light " + c.lrv + "/100</span></span></button>";
  }

  /* ---- render ---------------------------------------------------------- */
  function render() {
    if (!grids) return;
    var rows = sorted(matches());

    if (count) {
      count.textContent = rows.length === COLOURS.length
        ? COLOURS.length + " shades"
        : rows.length + " of " + COLOURS.length;
    }

    var html = RANGES.map(function (rg) {
      var mine = rows.filter(function (c) { return c.range === rg.slug; });
      if (!mine.length) return "";
      return '<div class="range-head reveal"><h3>' + rg.label + "</h3>" +
        '<p class="meta">' + mine.length + " of " + rg.count + " shades" +
        (rg.textured ? " · stone-textured" : "") + "</p></div>" +
        '<div class="swatches">' + mine.map(swatch).join("") + "</div>";
    }).join("");

    grids.innerHTML = html || '<p class="lib-empty">No shade matches that. Try another name or code.</p>';
    if (window.__reveal) window.__reveal();
  }

  /* ---- wire up --------------------------------------------------------- */
  if (chipsWrap) {
    var counts = {};
    COLOURS.forEach(function (c) { counts[c.family] = (counts[c.family] || 0) + 1; });
    chipsWrap.innerHTML =
      '<button class="chip" data-fam="All" aria-pressed="true">All<span class="n">' + COLOURS.length + "</span></button>" +
      FAMILIES.map(function (f) {
        return '<button class="chip" data-fam="' + f + '" aria-pressed="false">' + f +
          '<span class="n">' + counts[f] + "</span></button>";
      }).join("");

    chipsWrap.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      family = b.dataset.fam;
      chipsWrap.querySelectorAll(".chip").forEach(function (c) {
        c.setAttribute("aria-pressed", String(c === b));
      });
      render();
    });
  }

  if (grids) {
    grids.addEventListener("click", function (e) {
      var b = e.target.closest(".sw");
      if (!b) return;
      paintStage(COLOURS[+b.dataset.i]);
      if (stage && window.matchMedia("(max-width: 900px)").matches) {
        stage.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (strip) {
    // homepage: a curated spread across the whole library, not the first N
    var step = Math.max(1, Math.floor(COLOURS.length / 18));
    var picks = COLOURS.filter(function (_, i) { return i % step === 0; }).slice(0, 18);
    strip.innerHTML = picks.map(swatch).join("");
    strip.addEventListener("click", function (e) {
      var b = e.target.closest(".sw");
      if (b) paintStage(COLOURS[+b.dataset.i]);
    });
  }

  if (sort) sort.addEventListener("change", render);
  if (search) {
    var t;
    search.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(render, 150);
    });
  }

  /* ---- boot ------------------------------------------------------------ */
  render();
  if (stage) {
    var startIndex = parseInt(stage.getAttribute("data-start") || "", 10);
    var start = COLOURS[startIndex] || COLOURS.find(function (c) { return c.textured; }) || COLOURS[0];
    paintStage(start);
  }
})();
