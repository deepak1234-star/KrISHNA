import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import App from '../App.jsx';

describe('App End-to-End User Flow Integration', () => {
  it('navigates seamlessly: Home -> Typing Test -> Keystrokes -> Result Page -> Next Test', async () => {
    render(<App />);

    // 1. Verify Home Page
    expect(screen.getByText('Select Test Duration')).toBeDefined();
    expect(screen.getByRole('button', { name: /^5 Minutes$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^10 Minutes$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^15 Minutes$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^30 Minutes$/i })).toBeDefined();

    const startBtn = screen.getByRole('button', { name: /START 15-MINUTE TEST/i });
    expect(startBtn).toBeDefined();
    expect(screen.getByText('SSC CGL DEST Typing Practice')).toBeDefined();
    expect(screen.queryByRole('navigation')).toBeNull(); // No navigation menu
    expect(document.querySelector('.ad-banner')).toBeNull(); // No ads

    // 2. Click START TEST
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // 3. Verify Typing Test Screen renders asynchronously
    const examHeader = await screen.findByText(/Staff Selection Commission - DEST/i);
    expect(examHeader).toBeDefined();
    expect(screen.getByText('Ready — 15 Mins (Starts on First Keypress)')).toBeDefined();
    expect(screen.getByText('15:00')).toBeDefined(); // Timer starts at 15:00
    expect(screen.getByText('Total Key Depressions')).toBeDefined();
    // Typing Progress card must be REMOVED as requested
    expect(screen.queryByText('Typing Progress')).toBeNull();

    // Reference passage is rendered and has AT LEAST 4,000 characters
    const passageBox = document.querySelector('.passage-display-box');
    expect(passageBox).toBeDefined();
    const chars = passageBox.querySelectorAll('.char');
    expect(chars.length).toBeGreaterThanOrEqual(4000);

    // Initial character status
    expect(chars[0].className).toContain('char-current');
    expect(chars[1].className).toContain('char-untyped');

    // Dedicated typing textarea
    const typingInput = document.querySelector('.typing-input');
    expect(typingInput).toBeDefined();

    // 4. Test Keystroke Handling
    const expectedFirstChar = chars[0].textContent;
    // Type correct first character
    await act(async () => {
      fireEvent.keyDown(typingInput, { key: expectedFirstChar });
    });

    expect(chars[0].className).toContain('char-correct');
    expect(chars[1].className).toContain('char-current');
    expect(screen.getByText('Test in Progress (15 Min)')).toBeDefined();

    // Type an intentionally incorrect character for the second position
    const wrongChar = chars[1].textContent === 'z' ? 'y' : 'z';
    await act(async () => {
      fireEvent.keyDown(typingInput, { key: wrongChar });
    });

    expect(chars[1].className).toContain('char-incorrect');
    expect(chars[2].className).toContain('char-current');

    // Test Backspace
    await act(async () => {
      fireEvent.keyDown(typingInput, { key: 'Backspace' });
    });

    // Position 1 should now be current again, ready for correct typing
    expect(chars[1].className).toContain('char-current');
    expect(chars[2].className).toContain('char-untyped');

    // 5. Test Pasting is prevented
    let pasteDefaultPrevented = false;
    await act(async () => {
      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      typingInput.dispatchEvent(pasteEvent);
      pasteDefaultPrevented = pasteEvent.defaultPrevented;
    });
    expect(pasteDefaultPrevented).toBe(true);

    // 6. Test Early Finish
    const finishBtn = screen.getByRole('button', { name: /FINISH TEST/i });
    await act(async () => {
      fireEvent.click(finishBtn);
    });

    // Confirmation Modal should appear
    expect(screen.getByText(/Submit Typing Test\?/i)).toBeDefined();
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Submit/i });

    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // 7. Verify Result Page
    const resultsHeader = await screen.findByText('Test Results');
    expect(resultsHeader).toBeDefined();
    expect(screen.getByText('Typing Speed (WPM)')).toBeDefined();
    expect(screen.getByText('Total Key Depressions')).toBeDefined();
    expect(screen.getByText('Error Percentage')).toBeDefined();
    expect(screen.getByText('Accuracy Percentage')).toBeDefined();
    expect(screen.getByText('Incorrect Key Breakdown')).toBeDefined();

    // Ensure NO unnecessary statistics, charts, or recommendations are displayed
    expect(screen.queryByText(/Mistakes List/i)).toBeNull();
    expect(screen.queryByText(/Accuracy Breakdown/i)).toBeNull();
    expect(screen.queryByText(/Suggestions/i)).toBeNull();
    expect(document.querySelector('canvas')).toBeNull(); // No charts
    expect(document.querySelector('svg.chart')).toBeNull();

    // 8. Test START NEXT TEST button
    const nextTestBtn = screen.getByRole('button', { name: /START NEXT TEST/i });
    expect(nextTestBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(nextTestBtn);
    });

    // Should return to Typing Test Screen with fresh test
    const nextExamHeader = await screen.findByText(/Staff Selection Commission - DEST/i);
    expect(nextExamHeader).toBeDefined();
    expect(screen.getByText('15:00')).toBeDefined();
  });

  it('allows candidate to select 5, 10, 15, or 30 minutes duration', async () => {
    render(<App />);

    const fiveMinBtn = screen.getByRole('button', { name: /^5 Minutes$/i });
    const tenMinBtn = screen.getByRole('button', { name: /^10 Minutes$/i });
    const thirtyMinBtn = screen.getByRole('button', { name: /^30 Minutes$/i });

    // Click 5 Minutes
    await act(async () => {
      fireEvent.click(fiveMinBtn);
    });
    expect(screen.getByRole('button', { name: /START 5-MINUTE TEST/i })).toBeDefined();

    // Click 30 Minutes
    await act(async () => {
      fireEvent.click(thirtyMinBtn);
    });
    expect(screen.getByRole('button', { name: /START 30-MINUTE TEST/i })).toBeDefined();

    // Click 10 Minutes
    await act(async () => {
      fireEvent.click(tenMinBtn);
    });
    const start10Btn = screen.getByRole('button', { name: /START 10-MINUTE TEST/i });
    expect(start10Btn).toBeDefined();

    // Start 10-minute test
    await act(async () => {
      fireEvent.click(start10Btn);
    });

    // Check timer and badge
    expect(await screen.findByText('10:00')).toBeDefined();
    expect(screen.getByText('Ready — 10 Mins (Starts on First Keypress)')).toBeDefined();
  });
});
