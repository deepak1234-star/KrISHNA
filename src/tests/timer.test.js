import { describe, it, expect, vi } from 'vitest';
import { TestTimer } from '../engine/timer.js';
import { formatTime } from '../engine/calculations.js';

describe('15-Minute Countdown TestTimer', () => {
  it('displays 15:00 initially, 14:59 after one second, and 14:00 after one minute', () => {
    let simulatedTime = 10000000;
    const mockClock = () => simulatedTime;

    let latestRemaining = null;
    let latestElapsed = null;

    const timer = new TestTimer({
      durationSeconds: 900,
      clock: mockClock,
      onTick: (rem, elap) => {
        latestRemaining = rem;
        latestElapsed = elap;
      }
    });

    // 1. Initial start: must display 15:00 immediately
    timer.start();
    expect(latestRemaining).toBe(900);
    expect(latestElapsed).toBe(0);
    expect(formatTime(latestRemaining)).toBe('15:00');

    // 2. Advance by exactly 1 second (1000ms) -> 14:59
    simulatedTime += 1000;
    timer.evaluate();
    expect(latestRemaining).toBe(899);
    expect(latestElapsed).toBe(1);
    expect(formatTime(latestRemaining)).toBe('14:59');

    // 3. Advance by another second (total 2s) -> 14:58
    simulatedTime += 1000;
    timer.evaluate();
    expect(latestRemaining).toBe(898);
    expect(latestElapsed).toBe(2);
    expect(formatTime(latestRemaining)).toBe('14:58');

    // 4. Advance to 1 minute total (60,000ms from start) -> 14:00
    simulatedTime = 10000000 + 60 * 1000;
    timer.evaluate();
    expect(latestRemaining).toBe(840);
    expect(latestElapsed).toBe(60);
    expect(formatTime(latestRemaining)).toBe('14:00');

    timer.stop();
  });

  it('automatically triggers test completion at 00:00 exactly once', () => {
    let simulatedTime = 50000000;
    const mockClock = () => simulatedTime;

    let expireCallCount = 0;
    let latestRemaining = null;

    const timer = new TestTimer({
      durationSeconds: 900,
      clock: mockClock,
      onTick: (rem) => {
        latestRemaining = rem;
      },
      onExpire: () => {
        expireCallCount++;
      }
    });

    timer.start();
    expect(expireCallCount).toBe(0);

    // Advance to 14m 59s
    simulatedTime += 899 * 1000;
    timer.evaluate();
    expect(latestRemaining).toBe(1);
    expect(formatTime(latestRemaining)).toBe('00:01');
    expect(expireCallCount).toBe(0);

    // Advance 1 more second to reach 15m (900s) -> 00:00
    simulatedTime += 1000;
    timer.evaluate();
    expect(latestRemaining).toBe(0);
    expect(formatTime(latestRemaining)).toBe('00:00');
    expect(expireCallCount).toBe(1);
    expect(timer.isRunning).toBe(false);

    // Extra evaluations must NOT trigger duplicate completions
    simulatedTime += 5000;
    timer.evaluate();
    expect(expireCallCount).toBe(1);
  });

  it('manual early finish stops the countdown immediately with no duplicate completions', () => {
    let simulatedTime = 30000000;
    const mockClock = () => simulatedTime;

    let expireCalled = false;
    let tickCount = 0;

    const timer = new TestTimer({
      durationSeconds: 900,
      clock: mockClock,
      onTick: () => {
        tickCount++;
      },
      onExpire: () => {
        expireCalled = true;
      }
    });

    timer.start();
    expect(tickCount).toBe(1); // initial tick

    // User finishes early at 3 minutes
    simulatedTime += 180 * 1000;
    timer.evaluate();
    expect(tickCount).toBe(2);

    // Candidate clicks FINISH TEST
    timer.stop();
    expect(timer.isRunning).toBe(false);

    // Time advances past deadline
    simulatedTime += 1000 * 1000;
    timer.evaluate();

    // Timer stopped: no more ticks and no expire callback
    expect(tickCount).toBe(2);
    expect(expireCalled).toBe(false);
  });

  it('handles tab visibility change immediately', () => {
    let simulatedTime = 40000000;
    const mockClock = () => simulatedTime;

    let latestRemaining = null;

    const timer = new TestTimer({
      durationSeconds: 900,
      clock: mockClock,
      onTick: (rem) => {
        latestRemaining = rem;
      }
    });

    timer.start();
    expect(latestRemaining).toBe(900);

    // Simulate tab being inactive for 30 seconds
    simulatedTime += 30 * 1000;

    // Visibility change event fires when user focuses tab
    timer.handleVisibilityChange();
    expect(latestRemaining).toBe(870);
    expect(formatTime(latestRemaining)).toBe('14:30');

    timer.stop();
  });
});
