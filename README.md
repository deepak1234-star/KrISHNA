# SSC CGL DEST Typing Practice System

A fully functional, distraction-free SSC CGL DEST (Data Entry Speed Test) typing practice platform built with React, Vite, CSS, and IndexedDB.

## Features

- **Minimalist Homepage**: Clean, professional, distraction-free interface with a single prominent "START TEST" button.
- **Accurate Typing Engine**:
  - Exact 15:00 countdown timer with timestamp-based deadline checking to eliminate clock drift.
  - Character-by-character live comparison (Green for correct, Red for incorrect, Untyped for remaining text).
  - Reliable Backspace support for corrections.
  - Live Total Key Depressions counter and Progress percentage indicator.
  - Smooth auto-scrolling reference passage keeping the current typing line visually centered.
  - Pasting and browser shortcut interference prevention.
  - Early test submission with confirmation modal.
- **Minimal Result Page**:
  - Displays **only** the 3 required metrics:
    1. Typing Speed (WPM)
    2. Total Key Depressions
    3. Typing Error Percentage
  - Direct "START NEXT TEST" action.
- **Silent Background Mistake Tracking**:
  - Silently captures granular data for every mistake: expected character, typed character, position, previous character, next character, surrounding word, confusion pairs, and bigrams/trigrams.
  - Aggregates cumulative statistics across all past tests.
- **Adaptive Passage Generator**:
  - 100% local JavaScript engine — zero external AI APIs or paid keys required.
  - Uses cumulative historical mistakes to adapt future passages by naturally incorporating higher densities of difficult patterns (e.g., specific letter pairs, bigrams like `th`, `er`, or trigrams like `ing`).
  - Coherent administrative, economic, constitutional, and governance themes.
  - FNV-1a passage fingerprinting to prevent repeating previously generated passages.
- **Persistent Storage**:
  - Fully persistent in browser's IndexedDB (`SSCDestDB`).
  - Cumulative across tests and survives page reloads, browser closures, and system restarts.

---

## Calculations & Formulas

1. **Typing Speed (WPM)**:
   $$\text{WPM} = \frac{\text{Correct Characters} / 5}{\text{Actual Duration in Minutes}}$$
   Calculated using standard 5-character word convention and exact elapsed time.

2. **Total Key Depressions**:
   Counts all valid typing keystrokes (printable characters, spaces, punctuation, and backspace corrections). Navigation keys (Arrows, Home, End, PageUp, PageDown) and modifier keys (Shift, Ctrl, Alt, Meta, CapsLock, Tab) are strictly excluded when pressed alone.

3. **Typing Error Percentage**:
   $$\text{Error } \% = \left(\frac{\text{Total Incorrect Character Attempts}}{\text{Total Character Attempts}}\right) \times 100$$

---

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Development
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Run all automated tests (unit + integration)
npm test

# Build for production
npm run build
```

Development server runs by default at `http://localhost:3000/`.
