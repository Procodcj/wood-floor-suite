let stainType = null;
let colors = [];
let validationAttempted = false;

function selectType(type) {
  stainType = type;

  document.getElementById("btnOil").classList.toggle("active", type === "oil");
  document.getElementById("btnWater").classList.toggle("active", type === "water");

  const hint = document.getElementById("coverageHint");
  if (type === "oil") {
    hint.textContent = "1 quart covers approximately 165 sq ft";
  } else {
    hint.textContent = "1 gallon covers approximately 700 sq ft";
  }

  document.getElementById("areaGroup").style.display = "block";
  document.getElementById("colorGroup").style.display = "block";
  document.getElementById("divider").style.display = "block";
  document.getElementById("calcBtn").style.display = "block";
  document.getElementById("resetBtn").style.display = "block";

  if (colors.length === 0) addColor();
}

function addColor() {
  colors.push({ id: Date.now(), parts: "", name: "", brand: "" });
  renderColors();
}

function removeColor(id) {
  colors = colors.filter(c => c.id !== id);
  renderColors();
}

function updateColor(id, field, inputEl) {
  const color = colors.find(c => c.id === id);
  if (!color) return;
  color[field] = inputEl.value;
  if (field === "parts") color.partsBadInput = inputEl.validity.badInput;
  // After the first Calculate attempt, re-validate the row live
  if (validationAttempted) applyRowErrors(color);
}

// Accepts only non-negative decimals: "2", "2.5", ".5", "5."
// Rejects negatives, exponents (1e3), Infinity and any other text
function parsePositive(value) {
  const v = String(value).trim();
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(v)) return NaN;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
}

function blockInvalidKeys(event) {
  if (["-", "+", "e", "E"].includes(event.key)) event.preventDefault();
}

// A fully blank row is ignored; a partially filled row must be complete and valid
function getColorErrors(c) {
  const partsRaw = String(c.parts).trim();
  const name = c.name.trim();
  const brand = c.brand.trim();
  if (!partsRaw && !name && !brand && !c.partsBadInput) {
    return { empty: true, parts: false, name: false };
  }
  const parts = parsePositive(partsRaw);
  return {
    empty: false,
    parts: c.partsBadInput || isNaN(parts) || parts <= 0,
    name: !name
  };
}

function setFieldError(el, hasError) {
  if (!el) return;
  el.classList.toggle("error", hasError);
  el.setAttribute("aria-invalid", hasError ? "true" : "false");
}

function applyRowErrors(c) {
  const errs = getColorErrors(c);
  setFieldError(document.getElementById(`parts-${c.id}`), errs.parts);
  setFieldError(document.getElementById(`name-${c.id}`), errs.name);
}

function sanitize(str) {
  if (typeof str !== 'string') str = String(str);
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

function renderColors() {
  const listEl = document.getElementById("colorList");
  listEl.innerHTML = colors.map((c, i) => `
    <div class="color-row">
      <input class="parts-input" id="parts-${c.id}" type="number" placeholder="Parts"
        value="${sanitize(c.parts)}" min="0" step="any" inputmode="decimal"
        aria-label="Color ${i + 1} parts"
        onkeydown="blockInvalidKeys(event)"
        oninput="updateColor(${c.id}, 'parts', this)">
      <input type="text" id="name-${c.id}" placeholder="Color name or number"
        value="${sanitize(c.name)}" aria-label="Color ${i + 1} name or number"
        oninput="updateColor(${c.id}, 'name', this)">
      <input type="text" placeholder="Brand" value="${sanitize(c.brand)}"
        aria-label="Color ${i + 1} brand"
        oninput="updateColor(${c.id}, 'brand', this)">
      <button class="remove-btn" aria-label="Remove color ${i + 1}" onclick="removeColor(${c.id})">✕</button>
    </div>
  `).join("");

  // Keep error marks after adding/removing rows
  if (validationAttempted) colors.forEach(applyRowErrors);
}

function fmt(n) {
  return n.toFixed(2);
}

function calculate() {
  const resultEl = document.getElementById("result");
  resultEl.innerHTML = "";

  const area = parseFloat(document.getElementById("area").value);

  if (!stainType) {
    resultEl.innerHTML = `<div class="error-msg" role="alert">Please select a stain type.</div>`;
    return;
  }
  if (isNaN(area) || area <= 0) {
    document.getElementById("area").classList.add("error");
    resultEl.innerHTML = `<div class="error-msg" role="alert">Please enter a valid area.</div>`;
    return;
  }
  document.getElementById("area").classList.remove("error");

  validationAttempted = true;
  const validColors = [];
  const rowErrors = [];

  colors.forEach((c, i) => {
    const errs = getColorErrors(c);
    applyRowErrors(c);
    if (errs.empty) return;
    if (errs.parts) rowErrors.push(`Color ${i + 1}: parts must be a positive number.`);
    if (errs.name)  rowErrors.push(`Color ${i + 1}: color name or number is required.`);
    if (!errs.parts && !errs.name) validColors.push(c);
  });

  // Never calculate with an incomplete formula: it would unbalance the proportions
  if (rowErrors.length) {
    resultEl.innerHTML = `<div class="error-msg" role="alert">${rowErrors.join("<br>")}</div>`;
    return;
  }
  if (validColors.length === 0) {
    resultEl.innerHTML = `<div class="error-msg" role="alert">Please add at least one color with parts and name.</div>`;
    return;
  }

  let totalOz, unitLabel, unitSize;

  if (stainType === "oil") {
    const totalQuarts = area / 165;
    totalOz = totalQuarts * 32;
    unitLabel = "quart";
    unitSize = 32;
  } else {
    const totalGallons = area / 700;
    totalOz = totalGallons * 128;
    unitLabel = "gallon";
    unitSize = 128;
  }

  const totalParts = validColors.reduce((sum, c) => sum + parsePositive(c.parts), 0);
  const ozPerPart = totalOz / totalParts;

  const colorResults = validColors.map(c => {
    const parts = parsePositive(c.parts);
    const ozNeeded = parts * ozPerPart;
    const unitsToBuy = Math.ceil(ozNeeded / unitSize);
    return { ...c, parts, name: c.name.trim(), brand: c.brand.trim(), ozNeeded, unitsToBuy, unitLabel };
  });

  const mixRows = colorResults.map(c => `
    <div class="result-row">
      <span class="result-label">${sanitize(c.parts)} parts · ${sanitize(c.name)} · ${sanitize(c.brand)}</span>
      <span class="result-value">${fmt(c.ozNeeded)} oz</span>
    </div>
  `).join("");

  const purchaseRows = colorResults.map(c => `
    <div class="purchase-row">
      <span class="purchase-label">${sanitize(c.name)} · ${sanitize(c.brand)}</span>
      <span class="purchase-value">${c.unitsToBuy} ${c.unitLabel}${c.unitsToBuy > 1 ? "s" : ""}</span>
    </div>
  `).join("");

  resultEl.innerHTML = `
    <div class="result-box">
      <div class="result-section-title">Project Summary</div>
      <div class="result-row">
        <span class="result-label">Total Area</span>
        <span class="result-value">${fmt(area)} sq ft</span>
      </div>
      <div class="result-row">
        <span class="result-label">Total Mix Volume</span>
        <span class="result-value big">${fmt(totalOz)} oz</span>
      </div>

      <div class="result-section-title">Mix Breakdown</div>
      ${mixRows}

      <div class="result-section-title">Purchase Guide</div>
      ${purchaseRows}
    </div>
  `;
}

function resetAll() {
  stainType = null;
  colors = [];
  validationAttempted = false;

  document.getElementById("btnOil").classList.remove("active");
  document.getElementById("btnWater").classList.remove("active");
  document.getElementById("coverageHint").textContent = "";
  document.getElementById("area").value = "";
  document.getElementById("area").classList.remove("error");
  document.getElementById("colorList").innerHTML = "";
  document.getElementById("result").innerHTML = "";

  document.getElementById("areaGroup").style.display = "none";
  document.getElementById("colorGroup").style.display = "none";
  document.getElementById("divider").style.display = "none";
  document.getElementById("calcBtn").style.display = "none";
  document.getElementById("resetBtn").style.display = "none";
}