const { generateTempPassword, validateTempPassword } = require('../src/utils/tempPassword');

const ITERATIONS = 1000;
const passwords = new Set();

for (let i = 0; i < ITERATIONS; i++) {
  const pwd = generateTempPassword();

  if (!validateTempPassword(pwd)) {
    console.error('Validation failed for password:', pwd);
    process.exit(2);
  }

  passwords.add(pwd);
}

const uniqueCount = passwords.size;
console.log(`Generated ${ITERATIONS} passwords, unique: ${uniqueCount}`);

if (uniqueCount < ITERATIONS * 0.98) {
  console.error('Too many duplicates; randomness may be insufficient.');
  process.exit(3);
}

console.log('All generated passwords passed validation and uniqueness checks.');
