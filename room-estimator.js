let rooms = [];
let nextId = 0;

function addRoom() {
  const nameInput = document.getElementById("roomName");
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.classList.add("error");
    return;
  }
  nameInput.classList.remove("error");
  nameInput.value = "";

  rooms.push({ id: ++nextId, name: name, sections: [] });
  renderRooms();
  nameInput.focus();
}

function addSection(roomId) {
  const room = rooms.find(r => r.id === roomId);
  if (room) {
    room.sections.push({ id: ++nextId, length: "", width: "" });
    renderRooms();
  }
}

function removeSection(roomId, sectionId) {
  const room = rooms.find(r => r.id === roomId);
  if (room) {
    room.sections = room.sections.filter(s => s.id !== sectionId);
    renderRooms();
  }
}

function removeRoom(roomId) {
  rooms = rooms.filter(r => r.id !== roomId);
  renderRooms();
}

function updateSection(roomId, sectionId, field, inputEl) {
  if (field !== "length" && field !== "width") return;

  const room = rooms.find(r => r.id === roomId);
  if (!room) return;
  const section = room.sections.find(s => s.id === sectionId);
  if (!section) return;

  const raw = inputEl.value;
  const invalid = inputEl.validity.badInput ||
    (raw.trim() !== "" && isNaN(parsePositiveDecimal(raw)));

  // Invalid values are never stored, so they can't affect any total
  section[field] = invalid ? "" : raw;
  inputEl.classList.toggle("error", invalid);
  inputEl.setAttribute("aria-invalid", invalid ? "true" : "false");

  // Update only the affected text nodes; inputs stay in the DOM and keep focus
  updateTotals(room, section);
}

function updateTotals(room, section) {
  const sectionEl = document.getElementById(`section-result-${section.id}`);
  if (sectionEl) sectionEl.textContent = formatArea(getSectionArea(section));

  const roomEl = document.getElementById(`room-total-${room.id}`);
  if (roomEl) roomEl.textContent = formatArea(getRoomTotal(room));

  renderGrandTotal();
}

// Accepts only positive decimals: "12", "12.5", ".5", "5."
// Rejects negatives, exponents (1e3), Infinity and any other text
function parsePositiveDecimal(value) {
  const v = String(value).trim();
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(v)) return NaN;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
}

function blockInvalidKeys(event) {
  if (["-", "+", "e", "E"].includes(event.key)) event.preventDefault();
}

function toInputValue(value) {
  const n = parsePositiveDecimal(value);
  return isNaN(n) ? "" : String(n);
}

function getSectionArea(section) {
  const l = parsePositiveDecimal(section.length);
  const w = parsePositiveDecimal(section.width);
  return (l > 0 && w > 0) ? l * w : 0;
}

function getRoomTotal(room) {
  return room.sections.reduce((sum, s) => sum + getSectionArea(s), 0);
}

function formatArea(n) {
  return n > 0 ? fmt(n) + " ft²" : "";
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

function renderRooms() {
  const listEl = document.getElementById("roomList");
  const totalEl = document.getElementById("grandTotal");

  if (rooms.length === 0) {
    listEl.innerHTML = "";
    totalEl.innerHTML = "";
    return;
  }

  listEl.innerHTML = rooms.map(room => {
    const roomTotal = getRoomTotal(room);
    const sections = room.sections.map((s, i) => {
      return `
        <div class="section-row">
          <span class="section-label">${String.fromCharCode(65 + i)}</span>
          <input type="number" placeholder="Length" value="${toInputValue(s.length)}"
            min="0" step="any" inputmode="decimal"
            data-room-id="${room.id}" data-section-id="${s.id}" data-field="length">
          <span class="section-x">×</span>
          <input type="number" placeholder="Width" value="${toInputValue(s.width)}"
            min="0" step="any" inputmode="decimal"
            data-room-id="${room.id}" data-section-id="${s.id}" data-field="width">
          <span class="section-result" id="section-result-${s.id}">${formatArea(getSectionArea(s))}</span>
          <button type="button" class="remove-btn" data-action="remove-section" data-room-id="${room.id}" data-section-id="${s.id}">✕</button>
        </div>
      `;
    }).join("");

    return `
      <div class="room-block">
        <div class="room-block-header">
          <span class="room-block-name">${sanitize(room.name)}</span>
          <span class="room-block-total" id="room-total-${room.id}">${formatArea(roomTotal)}</span>
          <button type="button" class="remove-btn" data-action="remove-room" data-room-id="${room.id}">✕</button>
        </div>
        <div class="room-block-body">
          ${sections}
          <button type="button" class="add-section-btn" data-action="add-section" data-room-id="${room.id}">+ Add Section</button>
        </div>
      </div>
    `;
  }).join("");

  renderGrandTotal();
}

function renderGrandTotal() {
  const totalEl = document.getElementById("grandTotal");
  const grandTotal = rooms.reduce((sum, r) => sum + getRoomTotal(r), 0);
  totalEl.innerHTML = grandTotal > 0 ? `
    <div class="grand-total-box">
      <span class="grand-total-label">Grand Total</span>
      <span class="grand-total-value">${fmt(grandTotal)} ft²</span>
    </div>
  ` : "";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addRoomBtn").addEventListener("click", addRoom);

  const listEl = document.getElementById("roomList");

  listEl.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const roomId = Number(btn.dataset.roomId);
    if (action === "add-section") {
      addSection(roomId);
    } else if (action === "remove-room") {
      removeRoom(roomId);
    } else if (action === "remove-section") {
      const sectionId = Number(btn.dataset.sectionId);
      removeSection(roomId, sectionId);
    }
  });

  listEl.addEventListener("keydown", (event) => {
    if (event.target.matches("input[data-field]")) {
      blockInvalidKeys(event);
    }
  });

  listEl.addEventListener("input", (event) => {
    const inputEl = event.target;
    if (!inputEl.matches("input[data-field]")) return;
    const roomId = Number(inputEl.dataset.roomId);
    const sectionId = Number(inputEl.dataset.sectionId);
    const field = inputEl.dataset.field;
    updateSection(roomId, sectionId, field, inputEl);
  });
});