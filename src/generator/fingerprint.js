/**
 * Deterministic passage fingerprinting using FNV-1a 32-bit hash.
 * Fast, lightweight, pure JavaScript, zero external dependencies.
 */

export function computePassageFingerprint(text) {
  if (!text || typeof text !== 'string') return '0';

  // Normalize whitespace to prevent false negatives from minor formatting differences
  const normalized = text.trim().replace(/\s+/g, ' ');

  let hash = 0x811c9dc5; // 2166136261
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    // Multiply by FNV prime 16777619
    hash = Math.imul(hash, 0x01000193);
  }

  // Convert to unsigned 32-bit hex string (e.g. "a3f5c812")
  return (hash >>> 0).toString(16).padStart(8, '0');
}
