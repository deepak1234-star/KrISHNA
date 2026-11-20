/**
 * Timestamp-based Test Timer
 * Uses system clock deadlines to avoid setInterval drift.
 * Supports controllable clock injection for automated verification.
 */
export class TestTimer {
  /**
   * @param {object} options
   * @param {number} [options.durationSeconds=900] - Duration in seconds (default 15 minutes)
   * @param {function} [options.onTick] - Called on timer updates with (remainingSeconds, elapsedSeconds)
   * @param {function} [options.onExpire] - Called when deadline is reached
   * @param {function} [options.clock] - Function returning current timestamp in ms (defaults to Date.now)
   * @param {number} [options.tickIntervalMs=100] - Interval between tick evaluations
   */
  constructor({
    durationSeconds = 900,
    onTick = null,
    onExpire = null,
    clock = Date.now,
    tickIntervalMs = 100
  } = {}) {
    this.durationSeconds = durationSeconds;
    this.durationMs = durationSeconds * 1000;
    this.onTick = onTick;
    this.onExpire = onExpire;
    this.clock = clock;
    this.tickIntervalMs = tickIntervalMs;

    this.startTime = null;
    this.deadline = null;
    this.intervalId = null;
    this.isRunning = false;
    this.isExpired = false;
    this.elapsedSeconds = 0;
  }

  start() {
    if (this.isRunning) return;

    this.startTime = this.clock();
    this.deadline = this.startTime + this.durationMs;
    this.isRunning = true;
    this.isExpired = false;

    // Trigger initial tick
    this.evaluate();

    // Start tick interval
    this.intervalId = setInterval(() => {
      this.evaluate();
    }, this.tickIntervalMs);
  }

  evaluate() {
    if (!this.isRunning) return;

    const now = this.clock();
    const remainingMs = Math.max(0, this.deadline - now);
    const elapsedMs = Math.max(0, now - this.startTime);

    this.elapsedSeconds = Math.min(this.durationSeconds, Math.floor(elapsedMs / 1000));
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

    if (this.onTick) {
      this.onTick(remainingSeconds, this.elapsedSeconds);
    }

    if (remainingMs <= 0 && !this.isExpired) {
      this.isExpired = true;
      this.stop();
      if (this.onExpire) {
        this.onExpire();
      }
    }
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getElapsedSeconds() {
    if (!this.startTime) return 0;
    const now = this.clock();
    const elapsedMs = Math.max(0, now - this.startTime);
    return Math.min(this.durationSeconds, Math.floor(elapsedMs / 1000));
  }

  getRemainingSeconds() {
    if (!this.startTime || !this.deadline) return this.durationSeconds;
    const now = this.clock();
    const remainingMs = Math.max(0, this.deadline - now);
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }
}
