/**
 * SSC CGL DEST Calculation Formulas
 * 
 * 1. Typing Speed (WPM):
 *    Calculated using standard 5-character word convention:
 *    Words = Correctly Typed Characters / 5
 *    Time in minutes = Elapsed Seconds / 60
 *    WPM = Words / Time in minutes
 * 
 * 2. Total Key Depressions:
 *    Total valid typing keypresses made by the user, including incorrect
 *    character typing attempts and backspaces, excluding non-typing control keys
 *    (e.g., Shift, Control, Alt, Meta, CapsLock, Tab, Arrow keys, Function keys).
 * 
 * 3. Typing Error Percentage:
 *    Percentage of incorrect character attempts relative to total character attempts.
 *    Error % = (Mistake Count / Total Character Attempts) * 100
 */

/**
 * Calculates typing speed in Words Per Minute (WPM).
 * @param {number} correctCharacters - Number of successfully typed characters matching reference passage
 * @param {number} elapsedSeconds - Actual test duration elapsed in seconds
 * @returns {number} Speed in WPM (rounded to 2 decimal places)
 */
export function calculateWPM(correctCharacters, elapsedSeconds) {
  if (!elapsedSeconds || elapsedSeconds <= 0 || !correctCharacters || correctCharacters <= 0) {
    return 0;
  }
  const elapsedMinutes = elapsedSeconds / 60;
  const words = correctCharacters / 5;
  const wpm = words / elapsedMinutes;
  return Number(wpm.toFixed(2));
}

/**
 * Calculates typing error percentage.
 * @param {number} mistakeCount - Total incorrect character attempts
 * @param {number} totalAttempts - Total character attempts made
 * @returns {number} Error percentage (rounded to 2 decimal places)
 */
export function calculateErrorPercentage(mistakeCount, totalAttempts) {
  if (!totalAttempts || totalAttempts <= 0 || !mistakeCount || mistakeCount <= 0) {
    return 0;
  }
  const percentage = (mistakeCount / totalAttempts) * 100;
  return Number(percentage.toFixed(2));
}

/**
 * Checks if a keyboard event represents a valid typing key depression.
 * Filters out navigation, modifier, and functional control keys.
 * @param {KeyboardEvent|object} event - Keyboard event
 * @returns {boolean} True if the key press counts as a key depression
 */
export function isTypingKey(event) {
  if (!event || !event.key) return false;

  // Ignore keyboard shortcuts with Control, Meta (Cmd/Win), or Alt
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  // Backspace counts as an active typing correction keystroke
  if (event.key === 'Backspace') {
    return true;
  }

  // Enter key
  if (event.key === 'Enter') {
    return true;
  }

  // Single printable characters (letters, numbers, space, punctuation)
  if (event.key.length === 1) {
    return true;
  }

  // All other keys (Shift, CapsLock, Tab, Escape, Arrows, Function keys, etc.) are excluded
  return false;
}

/**
 * Formats seconds into MM:SS display format.
 * @param {number} seconds 
 * @returns {string} Formatted string "MM:SS"
 */
export function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  const formattedMins = String(mins).padStart(2, '0');
  const formattedSecs = String(secs).padStart(2, '0');
  return `${formattedMins}:${formattedSecs}`;
}
