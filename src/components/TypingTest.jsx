import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TypingEngine } from '../engine/typingEngine.js';
import { TestTimer } from '../engine/timer.js';
import {
  formatTime,
  isTypingKey,
  calculateAccuracyPercentage,
  extractIncorrectKeyBreakdown
} from '../engine/calculations.js';
import { saveCompletedTest } from '../storage/mistakeRepository.js';

const DEFAULT_DURATION_SECONDS = 900; // 15 Minutes fallback

export default function TypingTest({
  passageText,
  targetPatterns = [],
  durationMinutes = 15,
  onFinishTest
}) {
  const durationSeconds = (Number(durationMinutes) || 15) * 60;
  const [engine] = useState(() => new TypingEngine({ passage: passageText }));
  const [typedLength, setTypedLength] = useState(0);
  const [keyDepressions, setKeyDepressions] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const passageBoxRef = useRef(null);
  const activeCharRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const isFinishedRef = useRef(false);
  const hasStartedRef = useRef(false);
  const lastActiveLineTopRef = useRef(-1);

  // Starts the countdown timer on candidate's first typing action
  const startTimerIfNeeded = useCallback(() => {
    if (!hasStartedRef.current && !isFinishedRef.current) {
      hasStartedRef.current = true;
      setHasStarted(true);
      if (timerRef.current && !timerRef.current.isRunning) {
        timerRef.current.start();
      }
    }
  }, []);

  // Keep latest callbacks/data in refs to prevent timer re-creations
  const onFinishTestRef = useRef(onFinishTest);
  onFinishTestRef.current = onFinishTest;

  const targetPatternsRef = useRef(targetPatterns);
  targetPatternsRef.current = targetPatterns;

  // Complete and save test (guaranteed to execute at most once)
  const handleTestComplete = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsFinishing(true);

    if (timerRef.current) {
      timerRef.current.stop();
    }

    const finalElapsed = timerRef.current ? timerRef.current.getElapsedSeconds() : 0;
    // Ensure duration is non-zero (minimum 1 second for calculations if finished immediately)
    const validElapsed = Math.max(1, finalElapsed);
    const metrics = engine.getMetrics(validElapsed);
    const accuracyPercentage = calculateAccuracyPercentage(metrics.errorPercentage);
    const incorrectKeysBreakdown = extractIncorrectKeyBreakdown(engine.mistakes);

    const fullResults = {
      ...metrics,
      accuracyPercentage,
      incorrectKeysBreakdown
    };

    const testSummary = {
      id: engine.testId,
      timestamp: Date.now(),
      durationSeconds: validElapsed,
      keyDepressions: metrics.totalKeyDepressions,
      wpm: metrics.wpm,
      errorPercentage: metrics.errorPercentage,
      accuracyPercentage,
      correctCharacters: metrics.correctCharacters,
      totalMistakes: engine.mistakes.length,
      totalAttempts: engine.totalCharacterAttempts
    };

    // Immediately transition to Result Page
    if (onFinishTestRef.current) {
      onFinishTestRef.current(fullResults);
    }

    // Background silent save to IndexedDB without blocking UI
    saveCompletedTest({
      testSummary,
      mistakes: engine.mistakes,
      passageText: engine.passage,
      targetPatterns: targetPatternsRef.current
    }).catch((err) => {
      console.error('Failed to save test results to IndexedDB:', err);
    });
  }, [engine]);

  // Keep latest handleTestComplete in a ref so timer calls it without re-mounting
  const handleTestCompleteRef = useRef(handleTestComplete);
  handleTestCompleteRef.current = handleTestComplete;

  // Initialize timestamp-based timer EXACTLY ONCE on mount
  useEffect(() => {
    const timer = new TestTimer({
      durationSeconds,
      tickIntervalMs: 250,
      onTick: (rem, elap) => {
        setRemainingSeconds(rem);
        setElapsedSeconds(elap);
      },
      onExpire: () => {
        if (handleTestCompleteRef.current) {
          handleTestCompleteRef.current();
        }
      }
    });

    timerRef.current = timer;
    // Timer will be started as soon as candidate presses the first typing key!

    // Auto-focus typing input
    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => {
      timer.stop();
    };
  }, [durationSeconds]); // Fresh timer instance if durationSeconds changes

  // Auto-scroll reference passage stably when line changes
  useEffect(() => {
    if (!activeCharRef.current || !passageBoxRef.current) return;
    const activeEl = activeCharRef.current;
    const box = passageBoxRef.current;

    const charTop = activeEl.offsetTop;
    // If the active character is still on the same vertical line, do not touch scroll!
    if (lastActiveLineTopRef.current >= 0 && Math.abs(charTop - lastActiveLineTopRef.current) < 4) {
      return;
    }
    lastActiveLineTopRef.current = charTop;

    const boxHeight = box.clientHeight;
    const currentScroll = box.scrollTop;
    const relativePosition = charTop - currentScroll;

    // Only scroll if the new line falls into the lower half of the box
    if (relativePosition > boxHeight * 0.55) {
      box.scrollTop = Math.max(0, charTop - Math.floor(boxHeight * 0.25));
    } else if (relativePosition < 0) {
      box.scrollTop = Math.max(0, charTop - 10);
    }
  }, [typedLength]);

  // Window-level key capture: if user presses any key while outside textarea, auto-focus textarea
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (showConfirmModal || isFinishing || isFinishedRef.current) return;
      if (document.activeElement !== inputRef.current && inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showConfirmModal, isFinishing]);

  // Handle key input
  const handleKeyDown = (e) => {
    if (isFinishing || isFinishedRef.current) return;

    // Prevent navigation / selection shortcuts from disrupting test
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      return;
    }

    // Start timer on candidate's very first valid typing keypress
    if (isTypingKey(e)) {
      startTimerIfNeeded();
    }

    const { handled, completed } = engine.handleKeyDown(e);
    if (handled) {
      e.preventDefault();
      setTypedLength(engine.typed.length);
      setKeyDepressions(engine.totalKeyDepressions);

      if (completed) {
        handleTestComplete();
      }
    }
  };

  // Support mobile virtual / soft keyboards (which emit input/change events)
  const handleInputChange = (e) => {
    if (isFinishing || isFinishedRef.current) return;
    startTimerIfNeeded();
    const newVal = e.target.value;
    const currentLen = engine.typed.length;

    if (newVal.length > currentLen) {
      const added = newVal.slice(currentLen);
      for (const char of added) {
        const { completed } = engine.handleKeyDown({ key: char });
        if (completed) {
          handleTestComplete();
          break;
        }
      }
      setTypedLength(engine.typed.length);
      setKeyDepressions(engine.totalKeyDepressions);
    } else if (newVal.length < currentLen) {
      const diff = currentLen - newVal.length;
      for (let i = 0; i < diff; i++) {
        engine.handleKeyDown({ key: 'Backspace' });
      }
      setTypedLength(engine.typed.length);
      setKeyDepressions(engine.totalKeyDepressions);
    }
  };

  // Re-focus helper
  const handleContainerClick = () => {
    if (inputRef.current && !isFinishing) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="test-page" onClick={handleContainerClick}>
      {/* SSC CGL Exam Header */}
      <div className="exam-banner">
        <h1>Staff Selection Commission - DEST</h1>
        <span className="exam-badge">
          {hasStarted ? `Test in Progress (${durationMinutes} Min)` : `Ready — ${durationMinutes} Mins (Starts on First Keypress)`}
        </span>
      </div>

      {/* Top Metrics Section: Kept ONLY Time Remaining and Total Key Depressions */}
      <div className="metrics-bar">
        <div className="metric-card">
          <span className="metric-label">Time Remaining</span>
          <span className="metric-value metric-timer">
            {formatTime(remainingSeconds)}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Total Key Depressions</span>
          <span className="metric-value">
            {keyDepressions.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Reference Passage with Completely Stable Character Styling */}
      <div className="passage-section">
        <div className="section-label">Reference Passage</div>
        <div className="passage-display-box" ref={passageBoxRef}>
          {engine.passage.split('').map((char, index) => {
            const status = engine.getCharacterStatus(index);
            const isCurrent = status === 'current';
            const isSpace = char === ' ';

            let className = `char char-${status}`;
            if (isSpace) {
              className += ' char-space';
            }

            return (
              <span
                key={index}
                ref={isCurrent ? activeCharRef : null}
                className={className}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Dedicated Typing Area */}
      <div className="typing-section">
        <div className="section-label">Typing Area</div>
        <div className="typing-container">
          <textarea
            ref={inputRef}
            className="typing-input"
            value={engine.typed}
            onKeyDown={handleKeyDown}
            onChange={handleInputChange}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={
              hasStarted
                ? "Continue typing the passage..."
                : "Click here and start typing... (Timer begins on your first keypress)"
            }
          />
          <div className="focus-notice">
            <span>
              {hasStarted
                ? "Keep your eyes on the reference text. Backspace is enabled for corrections."
                : "Timer will start automatically as soon as you type the first character."}
            </span>
            <span>Characters typed: {typedLength} / {engine.passage.length}</span>
          </div>
        </div>
      </div>

      {/* Early Finish Action */}
      <div className="test-actions">
        <button
          className="btn-finish-test"
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirmModal(true);
          }}
          disabled={isFinishing}
        >
          FINISH TEST
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Submit Typing Test?</h3>
            <p>
              Are you sure you want to finish the test early? Your results will be calculated based on the elapsed time and completed characters.
            </p>
            <div className="modal-buttons">
              <button
                className="modal-btn-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn-confirm"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleTestComplete();
                }}
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
