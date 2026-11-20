import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TypingEngine } from '../engine/typingEngine.js';
import { TestTimer } from '../engine/timer.js';
import { formatTime } from '../engine/calculations.js';
import { saveCompletedTest } from '../storage/mistakeRepository.js';

const TEST_DURATION_SECONDS = 900; // 15 Minutes exactly

export default function TypingTest({
  passageText,
  targetPatterns = [],
  onFinishTest
}) {
  const [engine] = useState(() => new TypingEngine({ passage: passageText }));
  const [typedLength, setTypedLength] = useState(0);
  const [keyDepressions, setKeyDepressions] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(TEST_DURATION_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const passageBoxRef = useRef(null);
  const activeCharRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const isFinishedRef = useRef(false);

  // Complete and save test
  const handleTestComplete = useCallback(async () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsFinishing(true);

    if (timerRef.current) {
      timerRef.current.stop();
    }

    const finalElapsed = timerRef.current ? timerRef.current.getElapsedSeconds() : elapsedSeconds;
    // Ensure duration is non-zero (minimum 1 second for calculations if finished immediately)
    const validElapsed = Math.max(1, finalElapsed);
    const metrics = engine.getMetrics(validElapsed);

    const testSummary = {
      id: engine.testId,
      timestamp: Date.now(),
      durationSeconds: validElapsed,
      keyDepressions: metrics.totalKeyDepressions,
      wpm: metrics.wpm,
      errorPercentage: metrics.errorPercentage,
      correctCharacters: metrics.correctCharacters,
      totalMistakes: engine.mistakes.length,
      totalAttempts: engine.totalCharacterAttempts
    };

    try {
      // Background silent save to IndexedDB
      await saveCompletedTest({
        testSummary,
        mistakes: engine.mistakes,
        passageText: engine.passage,
        targetPatterns
      });
    } catch (err) {
      console.error('Failed to save test results to IndexedDB:', err);
    }

    onFinishTest(metrics);
  }, [engine, elapsedSeconds, onFinishTest, targetPatterns]);

  // Initialize timestamp-based timer on mount
  useEffect(() => {
    const timer = new TestTimer({
      durationSeconds: TEST_DURATION_SECONDS,
      onTick: (rem, elap) => {
        setRemainingSeconds(rem);
        setElapsedSeconds(elap);
      },
      onExpire: () => {
        handleTestComplete();
      }
    });

    timerRef.current = timer;
    timer.start();

    // Auto-focus typing input
    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => {
      timer.stop();
    };
  }, [handleTestComplete]);

  // Auto-scroll reference passage to keep active character aligned
  useEffect(() => {
    if (activeCharRef.current && passageBoxRef.current) {
      const activeEl = activeCharRef.current;
      const box = passageBoxRef.current;
      
      const charTop = activeEl.offsetTop;
      const boxHeight = box.clientHeight;
      // Keep active line roughly 40-50px from top of viewport
      const targetScroll = Math.max(0, charTop - (boxHeight / 3));

      if (typeof box.scrollTo === 'function') {
        box.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      } else {
        box.scrollTop = targetScroll;
      }
    }
  }, [typedLength]);

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

  // Re-focus helper
  const handleContainerClick = () => {
    if (inputRef.current && !isFinishing) {
      inputRef.current.focus();
    }
  };

  const progressPercentage = engine.passage.length > 0
    ? Math.min(100, Number(((typedLength / engine.passage.length) * 100).toFixed(1)))
    : 0;

  return (
    <div className="test-page" onClick={handleContainerClick}>
      {/* SSC CGL Exam Header */}
      <div className="exam-banner">
        <h1>Staff Selection Commission - DEST</h1>
        <span className="exam-badge">Duration: 15 Minutes</span>
      </div>

      {/* Top Metrics Section */}
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

        <div className="metric-card">
          <span className="metric-label">Typing Progress</span>
          <span className="metric-value">
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Reference Passage with Character-by-Character Styling */}
      <div className="passage-section">
        <div className="section-label">Reference Passage</div>
        <div className="passage-display-box" ref={passageBoxRef}>
          {engine.passage.split('').map((char, index) => {
            const status = engine.getCharacterStatus(index);
            const isCurrent = status === 'current';
            const isSpace = char === ' ' || char === '\n';
            
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
                {char === '\n' ? '↵ ' : char}
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
            onChange={() => {}} // Fully controlled through onKeyDown
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="Click here and begin typing the passage above..."
          />
          <div className="focus-notice">
            <span>Keep your eyes on the reference text. Backspace is enabled for corrections.</span>
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
