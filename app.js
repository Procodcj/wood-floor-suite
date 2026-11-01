let palletHistory = [];

function reset() {
  clearErrors();
  ["length", "width", "numberOfBoards", "bundlesPerPallet"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("lengthUnit").value = "feet";
  document.getElementById("widthUnit").value = "inches";
  const resultEl = document.getElementById("result");
  resultEl.style.display = "none";
  resultEl.innerHTML = "";
  document.getElementById("length").focus();
}

function parseFraction(value) {
  if (typeof value !== "string") return NaN;
  const v = value.trim();
  if (!v) return NaN;

  // 1) Mixed number with space or hyphen: "12 3/4" or "12-3/4"
  const mixedMatch = v.match(/^(\d+)(?:\s+|\s*-\s*)(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const num = Number(mixedMatch[2]);
    const den = Number(mixedMatch[3]);
    if (den === 0) return NaN;
    const result = whole + num / den;
    return Number.isFinite(result) ? result : NaN;
  }

  // 2) Simple fraction: "3/4"
  const fracMatch = v.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const den = Number(fracMatch[2]);
    if (den === 0) return NaN;
    const result = num / den;
    return Number.isFinite(result) ? result : NaN;
  }

  // 3) Standard whole or decimal number: "12", "12.75", ".75", "12."
  if (/^(\d+(\.\d*)?|\.\d+)$/.test(v)) {
    const result = parseFloat(v);
    return Number.isFinite(result) ? result : NaN;
  }

  return NaN;
}

function parsePositiveInt(value) {
  if (typeof value !== "string") return NaN;
  const v = value.trim();
  if (!/^\d+$/.test(v)) return NaN;
  const n = Number(v);
  return Number.isSafeInteger(n) && n > 0 ? n : NaN;
}

function fmt(n) {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function sanitize(str) {
  if (typeof str !== "string") str = String(str);
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

function setError(id, msg) {
  const el = document.getElementById(id);
  el.classList.add("error");
  el.setAttribute("aria-invalid", "true");
  return msg;
}

function clearErrors() {
  ["length", "width", "numberOfBoards", "bundlesPerPallet"].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove("error");
    el.setAttribute("aria-invalid", "false");
  });
}

function calculate() {
  clearErrors();
  const resultEl = document.getElementById("result");
  resultEl.style.display = "none";
  resultEl.innerHTML = "";

  const errors = [];

  const lengthRaw  = parseFraction(document.getElementById("length").value);
  const widthRaw   = parseFraction(document.getElementById("width").value);
  const numBoards  = parsePositiveInt(document.getElementById("numberOfBoards").value);
  const numBundles = parsePositiveInt(document.getElementById("bundlesPerPallet").value);

  if (!Number.isFinite(lengthRaw) || lengthRaw <= 0)   errors.push(setError("length",          "Bundle length is required and must be a valid measure > 0."));
  if (!Number.isFinite(widthRaw)  || widthRaw  <= 0)   errors.push(setError("width",           "Board width is required and must be a valid measure > 0."));
  if (!Number.isFinite(numBoards) || numBoards <= 0)   errors.push(setError("numberOfBoards",  "Boards per bundle must be a whole number > 0."));
  if (!Number.isFinite(numBundles)|| numBundles <= 0)  errors.push(setError("bundlesPerPallet","Bundles per pallet must be a whole number > 0."));

  if (errors.length) {
    resultEl.style.display = "block";
    resultEl.innerHTML = `<div class="error-msg" role="alert">${errors.join("<br>")}</div>`;
    return;
  }

  const lengthUnit = document.getElementById("lengthUnit").value;
  const widthUnit  = document.getElementById("widthUnit").value;

  const lengthFt = lengthUnit === "inches" ? lengthRaw / 12 : lengthRaw;
  const widthFt  = widthUnit  === "inches" ? widthRaw  / 12 : widthRaw;

  const sqftPerBoard  = lengthFt * widthFt;
  const sqftPerBundle = sqftPerBoard * numBoards;
  const sqftPerPallet = sqftPerBundle * numBundles;

  if (!Number.isFinite(sqftPerPallet) || sqftPerPallet <= 0) {
    resultEl.style.display = "block";
    resultEl.innerHTML = `<div class="error-msg" role="alert">Calculation resulted in an invalid value. Please check your inputs.</div>`;
    return;
  }

  palletHistory.push({ label: `Pallet ${palletHistory.length + 1}`, value: sqftPerPallet });
  renderHistory();
  
  resultEl.style.display = "block";
  resultEl.innerHTML = `
    <div class="result-box">
      <div class="result-row">
        <span class="result-label">Total — Pallet</span>
        <span class="result-value big">${fmt(sqftPerPallet)} ft²</span>
      </div>
      <div class="result-row">
        <span class="result-label">Per Bundle</span>
        <span class="result-value">${fmt(sqftPerBundle)} ft²</span>
      </div>
      <div class="result-row">
        <span class="result-label">Per Board</span>
        <span class="result-value">${fmt(sqftPerBoard)} ft²</span>
      </div>
    </div>
  `;
}


function renderHistory() {
  const historyEl = document.getElementById("history");
  if (palletHistory.length === 0) {
    historyEl.innerHTML = "";
    return;
  }
  const total = palletHistory.reduce((sum, item) => sum + item.value, 0);
  const items = palletHistory.map((item) => `
    <div class="history-item">
      <span class="history-item-label">${sanitize(item.label)}</span>
      <span>${fmt(item.value)} ft²</span>
    </div>
  `).join("");

  historyEl.innerHTML = `
    <div class="history-box">
      <div class="history-title">History</div>
      ${items}
      <div class="history-total">
        <span class="history-total-label">Grand Total</span>
        <span class="history-total-value">${fmt(total)} ft²</span>
      </div>
    </div>
  `;
}

function clearHistory() {
  palletHistory = [];
  renderHistory();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("calcBtn").addEventListener("click", calculate);
  document.getElementById("resetBtn").addEventListener("click", reset);
  document.getElementById("clearBtn").addEventListener("click", clearHistory);
});