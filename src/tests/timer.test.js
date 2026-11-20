import { describe, it, expect, vi } from 'vitest';
import { TestTimer } from '../engine/timer.js';

describe('TestTimer with Controllable Clock', () => {
  it('starts at 15:00 (900 seconds) and tracks remaining seconds', () => {
    let simulatedTime = 1000000;
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

    timer.start();

    // Initial state
    expect(latestRemaining).toBe(900);
    expect(latestElapsed).toBe(0);

    // Advance 60 seconds (1 minute)
    simulatedTime += 60 * 1000;
    timer.evaluate();
    expect(latestRemaining).toBe(840);
    expect(latestElapsed).toBe(60);

    timer.stop();
  });

  it('expires after exactly 15 minutes (900 seconds) using deadline evaluation', () => {
    let simulatedTime = 2000000;
    const mockClock = () => simulatedTime;

    let expired = false;
    let latestRemaining = null;

    const timer = new TestTimer({
      durationSeconds: 900,
      clock: mockClock,
      onTick: (rem) => {
        latestRemaining = rem;
      },
      onExpire: () => {
        expired = true;
      }
    });

    timer.start();
    expect(expired).toBe(false);

    // Advance to 14 minutes and 59 seconds (899s)
    simulatedTime += 899 * 1000;
    timer.evaluate();
    expect(latestRemaining).toBe(1);
    expect(expired).toBe(false);

    // Advance 1 more second to reach 900s (exact 15:00 deadline)
    simulatedTime += 1000;
    timer.evaluate();
    expect(latestRemaining).toBe(0);
    expect(expired).toBe(true);
    expect(timer.isRunning).toBe(false);

    timer.stop();
  });
});
