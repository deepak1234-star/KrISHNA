import { withTransaction, openDatabase } from './db.js';
import { aggregateMistakePatterns } from '../engine/mistakeTracker.js';
import { computePassageFingerprint } from '../generator/fingerprint.js';

/**
 * Persists completed test results, granular mistake logs, passage fingerprint,
 * and updates cumulative pattern statistics in IndexedDB.
 */
export async function saveCompletedTest({
  testSummary,
  mistakes = [],
  passageText = '',
  targetPatterns = []
}) {
  const fingerprint = computePassageFingerprint(passageText);
  const patternSummary = aggregateMistakePatterns(mistakes);

  return withTransaction(
    ['tests', 'mistakeLogs', 'patternStats', 'passages'],
    'readwrite',
    async (tx) => {
      // 1. Save Test Record
      const testStore = tx.objectStore('tests');
      testStore.put({
        ...testSummary,
        passageFingerprint: fingerprint,
        timestamp: testSummary.timestamp || Date.now()
      });

      // 2. Save granular mistake logs
      const mistakeStore = tx.objectStore('mistakeLogs');
      for (const mistake of mistakes) {
        mistakeStore.add({
          ...mistake,
          testId: testSummary.id
        });
      }

      // 3. Save passage history record
      const passageStore = tx.objectStore('passages');
      passageStore.put({
        fingerprint,
        passage: passageText,
        targetPatterns,
        timestamp: Date.now()
      });

      // 4. Update cumulative pattern frequencies
      const patternStore = tx.objectStore('patternStats');

      const updateCategoryCounts = (counts, category) => {
        for (const [pattern, count] of Object.entries(counts)) {
          const key = `${category}:${pattern}`;
          const getReq = patternStore.get(key);
          getReq.onsuccess = () => {
            const existing = getReq.result;
            const updatedCount = (existing ? existing.errorCount : 0) + count;
            patternStore.put({
              patternKey: key,
              category,
              pattern,
              errorCount: updatedCount,
              lastSeen: Date.now()
            });
          };
        }
      };

      updateCategoryCounts(patternSummary.charErrors, 'char');
      updateCategoryCounts(patternSummary.confusions, 'confusion');
      updateCategoryCounts(patternSummary.bigramErrors, 'bigram');
      updateCategoryCounts(patternSummary.trigramErrors, 'trigram');
    }
  );
}

/**
 * Retrieves cumulative top error patterns from IndexedDB.
 * Returns top characters, confusions, bigrams, and trigrams.
 * 
 * @param {number} [limit=10]
 * @returns {Promise<{
 *   topChars: Array<{pattern: string, errorCount: number}>,
 *   topConfusions: Array<{pattern: string, errorCount: number}>,
 *   topBigrams: Array<{pattern: string, errorCount: number}>,
 *   topTrigrams: Array<{pattern: string, errorCount: number}>
 * }>}
 */
export async function getTopErrorPatterns(limit = 10) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('patternStats', 'readonly');
      const store = tx.objectStore('patternStats');
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];

        const byCategory = {
          char: [],
          confusion: [],
          bigram: [],
          trigram: []
        };

        for (const record of records) {
          if (byCategory[record.category]) {
            byCategory[record.category].push({
              pattern: record.pattern,
              errorCount: record.errorCount,
              category: record.category
            });
          }
        }

        const sortByCount = (arr) => arr.sort((a, b) => b.errorCount - a.errorCount).slice(0, limit);

        resolve({
          topChars: sortByCount(byCategory.char),
          topConfusions: sortByCount(byCategory.confusion),
          topBigrams: sortByCount(byCategory.bigram),
          topTrigrams: sortByCount(byCategory.trigram)
        });
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not read error patterns from IndexedDB:', err);
    return {
      topChars: [],
      topConfusions: [],
      topBigrams: [],
      topTrigrams: []
    };
  }
}

/**
 * Retrieves set of all previously generated passage fingerprints.
 * @returns {Promise<Set<string>>}
 */
export async function getPassageFingerprints() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('passages', 'readonly');
      const store = tx.objectStore('passages');
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(new Set(request.result || []));
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not fetch passage fingerprints:', err);
    return new Set();
  }
}

/**
 * Gets total completed test count from IndexedDB.
 * @returns {Promise<number>}
 */
export async function getCompletedTestCount() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tests', 'readonly');
      const store = tx.objectStore('tests');
      const countReq = store.count();

      countReq.onsuccess = () => resolve(countReq.result || 0);
      countReq.onerror = () => reject(countReq.error);
    });
  } catch (err) {
    return 0;
  }
}
