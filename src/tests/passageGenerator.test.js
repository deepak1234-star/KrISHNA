import { describe, it, expect } from 'vitest';
import { generateAdaptivePassage, scoreSentenceForPatterns } from '../generator/passageGenerator.js';
import { computePassageFingerprint } from '../generator/fingerprint.js';

describe('Adaptive Passage Generator', () => {
  it('generates a well-formed, natural administrative passage', () => {
    const result = generateAdaptivePassage({ targetCharCount: 1500 });
    
    expect(result.passage).toBeTypeOf('string');
    expect(result.passage.length).toBeGreaterThan(1000);
    expect(result.fingerprint).toBeTypeOf('string');
    expect(result.fingerprint.length).toBe(8);

    // Natural English formatting (capitalized sentences, ending periods, multiple sentences)
    expect(result.passage.split('. ').length).toBeGreaterThan(3);
    expect(result.passage.endsWith('.')).toBe(true);
  });

  it('scores sentences higher when they contain user error patterns', () => {
    const sentenceWithPatterns = "The gathering of operational administrative statistics requires further deliberation.";
    const sentenceWithoutPatterns = "Public policy works well.";

    const historicalPatterns = {
      topChars: [{ pattern: 't', errorCount: 5 }, { pattern: 'r', errorCount: 4 }],
      topBigrams: [{ pattern: 'th', errorCount: 6 }, { pattern: 'er', errorCount: 5 }],
      topTrigrams: [{ pattern: 'ing', errorCount: 8 }]
    };

    const scoreHigh = scoreSentenceForPatterns(sentenceWithPatterns, historicalPatterns);
    const scoreLow = scoreSentenceForPatterns(sentenceWithoutPatterns, historicalPatterns);

    expect(scoreHigh).toBeGreaterThan(scoreLow);
  });

  it('avoids previously generated passages using fingerprints', () => {
    // Generate first passage
    const first = generateAdaptivePassage();
    const pastFingerprints = new Set([first.fingerprint]);

    // Generate second passage with pastFingerprints supplied
    const second = generateAdaptivePassage({ pastFingerprints });

    expect(second.fingerprint).not.toBe(first.fingerprint);
    expect(pastFingerprints.has(second.fingerprint)).toBe(false);
  });

  it('produces deterministic fingerprints for identical text', () => {
    const textA = "Public administration requires transparency and diligence.";
    const textB = "Public administration requires transparency and diligence.";
    const textC = "Different text entirely.";

    expect(computePassageFingerprint(textA)).toBe(computePassageFingerprint(textB));
    expect(computePassageFingerprint(textA)).not.toBe(computePassageFingerprint(textC));
  });
});
