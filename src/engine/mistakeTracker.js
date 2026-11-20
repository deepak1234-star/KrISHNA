/**
 * Background Mistake Tracking Engine
 * Silently records granular details for every typing mistake and aggregates
 * difficulty patterns (letters, confusion pairs, bigrams, trigrams).
 */

/**
 * Extracts surrounding word containing the given character index.
 * @param {string} text - Full passage
 * @param {number} index - Character position
 * @returns {string} Word containing the character
 */
export function extractSurroundingWord(text, index) {
  if (!text || index < 0 || index >= text.length) return '';

  let start = index;
  while (start > 0 && !/\s/.test(text[start - 1])) {
    start--;
  }

  let end = index;
  while (end < text.length && !/\s/.test(text[end])) {
    end++;
  }

  return text.substring(start, end);
}

/**
 * Creates a detailed mistake record for an incorrect keystroke.
 * 
 * @param {object} params
 * @param {string} params.passage - The reference text
 * @param {number} params.position - Position in reference passage
 * @param {string} params.typedChar - Character actually typed by user
 * @param {string} [params.testId] - Optional associated test ID
 * @returns {object} Granular error log entry
 */
export function createMistakeRecord({ passage, position, typedChar, testId = null }) {
  const expectedChar = passage[position] ?? '';
  const previousChar = position > 0 ? passage[position - 1] : null;
  const nextChar = position + 1 < passage.length ? passage[position + 1] : null;
  const surroundingWord = extractSurroundingWord(passage, position);

  // Associated combinations
  const confusion = `${expectedChar}->${typedChar}`;
  const bigramPrev = previousChar !== null ? `${previousChar}${expectedChar}` : null;
  const bigramNext = nextChar !== null ? `${expectedChar}${nextChar}` : null;
  const trigram = (previousChar !== null && nextChar !== null)
    ? `${previousChar}${expectedChar}${nextChar}`
    : null;

  return {
    testId,
    timestamp: Date.now(),
    position,
    expectedChar,
    typedChar,
    previousChar,
    nextChar,
    surroundingWord,
    combinations: {
      confusion,
      bigramPrev,
      bigramNext,
      trigram
    }
  };
}

/**
 * Aggregates a list of mistake records into pattern counts.
 * Analyzes:
 * - Single character difficulty
 * - Character confusion pairs (e.g. s typed as a, e typed as i)
 * - Problematic bigrams (preceding or succeeding pairs)
 * - Problematic trigrams
 * 
 * @param {Array<object>} mistakes - Array of mistake records
 * @returns {object} Frequency dictionaries by category
 */
export function aggregateMistakePatterns(mistakes) {
  const charErrors = {};
  const confusions = {};
  const bigramErrors = {};
  const trigramErrors = {};

  for (const m of mistakes) {
    const exp = m.expectedChar ? m.expectedChar.toLowerCase() : '';
    const typed = m.typedChar ? m.typedChar.toLowerCase() : '';

    if (exp) {
      charErrors[exp] = (charErrors[exp] || 0) + 1;
    }

    if (exp && typed && exp !== typed) {
      const confKey = `${exp}->${typed}`;
      confusions[confKey] = (confusions[confKey] || 0) + 1;
    }

    if (m.combinations) {
      const { bigramPrev, bigramNext, trigram } = m.combinations;

      if (bigramPrev) {
        const bgp = bigramPrev.toLowerCase();
        bigramErrors[bgp] = (bigramErrors[bgp] || 0) + 1;
      }

      if (bigramNext) {
        const bgn = bigramNext.toLowerCase();
        bigramErrors[bgn] = (bigramErrors[bgn] || 0) + 1;
      }

      if (trigram) {
        const tg = trigram.toLowerCase();
        trigramErrors[tg] = (trigramErrors[tg] || 0) + 1;
      }
    }
  }

  return {
    charErrors,
    confusions,
    bigramErrors,
    trigramErrors
  };
}
