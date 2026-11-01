# Wood Floor Suite

A free, open source collection of professional tools built for the wood flooring industry.

## Live Demo

🔗 [procodcj.github.io/wood-floor-suite](https://procodcj.github.io/wood-floor-suite)

## Tools

### 📦 Pallet Calculator
Calculate the square footage of wood flooring from pallet and bundle data.

| Field | Description |
|---|---|
| Bundle Length | Length of the boards in a bundle (ft or in) |
| Board Width | Width of each board (ft or in) |
| Boards per Bundle | How many boards are in one bundle |
| Bundles per Pallet | How many bundles make up the pallet |

**Output:** Total sq ft per pallet, per bundle, and per board.

- Accepts whole numbers, decimals, simple fractions (`3/4`), and mixed numbers with spaces or jobsite hyphens (e.g. `12 3/4`, `12-3/4`, `5-1/2`)
- Strict input validation that blocks zero denominators (e.g. `1/0`), non-integer board/bundle counts, and invalid values from entering the calculation or history
- Supports inches and feet for both length and width
- Calculation history with grand total across multiple pallets
- New Calculation and Clear History buttons

---

### 📐 Room Estimator
Measure rooms and calculate the total square footage of a flooring project.

- Add as many rooms as needed (Kitchen, Master Bedroom, Hallway, etc.)
- Each room supports multiple sections for irregular shaped spaces
- Continuous live calculation updates subtotals and totals in place without losing input focus
- Strict positive-number validation blocks negative measurements and invalid keys
- Integrated **Waste Factor** selector (`0%`, `5%`, `10%`, `15%` quick presets or custom percentage)
- Detailed breakdown showing **Net Total**, **Waste (+ft²)**, and **Total Suggested Order**

---

### 🪣 Stain Calculator
Calculate exact mix quantities for oil and water based wood stains using a parts-based formula.

**Oil Based Stain**
- 1 quart covers approximately 165 sq ft
- Supports any brand (optional) and text or numeric color identifiers (e.g. `Natural` or `200`)
- Purchase guide shows how many quarts to buy per color

**Water Based Stain**
- 1 gallon covers approximately 700 sq ft
- Purchase guide shows how many gallons to buy per color

**Mix Validation**
- Strict per-row validation ensures every active color entry has both a valid positive parts value and a color name/number before calculating, preventing unbalanced mix proportions

---

## Technical Specification

- **Stack:** Static HTML5, CSS3, and Vanilla JavaScript (ES6+) — zero external dependencies, frameworks, or build steps
- **Architecture:** Decoupled event handling via `addEventListener` and DOM event delegation (no inline event handlers), with targeted DOM updates for smooth performance
- **Security:** All user-supplied text is sanitized against XSS; all calculations run 100% client-side in the browser with no server, database, or data collection
- **Deployment:** Hosted directly on GitHub Pages

## Files

```
├── index.html              # Main menu
├── pallet-calculator.html  # Pallet Calculator
├── room-estimator.html     # Room Estimator
├── stain-calculator.html   # Stain Calculator
├── style.css               # Shared styles
├── home.css                # Home screen styles
├── room-estimator.css      # Room Estimator styles
├── stain-calculator.css    # Stain Calculator styles
├── app.js                  # Pallet Calculator logic
├── room-estimator.js       # Room Estimator logic
└── stain-calculator.js     # Stain Calculator logic
```

## License

MIT License — free to use, modify, and distribute with attribution.