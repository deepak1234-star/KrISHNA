/**
 * IndexedDB Database Initialization and Low-level Wrapper
 * Database: SSCDestDB
 */

const DB_NAME = 'SSCDestDB';
const DB_VERSION = 1;

/**
 * Opens or initializes the SSCDestDB database.
 * @returns {Promise<IDBDatabase>}
 */
export function openDatabase() {
  return new Promise((resolve, reject) => {
    // Check if indexedDB is available (browser or polyfill like fake-indexeddb)
    const idb = typeof indexedDB !== 'undefined' ? indexedDB : (globalThis.indexedDB || null);
    if (!idb) {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }

    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Tests Store
      if (!db.objectStoreNames.contains('tests')) {
        const testStore = db.createObjectStore('tests', { keyPath: 'id' });
        testStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 2. Mistake Logs Store
      if (!db.objectStoreNames.contains('mistakeLogs')) {
        const mistakeStore = db.createObjectStore('mistakeLogs', { keyPath: 'id', autoIncrement: true });
        mistakeStore.createIndex('testId', 'testId', { unique: false });
        mistakeStore.createIndex('expectedChar', 'expectedChar', { unique: false });
        mistakeStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 3. Pattern Stats Store (Cumulative)
      if (!db.objectStoreNames.contains('patternStats')) {
        const patternStore = db.createObjectStore('patternStats', { keyPath: 'patternKey' });
        patternStore.createIndex('category', 'category', { unique: false });
        patternStore.createIndex('errorCount', 'errorCount', { unique: false });
      }

      // 4. Passages Store (Fingerprints history)
      if (!db.objectStoreNames.contains('passages')) {
        const passageStore = db.createObjectStore('passages', { keyPath: 'fingerprint' });
        passageStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Execute a transaction on specified stores.
 * @param {string|string[]} storeNames 
 * @param {'readonly'|'readwrite'} mode 
 * @param {function(IDBTransaction): Promise<any>} callback 
 * @returns {Promise<any>}
 */
export async function withTransaction(storeNames, mode, callback) {
  const db = await openDatabase();
  const tx = db.transaction(storeNames, mode);

  return new Promise((resolve, reject) => {
    let result;
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));

    try {
      const res = callback(tx);
      if (res && typeof res.then === 'function') {
        res.then((r) => { result = r; }).catch(reject);
      } else {
        result = res;
      }
    } catch (err) {
      reject(err);
    }
  });
}
