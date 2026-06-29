const COVERAGE_PER_LITRE = 10; // sq/m per coat

const PAINT_NAMES = {
  emulsion: "Emulsion Paint",
  satin: "Satin Paint",
  gloss: "Gloss Paint",
  texcote: "Texcote",
};

function calculate() {
  // 1. Read inputs
  const length = parseFloat(document.getElementById("length").value);
  const width = parseFloat(document.getElementById("width").value);
  const height = parseFloat(document.getElementById("height").value);
  const surface = document.getElementById("surface").value;
  const paintType = document.getElementById("paintType").value;
  const openings = parseInt(document.getElementById("openings").value) || 0;
  const coatsEl = document.querySelector('input[name="coats"]:checked');
  const coats = coatsEl ? parseInt(coatsEl.value) : 2;

  // 2. Validate
  if (
    !length ||
    !width ||
    !height ||
    length <= 0 ||
    width <= 0 ||
    height <= 0
  ) {
    alert("Please enter valid room dimensions before calculating.");
    return;
  }

  // 3. Calculate area
  let area = 0;
  if (surface === "walls") {
    area = 2 * (length + width) * height;
  } else if (surface === "ceiling") {
    area = length * width;
  } else {
    // walls + ceiling
    area = 2 * (length + width) * height + length * width;
  }

  // Subtract doors/windows (each ~2 sq/m)
  area = Math.max(0, area - openings * 2);

  // 4. Litres needed (area ÷ coverage × coats)
  const litresNeeded = (area / COVERAGE_PER_LITRE) * coats;

  // 5. Product counts (always round up)
  const gallonsNeeded = Math.ceil(litresNeeded / 4);
  const drumsNeeded = Math.ceil(litresNeeded / 20);

  // 6. Smart recommendation (mix of drums + gallons where it makes sense)
  const recItems = buildRecommendation(litresNeeded, paintType);

  // 7. Update stats
  document.getElementById("res-area").textContent = area.toFixed(1);
  document.getElementById("res-litres").textContent = Math.ceil(litresNeeded);

  // 8. Render recommendation
  const recEl = document.getElementById("rec-items");
  recEl.innerHTML = "";
  recItems.forEach(function (item) {
    const row = document.createElement("div");
    row.className = "rec-item";
    row.innerHTML =
      '<span class="rec-item-name">' +
      item.name +
      "</span>" +
      '<span class="rec-item-qty">&times; ' +
      item.qty +
      "</span>";
    recEl.appendChild(row);
  });

  // 9. Build WhatsApp pre-filled message
  const recText = recItems
    .map(function (i) {
      return "• " + i.name + " × " + i.qty;
    })
    .join("%0A");

  const msg =
    "Hello Divine Mercy Prestige Paint Depot,%0A%0A" +
    "I used your Paint Calculator and I need:%0A%0A" +
    recText +
    "%0A%0ARoom details:%0A" +
    "• Dimensions: " +
    length +
    "m × " +
    width +
    "m × " +
    height +
    "m%0A" +
    "• Paint type: " +
    PAINT_NAMES[paintType] +
    "%0A" +
    "• Coats: " +
    coats +
    "%0A%0A" +
    "Please confirm availability and pricing. Thank you!";

  document.getElementById("wa-order-btn").href =
    "https://wa.me/2347035600054?text=" + msg;

  // 10. Show results, hide empty state
  document.getElementById("empty-state").style.display = "none";
  document.getElementById("results-content").style.display = "block";

  // Scroll results into view on mobile
  if (window.innerWidth <= 768) {
    document.getElementById("results-content").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function buildRecommendation(litres, paintType) {
  const name = PAINT_NAMES[paintType];
  const items = [];

  const fullDrums = Math.floor(litres / 20);
  const remainder = litres % 20;
  const extraGallons = Math.ceil(remainder / 4);

  if (litres <= 4) {
    // Small job: 1 gallon
    items.push({ name: name + " — Gallon (4L)", qty: 1 });
  } else if (fullDrums === 0) {
    // Less than a drum: use gallons only
    items.push({ name: name + " — Gallon (4L)", qty: Math.ceil(litres / 4) });
  } else {
    // One or more full drums
    items.push({ name: name + " — Drum (20L)", qty: fullDrums });
    // Plus any remainder in gallons
    if (remainder > 0) {
      items.push({ name: name + " — Gallon (4L)", qty: extraGallons });
    }
  }

  return items;
}

function resetCalc() {
  document.getElementById("results-content").style.display = "none";
  document.getElementById("empty-state").style.display = "block";
  // Clear inputs
  ["length", "width", "height"].forEach(function (id) {
    document.getElementById(id).value = "";
  });
  document.getElementById("openings").value = "0";
  document.getElementById("length").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
