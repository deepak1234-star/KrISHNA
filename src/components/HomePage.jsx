import React, { useState } from 'react';

const DURATION_OPTIONS = [5, 10, 15, 30];

/**
 * Minimal Home Page
 * Clean white layout with test duration options (5, 10, 15, 30 mins) and START TEST button.
 */
export default function HomePage({ onStartTest, isGenerating, initialDuration = 15 }) {
  const [selectedDuration, setSelectedDuration] = useState(initialDuration);

  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-title">SSC CGL DEST Typing Practice</h1>
        <p className="home-subtitle">
          Data Entry Speed Test Preparation
        </p>

        {/* Time duration selection */}
        <div className="duration-picker-container">
          <label className="duration-picker-label">Select Test Duration</label>
          <div className="duration-options">
            {DURATION_OPTIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                className={`btn-duration ${selectedDuration === mins ? 'active' : ''}`}
                onClick={() => setSelectedDuration(mins)}
                disabled={isGenerating}
              >
                {mins} Minutes
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-start-test"
          onClick={() => onStartTest(selectedDuration)}
          disabled={isGenerating}
        >
          {isGenerating ? 'PREPARING TEST...' : `START ${selectedDuration}-MINUTE TEST`}
        </button>
      </div>
    </div>
  );
}
