import { describe, it, expect } from 'vitest';
import {
  extractSurroundingWord,
  createMistakeRecord,
  aggregateMistakePatterns
} from '../engine/mistakeTracker.js';

describe('Mistake Tracker Module', () => {
  it('extracts surrounding word accurately at different positions', () => {
    const text = "Modern public administration initiatives.";
    
    // Position 0 ('M' in "Modern")
    expect(extractSurroundingWord(text, 0)).toBe("Modern");
    // Position 2 ('d' in "Modern")
    expect(extractSurroundingWord(text, 2)).toBe("Modern");
    // Position 8 ('u' in "public")
    expect(extractSurroundingWord(text, 8)).toBe("public");
    // Last word ("initiatives.")
    expect(extractSurroundingWord(text, 30)).toBe("initiatives.");
  });

  it('creates granular mistake record with all required context', () => {
    const passage = "sound fiscal administration";
    // Target position 8: 's' in "fiscal"
    // 'fi' (f=6, i=7, s=8, c=9, a=10, l=11)
    const mistake = createMistakeRecord({
      passage,
      position: 8,
      typedChar: 'a', // user typed 'a' instead of 's'
      testId: 'test_123'
    });

    expect(mistake.testId).toBe('test_123');
    expect(mistake.position).toBe(8);
    expect(mistake.expectedChar).toBe('s');
    expect(mistake.typedChar).toBe('a');
    expect(mistake.previousChar).toBe('i');
    expect(mistake.nextChar).toBe('c');
    expect(mistake.surroundingWord).toBe('fiscal');

    // Combinations
    expect(mistake.combinations.confusion).toBe('s->a');
    expect(mistake.combinations.bigramPrev).toBe('is');
    expect(mistake.combinations.bigramNext).toBe('sc');
    expect(mistake.combinations.trigram).toBe('isc');
  });

  it('aggregates mistake patterns accurately for adaptive generator', () => {
    const mistakes = [
      {
        expectedChar: 's',
        typedChar: 'a',
        combinations: { bigramPrev: 'is', bigramNext: 'sc', trigram: 'isc' }
      },
      {
        expectedChar: 's',
        typedChar: 'a',
        combinations: { bigramPrev: 'as', bigramNext: 'se', trigram: 'ase' }
      },
      {
        expectedChar: 'e',
        typedChar: 'i',
        combinations: { bigramPrev: 're', bigramNext: 'ed', trigram: 'red' }
      }
    ];

    const aggregated = aggregateMistakePatterns(mistakes);

    // Chars
    expect(aggregated.charErrors['s']).toBe(2);
    expect(aggregated.charErrors['e']).toBe(1);

    // Confusions
    expect(aggregated.confusions['s->a']).toBe(2);
    expect(aggregated.confusions['e->i']).toBe(1);

    // Bigrams
    expect(aggregated.bigramErrors['is']).toBe(1);
    expect(aggregated.bigramErrors['sc']).toBe(1);
    expect(aggregated.bigramErrors['re']).toBe(1);

    // Trigrams
    expect(aggregated.trigramErrors['isc']).toBe(1);
    expect(aggregated.trigramErrors['red']).toBe(1);
  });
});
