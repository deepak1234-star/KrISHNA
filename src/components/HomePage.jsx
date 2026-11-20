import React from 'react';

/**
 * Minimal Home Page
 * Single clean white layout with one prominent START TEST button.
 */
export default function HomePage({ onStartTest, isGenerating }) {
  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-title">SSC CGL DEST Typing Practice</h1>
        <p className="home-subtitle">
          Data Entry Speed Test Preparation
        </p>
        
        <button
          className="btn-start-test"
          onClick={onStartTest}
          disabled={isGenerating}
        >
          {isGenerating ? 'PREPARING TEST...' : 'START TEST'}
        </button>
      </div>
    </div>
  );
}
