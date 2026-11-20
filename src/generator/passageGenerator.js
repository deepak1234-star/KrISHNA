import { THEMATIC_SECTIONS } from './passageCorpus.js';
import { computePassageFingerprint } from './fingerprint.js';

/**
 * Counts occurrences of a substring in a text (case-insensitive).
 */
function countOccurrences(text, sub) {
  if (!text || !sub) return 0;
  const lowerText = text.toLowerCase();
  const lowerSub = sub.toLowerCase();
  let count = 0;
  let pos = lowerText.indexOf(lowerSub);
  while (pos !== -1) {
    count++;
    pos = lowerText.indexOf(lowerSub, pos + lowerSub.length);
  }
  return count;
}

/**
 * Scores a sentence based on its exposure to target error patterns.
 * @param {string} sentence 
 * @param {object} patterns 
 * @returns {number} Score
 */
export function scoreSentenceForPatterns(sentence, patterns = {}) {
  let score = 0;
  const { topChars = [], topBigrams = [], topTrigrams = [], topConfusions = [] } = patterns;

  // Trigrams (weight = 4)
  for (const item of topTrigrams) {
    const occurrences = countOccurrences(sentence, item.pattern);
    score += occurrences * (item.errorCount || 1) * 4;
  }

  // Bigrams (weight = 2)
  for (const item of topBigrams) {
    const occurrences = countOccurrences(sentence, item.pattern);
    score += occurrences * (item.errorCount || 1) * 2;
  }

  // Confusion characters (weight = 2)
  for (const item of topConfusions) {
    const [expected] = item.pattern.split('->');
    if (expected) {
      const occurrences = countOccurrences(sentence, expected);
      score += occurrences * (item.errorCount || 1) * 2;
    }
  }

  // Single characters (weight = 1)
  for (const item of topChars) {
    const occurrences = countOccurrences(sentence, item.pattern);
    score += occurrences * (item.errorCount || 1) * 1;
  }

  return score;
}

/**
 * Generates an adaptive, natural, and unique passage for the SSC CGL DEST typing test.
 * 
 * @param {object} options
 * @param {object} [options.historicalPatterns] - Cumulative patterns from IndexedDB
 * @param {Set<string>} [options.pastFingerprints] - Hashes of past generated passages
 * @param {number} [options.targetCharCount=2100] - Standard SSC CGL length (around 2000-2400 chars)
 * @returns {{ passage: string, targetPatterns: Array<string>, fingerprint: string }}
 */
export function generateAdaptivePassage({
  historicalPatterns = {},
  pastFingerprints = new Set(),
  targetCharCount = 2200
} = {}) {
  const hasHistory = (
    (historicalPatterns.topChars && historicalPatterns.topChars.length > 0) ||
    (historicalPatterns.topBigrams && historicalPatterns.topBigrams.length > 0) ||
    (historicalPatterns.topTrigrams && historicalPatterns.topTrigrams.length > 0)
  );

  // Extract top targeted patterns for logging and tracking
  const targetPatterns = [];
  if (historicalPatterns.topTrigrams) {
    targetPatterns.push(...historicalPatterns.topTrigrams.slice(0, 3).map(p => `trigram:${p.pattern}`));
  }
  if (historicalPatterns.topBigrams) {
    targetPatterns.push(...historicalPatterns.topBigrams.slice(0, 4).map(p => `bigram:${p.pattern}`));
  }
  if (historicalPatterns.topChars) {
    targetPatterns.push(...historicalPatterns.topChars.slice(0, 5).map(p => `char:${p.pattern}`));
  }

  // Shuffle array helper
  const shuffle = (arr) => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  // Attempt generation up to 10 times to avoid collision with past passages
  let bestPassage = '';
  let bestFingerprint = '';

  for (let attempt = 0; attempt < 10; attempt++) {
    // Select 3 or 4 distinct thematic sections for paragraph variety
    const chosenThemes = shuffle(THEMATIC_SECTIONS).slice(0, 3);
    const paragraphs = [];
    let currentLength = 0;

    for (const section of chosenThemes) {
      let pool = [...section.sentences];

      if (hasHistory) {
        // Score each sentence against the target patterns
        const scored = pool.map(s => ({
          sentence: s,
          score: scoreSentenceForPatterns(s, historicalPatterns) + (Math.random() * 2) // slight jitter for variety
        }));

        // Sort descending by score
        scored.sort((a, b) => b.score - a.score);

        // Mix: take 2 highest scoring sentences (high pattern exposure)
        // and 1-2 moderate or random sentences (natural text balance)
        const topSentences = scored.slice(0, 2).map(item => item.sentence);
        const remaining = shuffle(scored.slice(2).map(item => item.sentence));
        const selected = [...topSentences, ...remaining.slice(0, 2)];

        paragraphs.push(shuffle(selected).join(' '));
      } else {
        // Balanced random selection for new user
        const selected = shuffle(pool).slice(0, 4);
        paragraphs.push(selected.join(' '));
      }

      currentLength = paragraphs.join(' ').length;
      if (currentLength >= targetCharCount) {
        break;
      }
    }

    const candidatePassage = paragraphs.join(' ').replace(/\s+/g, ' ').trim();
    const fingerprint = computePassageFingerprint(candidatePassage);

    if (!pastFingerprints.has(fingerprint)) {
      return {
        passage: candidatePassage,
        targetPatterns,
        fingerprint
      };
    }

    // Keep candidate in case all 10 collide (extremely rare)
    bestPassage = candidatePassage;
    bestFingerprint = fingerprint;
  }

  return {
    passage: bestPassage,
    targetPatterns,
    fingerprint: bestFingerprint
  };
}
