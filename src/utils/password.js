const bcrypt = require('bcrypt');
const { SECURITY } = require('../config/constants');

const getSaltRounds = () => {
  const saltRounds = Number(SECURITY.BCRYPT_SALT_ROUNDS);
  return Number.isInteger(saltRounds) && saltRounds > 0 ? saltRounds : 12;
};

const hashPassword = async (plainPassword) => {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a non-empty string.');
  }

  try {
    const saltRounds = getSaltRounds();
    return await bcrypt.hash(plainPassword, saltRounds);
  } catch (error) {
    const wrappedError = new Error('Failed to hash password.');
    wrappedError.cause = error;
    throw wrappedError;
  }
};

const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a non-empty string.');
  }

  if (!hashedPassword || typeof hashedPassword !== 'string') {
    throw new Error('Hashed password must be a non-empty string.');
  }

  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    const wrappedError = new Error('Failed to compare password.');
    wrappedError.cause = error;
    throw wrappedError;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
