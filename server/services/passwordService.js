/**
 * passwordService.js
 * Cryptographically secure password and Employee ID generation.
 * Uses Node.js built-in `crypto` — no extra dependency needed.
 */
const crypto = require('crypto');

// Character pools for password generation
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // removed I, O to avoid confusion
const LOWERCASE = 'abcdefghjkmnpqrstuvwxyz'; // removed i, l, o
const NUMBERS = '23456789'; // removed 0, 1 to avoid confusion
const SYMBOLS = '@#$%^*!+=?'; // removed & to prevent HTML encoding issues

/**
 * Generate a cryptographically secure random password.
 * Guarantees at least 1 char from each pool, then fills to targetLength.
 * Total length: 12 characters minimum.
 *
 * @param {number} targetLength - desired password length (min 12)
 * @returns {string} plain-text password (never logged or stored)
 */
function generateSecurePassword(targetLength = 12) {
  const len = Math.max(targetLength, 12);
  const allChars = UPPERCASE + LOWERCASE + NUMBERS + SYMBOLS;

  // Guarantee at least one of each character type
  const required = [
    randomChar(UPPERCASE),
    randomChar(UPPERCASE),
    randomChar(LOWERCASE),
    randomChar(LOWERCASE),
    randomChar(NUMBERS),
    randomChar(NUMBERS),
    randomChar(SYMBOLS),
    randomChar(SYMBOLS),
  ];

  // Fill remaining slots from the full pool
  const remaining = Array.from({ length: len - required.length }, () =>
    randomChar(allChars)
  );

  // Shuffle the combined array using Fisher-Yates with crypto randomness
  const combined = [...required, ...remaining];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = cryptoRandInt(i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
}

/**
 * Pick a cryptographically random character from a string pool.
 * @param {string} pool
 */
function randomChar(pool) {
  const idx = cryptoRandInt(pool.length);
  return pool[idx];
}

/**
 * Generate a cryptographically secure integer in [0, max).
 * Uses rejection sampling to avoid modulo bias.
 * @param {number} max
 */
function cryptoRandInt(max) {
  const limit = 256 - (256 % max);
  let value;
  do {
    value = crypto.randomBytes(1)[0];
  } while (value >= limit);
  return value % max;
}

/**
 * Generate a unique Employee ID in the format: CX-YYYY-NNNN
 * e.g. CX-2025-0042
 *
 * @param {number} sequenceNumber - 1-based index (from DB count)
 * @returns {string}
 */
function generateEmployeeId(sequenceNumber) {
  const year = new Date().getFullYear();
  const paddedSeq = String(sequenceNumber).padStart(4, '0');
  return `CX-${year}-${paddedSeq}`;
}

module.exports = { generateSecurePassword, generateEmployeeId };
