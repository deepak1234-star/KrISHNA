import { describe, it, expect } from 'vitest';
import {
  calculateWPM,
  calculateErrorPercentage,
  isTypingKey,
  formatTime
} from '../engine/calculations.js';

describe('Calculations Module', () => {
  describe('calculateWPM', () => {
    it('calculates WPM accurately with standard 5-character word convention', () => {
      // Example: 2000 correct characters in 15 minutes (900 seconds)
      // Words = 2000 / 5 = 400 words
      // Duration = 15 minutes
      // WPM = 400 / 15 = 26.67 WPM
      const wpm = calculateWPM(2000, 900);
      expect(wpm).toBe(26.67);
    });

    it('calculates WPM accurately for early completion (e.g. 5 minutes)', () => {
      // 1500 correct characters in 300 seconds (5 minutes)
      // Words = 1500 / 5 = 300 words
      // WPM = 300 / 5 = 60 WPM
      const wpm = calculateWPM(1500, 300);
      expect(wpm).toBe(60);
    });

    it('returns 0 when elapsed time or correct characters are zero or negative', () => {
      expect(calculateWPM(0, 900)).toBe(0);
      expect(calculateWPM(500, 0)).toBe(0);
      expect(calculateWPM(-10, 100)).toBe(0);
      expect(calculateWPM(100, -5)).toBe(0);
    });
  });

  describe('calculateErrorPercentage', () => {
    it('calculates percentage of incorrect attempts relative to total attempts', () => {
      // 20 mistakes out of 1000 total attempts = 2%
      expect(calculateErrorPercentage(20, 1000)).toBe(2);
      // 25 mistakes out of 500 attempts = 5%
      expect(calculateErrorPercentage(25, 500)).toBe(5);
      // 7 mistakes out of 231 attempts = 3.03%
      expect(calculateErrorPercentage(7, 231)).toBe(3.03);
    });

    it('handles zero attempts or zero mistakes safely', () => {
      expect(calculateErrorPercentage(0, 500)).toBe(0);
      expect(calculateErrorPercentage(5, 0)).toBe(0);
      expect(calculateErrorPercentage(0, 0)).toBe(0);
    });
  });

  describe('isTypingKey', () => {
    it('accepts regular printable alphanumeric characters, spaces, and punctuation', () => {
      expect(isTypingKey({ key: 'a' })).toBe(true);
      expect(isTypingKey({ key: 'Z' })).toBe(true);
      expect(isTypingKey({ key: '5' })).toBe(true);
      expect(isTypingKey({ key: ' ' })).toBe(true);
      expect(isTypingKey({ key: '.' })).toBe(true);
      expect(isTypingKey({ key: ',' })).toBe(true);
      expect(isTypingKey({ key: '-' })).toBe(true);
    });

    it('accepts Backspace as an active correction key depression', () => {
      expect(isTypingKey({ key: 'Backspace' })).toBe(true);
    });

    it('rejects modifier keys and control navigation keys', () => {
      expect(isTypingKey({ key: 'Shift' })).toBe(false);
      expect(isTypingKey({ key: 'Control' })).toBe(false);
      expect(isTypingKey({ key: 'Alt' })).toBe(false);
      expect(isTypingKey({ key: 'Meta' })).toBe(false);
      expect(isTypingKey({ key: 'CapsLock' })).toBe(false);
      expect(isTypingKey({ key: 'Tab' })).toBe(false);
      expect(isTypingKey({ key: 'ArrowLeft' })).toBe(false);
      expect(isTypingKey({ key: 'ArrowRight' })).toBe(false);
      expect(isTypingKey({ key: 'Escape' })).toBe(false);
    });

    it('rejects key events combined with Ctrl/Meta/Alt modifiers', () => {
      expect(isTypingKey({ key: 'c', ctrlKey: true })).toBe(false);
      expect(isTypingKey({ key: 'v', ctrlKey: true })).toBe(false);
      expect(isTypingKey({ key: 'a', metaKey: true })).toBe(false);
    });
  });

  describe('formatTime', () => {
    it('formats remaining seconds to MM:SS correctly', () => {
      expect(formatTime(900)).toBe('15:00');
      expect(formatTime(899)).toBe('14:59');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(9)).toBe('00:09');
      expect(formatTime(0)).toBe('00:00');
    });
  });
});
