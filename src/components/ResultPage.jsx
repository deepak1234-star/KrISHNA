import React from 'react';

/**
 * Result Page
 * Displays:
 * 1. Typing Speed (WPM)
 * 2. Total Key Depressions
 * 3. Error Percentage
 * 4. Accuracy Percentage
 * 5. Simple breakdown of incorrectly typed keys/characters and error counts
 * And button: START NEXT TEST
 */
export default function ResultPage({ results, onStartNextTest, isGenerating }) {
  const {
    wpm = 0,
    totalKeyDepressions = 0,
    errorPercentage = 0,
    accuracyPercentage = 100,
    incorrectKeysBreakdown = []
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
            <span className="result-stat-label">Error Percentage</span>
            <span className="result-stat-value">{errorPercentage}%</span>
          </div>

          <div className="result-stat-row">
            <span className="result-stat-label">Accuracy Percentage</span>
            <span className="result-stat-value">{accuracyPercentage}%</span>
          </div>
        </div>

        {/* Breakdown of incorrectly typed keys */}
        {incorrectKeysBreakdown && incorrectKeysBreakdown.length > 0 && (
          <div className="breakdown-container">
            <h3 className="breakdown-heading">Incorrect Key Breakdown</h3>
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Incorrect Key</th>
                  <th>Number of Errors</th>
                </tr>
              </thead>
              <tbody>
                {incorrectKeysBreakdown.map((item, index) => (
                  <tr key={index}>
                    <td className="key-cell">{item.key}</td>
                    <td className="count-cell">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
