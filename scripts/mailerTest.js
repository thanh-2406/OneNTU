require('dotenv').config();
const { sendEmail } = require('../src/utils/mailer');

async function run() {
  const res = await sendEmail({
    to: process.env.MAIL_TEST_RECIPIENT || 'test@example.com',
    subject: 'Test email from my-dashboard-backend',
    text: 'This is a plain-text test message from the mailer utility.',
    html: '<p>This is an <strong>HTML</strong> test message from the mailer utility.</p>',
  });

  if (res.ok) {
    console.log('Email send result:', res.info);
    process.exit(0);
  }

  console.error('Email send failed:', res.error && res.error.message);
  process.exit(1);
}

run();
