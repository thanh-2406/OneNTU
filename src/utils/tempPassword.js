const crypto = require('crypto');

// Character sets chosen for readability and to avoid ambiguous characters
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I, O
const LOWER = 'abcdefghjkmnpqrstuvwxyz'; // no l, o
const DIGITS = '23456789'; // no 0,1
const SPECIAL = '!@#$%^&*()-_=+?';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

const secureRandomInt = (maxExclusive) => crypto.randomInt(0, maxExclusive);

const pick = (set) => set[secureRandomInt(set.length)];

const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * generateTempPassword(options)
 * - Generates a secure, human-readable temporary password.
 * - Defaults to length between 10 and 12 characters.
 * - Guarantees at least one uppercase, one lowercase, one digit and one special char.
 *
 * Options:
 *  - minLength (number)
 *  - maxLength (number)
 */
function generateTempPassword(options = {}) {
  const minLength = Number.isInteger(options.minLength) ? options.minLength : 10;
  const maxLength = Number.isInteger(options.maxLength) ? options.maxLength : 12;

  if (minLength < 4 || maxLength < minLength) {
    throw new Error('Invalid length constraints for temporary password generation.');
  }

  const length = crypto.randomInt(minLength, maxLength + 1);

  // Ensure complexity requirements
  const parts = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SPECIAL)];

  // Fill the rest with random picks from the combined safe set
  for (let i = parts.length; i < length; i++) {
    parts.push(pick(ALL));
  }

  // Shuffle securely and return
  return shuffleArray(parts).join('');
}

function validateTempPassword(password) {
  if (typeof password !== 'string') return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()\-_=+?]/.test(password);
  const lenOk = password.length >= 10 && password.length <= 12;
  return hasUpper && hasLower && hasDigit && hasSpecial && lenOk;
}

module.exports = {
  generateTempPassword,
  validateTempPassword,
};
