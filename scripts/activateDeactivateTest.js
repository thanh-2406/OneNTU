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

    console.log('Creating temporary student for token revocation test...');
    const { student, tempPassword } = await adminService.createStudent(
      {
        full_name: 'Activation Test Student',
        matric_number: `TEST${Date.now()}`,
        email: studentEmail,
        programme_id: programmeId,
        year_of_study: 1,
      },
      adminId
    );

    console.log('Logging in as temporary student...');
    const authResponse = await login({
      email: studentEmail,
      password: tempPassword,
      role: 'student',
      ipAddress: '127.0.0.1',
      userAgent: 'activateDeactivateTest',
    });

    const accessToken = authResponse.accessToken;
    console.log('Access token created. Deactivating student account now...');

    await adminService.deactivateStudent(student.id);

    const req = {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    };

    const res = makeResponse();
    let nextCalled = false;

    await authenticateToken(req, res, () => {
      nextCalled = true;
    });

    const result = res.getResult();
    if (nextCalled) {
      throw new Error('Token was accepted after account deactivation. Expected rejection.');
    }

    if (result.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${result.statusCode}. Response: ${JSON.stringify(result.body)}`);
    }

    if (!result.body || result.body.status !== 'error') {
      throw new Error(`Unexpected response body after deactivation: ${JSON.stringify(result.body)}`);
    }

    console.log('Success: deactivated student token was rejected as expected.');
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
