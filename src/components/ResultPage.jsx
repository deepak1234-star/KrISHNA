import React from 'react';

/**
 * Result Page
 * Displays ONLY:
 * 1. Typing Speed (WPM)
 * 2. Total Key Depressions
 * 3. Typing Error Percentage
 * And button: START NEXT TEST
 */
export default function ResultPage({ results, onStartNextTest, isGenerating }) {
  const {
    wpm = 0,
    totalKeyDepressions = 0,
    errorPercentage = 0
  } = results || {};

  return (
    <div className="result-page">
      <div className="result-card">
        <h2 className="result-title">Test Results</h2>

        <div className="result-stats-list">
          <div className="result-stat-row">
            <span className="result-stat-label">Typing Speed (WPM)</span>
            <span className="result-stat-value">{wpm}</span>
          </div>

          <div className="result-stat-row">
            <span className="result-stat-label">Total Key Depressions</span>
            <span className="result-stat-value">
              {totalKeyDepressions.toLocaleString()}
            </span>
          </div>

          <div className="result-stat-row">
            <span className="result-stat-label">Typing Error Percentage</span>
            <span className="result-stat-value">{errorPercentage}%</span>
          </div>
        </div>

        <button
          className="btn-next-test"
          onClick={onStartNextTest}
          disabled={isGenerating}
        >
          {isGenerating ? 'PREPARING TEST...' : 'START NEXT TEST'}
        </button>
      </div>
    </div>
  );
}
