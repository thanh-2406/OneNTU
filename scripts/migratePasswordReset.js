const dotenv = require('dotenv');
const db = require('../src/config/db');

dotenv.config();

const migrate = async () => {
  try {
    console.log('Running migration: Adding password_reset_at columns...');

    await db.query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ NOT NULL DEFAULT now()`);
    console.log('✅ Added password_reset_at to students');

    await db.query(`ALTER TABLE IF EXISTS staff ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ NOT NULL DEFAULT now()`);
    console.log('✅ Added password_reset_at to staff');

    await db.query(`ALTER TABLE IF EXISTS admins ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ NOT NULL DEFAULT now()`);
    console.log('✅ Added password_reset_at to admins');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message || error);
    process.exit(1);
  }
};

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
