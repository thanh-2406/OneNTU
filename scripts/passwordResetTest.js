const dotenv = require('dotenv');
const crypto = require('crypto');
const { login } = require('../src/services/authService');
const adminService = require('../src/services/adminService');
const db = require('../src/config/db');
const { authenticateToken } = require('../src/middleware/authMiddleware');

dotenv.config();

const randomEmail = () => {
  const suffix = crypto.randomBytes(4).toString('hex');
  return `student.${suffix}@example.com`;
};

const makeResponse = () => {
  let statusCode = null;
  let body = null;

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
    getResult() {
      return { statusCode, body };
    },
  };
};

const run = async () => {
  const client = await db.getClient();
  try {
    const adminResult = await client.query('SELECT admin_id, email FROM admins LIMIT 1');
    if (adminResult.rowCount === 0) {
      throw new Error('No admin account found in the database.');
    }

    const programmeResult = await client.query('SELECT programme_id FROM programmes WHERE is_active = true LIMIT 1');
    if (programmeResult.rowCount === 0) {
      throw new Error('No active programme found in the database.');
    }

    const adminId = adminResult.rows[0].admin_id;
    const programmeId = programmeResult.rows[0].programme_id;
    const studentEmail = randomEmail();

    console.log('1. Creating temporary student for password reset test...');
    const { student, tempPassword: initialPassword } = await adminService.createStudent(
      {
        full_name: 'Password Reset Test Student',
        matric_number: `TEST${Date.now()}`,
        email: studentEmail,
        programme_id: programmeId,
        year_of_study: 1,
      },
      adminId
    );

    console.log('2. Logging in with initial temporary password...');
    const firstLoginResponse = await login({
      email: studentEmail,
      password: initialPassword,
      role: 'student',
      ipAddress: '127.0.0.1',
      userAgent: 'passwordResetTest',
    });

    const oldAccessToken = firstLoginResponse.accessToken;
    console.log('   Access token obtained.');

    console.log('3. Resetting student password...');
    const resetResult = await adminService.resetStudentPassword(student.id);
    const newPassword = resetResult.tempPassword;
    console.log('   Password reset. New temporary password generated.');

    console.log('4. Verifying old token is rejected...');
    const req = {
      headers: {
        authorization: `Bearer ${oldAccessToken}`,
      },
    };

    const res = makeResponse();
    let nextCalled = false;

    await authenticateToken(req, res, () => {
      nextCalled = true;
    });

    if (nextCalled) {
      throw new Error('Old token was accepted after password reset. Expected rejection.');
    }

    const result = res.getResult();
    if (result.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden for old token, got ${result.statusCode}.`);
    }
    console.log('   Old token correctly rejected.');

    console.log('5. Logging in with new temporary password...');
    const secondLoginResponse = await login({
      email: studentEmail,
      password: newPassword,
      role: 'student',
      ipAddress: '127.0.0.1',
      userAgent: 'passwordResetTest',
    });

    const newAccessToken = secondLoginResponse.accessToken;
    console.log('   New access token obtained.');

    console.log('6. Verifying new token is accepted...');
    const req2 = {
      headers: {
        authorization: `Bearer ${newAccessToken}`,
      },
    };

    const res2 = makeResponse();
    let nextCalled2 = false;

    await authenticateToken(req2, res2, () => {
      nextCalled2 = true;
    });

    if (!nextCalled2) {
      throw new Error('New token was rejected. Expected acceptance.');
    }
    console.log('   New token correctly accepted.');

    console.log('\n✅ All password reset tests passed!');
  } finally {
    await client.release();
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error.message || error);
    process.exit(1);
  });
