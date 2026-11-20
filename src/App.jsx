import React, { useState } from 'react';
import HomePage from './components/HomePage.jsx';
import TypingTest from './components/TypingTest.jsx';
import ResultPage from './components/ResultPage.jsx';
import { getTopErrorPatterns, getPassageFingerprints } from './storage/mistakeRepository.js';
import { generateAdaptivePassage } from './generator/passageGenerator.js';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'test' | 'result'
  const [currentPassage, setCurrentPassage] = useState('');
  const [targetPatterns, setTargetPatterns] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testSessionId, setTestSessionId] = useState(0);

  const startNewTest = async () => {
    setIsGenerating(true);
    try {
      // 1. Fetch cumulative mistake history from IndexedDB
      const historicalPatterns = await getTopErrorPatterns(10);
      
      // 2. Fetch past passage fingerprints to ensure uniqueness
      const pastFingerprints = await getPassageFingerprints();

      // 3. Adaptively generate a fresh, tailored passage
      const generated = generateAdaptivePassage({
        historicalPatterns,
        pastFingerprints,
        targetCharCount: 2200
      });

      setCurrentPassage(generated.passage);
      setTargetPatterns(generated.targetPatterns);
      setTestSessionId((prev) => prev + 1);
      setScreen('test');
    } catch (err) {
      console.error('Failed to generate adaptive passage:', err);
      // Fallback generation if IndexedDB query has an issue
      const fallback = generateAdaptivePassage();
      setCurrentPassage(fallback.passage);
      setTargetPatterns([]);
      setTestSessionId((prev) => prev + 1);
      setScreen('test');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinishTest = (metrics) => {
    setTestResults(metrics);
    setScreen('result');
  };

  return (
    <div className="app-container">
      {screen === 'home' && (
        <HomePage
          onStartTest={startNewTest}
          isGenerating={isGenerating}
        />
      )}

      {screen === 'test' && (
        <TypingTest
          key={`test_session_${testSessionId}`} // ensures fresh instance and deadline on every new test
          passageText={currentPassage}
          targetPatterns={targetPatterns}
          onFinishTest={handleFinishTest}
        />
      )}

      {screen === 'result' && (
        <ResultPage
          results={testResults}
          onStartNextTest={startNewTest}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}
