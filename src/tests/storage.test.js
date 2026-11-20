import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  saveCompletedTest,
  getTopErrorPatterns,
  getPassageFingerprints,
  getCompletedTestCount
} from '../storage/mistakeRepository.js';

describe('Storage & IndexedDB Persistence', () => {
  it('saves completed test results and updates cumulative mistake patterns', async () => {
    const test1 = {
      testSummary: {
        id: 'test_1',
        durationSeconds: 900,
        keyDepressions: 2000,
        wpm: 26.67,
        errorPercentage: 1.5,
        correctCharacters: 1970,
        totalMistakes: 2,
        totalAttempts: 2000
      },
      mistakes: [
        {
          expectedChar: 's',
          typedChar: 'a',
          position: 10,
          combinations: { bigramPrev: 'is', bigramNext: 'st', trigram: 'ist' }
        },
        {
          expectedChar: 'e',
          typedChar: 'i',
          position: 25,
          combinations: { bigramPrev: 're', bigramNext: 'er', trigram: 'rer' }
        }
      ],
      passageText: "The public administration system was reviewed today.",
      targetPatterns: []
    };

    await saveCompletedTest(test1);

    const testCount = await getCompletedTestCount();
    expect(testCount).toBe(1);

    const fingerprints = await getPassageFingerprints();
    expect(fingerprints.size).toBe(1);

    const patterns = await getTopErrorPatterns();
    expect(patterns.topChars.length).toBeGreaterThan(0);
    expect(patterns.topChars.find(c => c.pattern === 's')?.errorCount).toBe(1);
    expect(patterns.topChars.find(c => c.pattern === 'e')?.errorCount).toBe(1);
    expect(patterns.topConfusions.find(c => c.pattern === 's->a')?.errorCount).toBe(1);
  });

  it('accumulates patterns across multiple consecutive tests', async () => {
    // Run Test 2 with repeated 's' error
    const test2 = {
      testSummary: {
        id: 'test_2',
        durationSeconds: 900,
        keyDepressions: 2050,
        wpm: 27.33,
        errorPercentage: 1.0,
        correctCharacters: 2020,
        totalMistakes: 1,
        totalAttempts: 2050
      },
      mistakes: [
        {
          expectedChar: 's',
          typedChar: 'a',
          position: 15,
          combinations: { bigramPrev: 'as', bigramNext: 'st', trigram: 'ast' }
        }
      ],
      passageText: "Another distinct passage on economic development.",
      targetPatterns: ['char:s']
    };

    await saveCompletedTest(test2);

    const patterns = await getTopErrorPatterns();
    // 's' error count should now be 1 (from test1) + 1 (from test2) = 2
    const sChar = patterns.topChars.find(c => c.pattern === 's');
    expect(sChar?.errorCount).toBe(2);

    // Confusion 's->a' should be 2
    const sToA = patterns.topConfusions.find(c => c.pattern === 's->a');
    expect(sToA?.errorCount).toBe(2);

    // Fingerprints should now have 2 unique records
    const fingerprints = await getPassageFingerprints();
    expect(fingerprints.size).toBe(2);
  });
});
