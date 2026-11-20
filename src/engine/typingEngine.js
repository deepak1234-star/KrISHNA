import { isTypingKey, calculateWPM, calculateErrorPercentage } from './calculations.js';
import { createMistakeRecord } from './mistakeTracker.js';

/**
 * SSC CGL DEST Typing Engine
 * Manages character-by-character typing state, live comparison,
 * key depression counts, backspaces, and mistake tracking.
 */
export class TypingEngine {
  /**
   * @param {object} options
   * @param {string} options.passage - Reference text
   * @param {string} [options.testId] - Unique test ID
   */
  constructor({ passage = '', testId = null } = {}) {
    this.passage = passage;
    this.testId = testId || `test_${Date.now()}`;
    this.typed = '';
    this.mistakes = [];
    this.totalKeyDepressions = 0;
    this.totalCharacterAttempts = 0;
  }

  /**
   * Processes a keydown event.
   * @param {KeyboardEvent|object} event
   * @returns {{ handled: boolean, completed: boolean }}
   */
  handleKeyDown(event) {
    if (!isTypingKey(event)) {
      return { handled: false, completed: false };
    }

    if (event.key === 'Backspace') {
      this.totalKeyDepressions++;
      if (this.typed.length > 0) {
        this.typed = this.typed.slice(0, -1);
      }
      return { handled: true, completed: false };
    }

    if (event.key === 'Enter') {
      const position = this.typed.length;
      if (position >= this.passage.length) {
        return { handled: true, completed: true };
      }

      this.totalKeyDepressions++;
      this.totalCharacterAttempts++;

      const expectedChar = this.passage[position];
      const typedChar = expectedChar === '\n' ? '\n' : ' ';

      if (typedChar !== expectedChar) {
        const mistakeRecord = createMistakeRecord({
          passage: this.passage,
          position,
          typedChar,
          testId: this.testId
        });
        this.mistakes.push(mistakeRecord);
      }

      this.typed += typedChar;
      const isCompleted = this.typed.length >= this.passage.length;
      return { handled: true, completed: isCompleted };
    }

    if (event.key.length === 1) {
      const position = this.typed.length;

      // Cannot type beyond passage length
      if (position >= this.passage.length) {
        return { handled: true, completed: true };
      }

      this.totalKeyDepressions++;
      this.totalCharacterAttempts++;

      const typedChar = event.key;
      const expectedChar = this.passage[position];

      if (typedChar !== expectedChar) {
        const mistakeRecord = createMistakeRecord({
          passage: this.passage,
          position,
          typedChar,
          testId: this.testId
        });
        this.mistakes.push(mistakeRecord);
      }

      this.typed += typedChar;
      const isCompleted = this.typed.length >= this.passage.length;

      return { handled: true, completed: isCompleted };
    }

    return { handled: false, completed: false };
  }

  /**
   * Gets character status at a specific passage index.
   * @param {number} index
   * @returns {'correct'|'incorrect'|'current'|'untyped'}
   */
  getCharacterStatus(index) {
    if (index < this.typed.length) {
      return this.typed[index] === this.passage[index] ? 'correct' : 'incorrect';
    }
    if (index === this.typed.length) {
      return 'current';
    }
    return 'untyped';
  }

  /**
   * Computes correct character count.
   * @returns {number}
   */
  getCorrectCharactersCount() {
    let count = 0;
    const len = this.typed.length;
    for (let i = 0; i < len; i++) {
      if (this.typed[i] === this.passage[i]) {
        count++;
      }
    }
    return count;
  }

  /**
   * Returns current live performance metrics.
   * @param {number} elapsedSeconds 
   * @returns {{
   *   wpm: number,
   *   totalKeyDepressions: number,
   *   errorPercentage: number,
   *   correctCharacters: number,
   *   progressPercentage: number,
   *   typedLength: number,
   *   totalLength: number
   * }}
   */
  getMetrics(elapsedSeconds = 0) {
    const correctCharacters = this.getCorrectCharactersCount();
    const wpm = calculateWPM(correctCharacters, elapsedSeconds);
    const errorPercentage = calculateErrorPercentage(this.mistakes.length, this.totalCharacterAttempts);
    const progressPercentage = this.passage.length > 0
      ? Number(((this.typed.length / this.passage.length) * 100).toFixed(1))
      : 0;

    return {
      wpm,
      totalKeyDepressions: this.totalKeyDepressions,
      errorPercentage,
      correctCharacters,
      progressPercentage,
      typedLength: this.typed.length,
      totalLength: this.passage.length
    };
  }
}
