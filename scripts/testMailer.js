require('dotenv').config();

const { sendEmail } = require('../src/utils/mailer');
const { studentWelcomeTemplate } = require('../src/utils/emailTemplates');
const { generateTempPassword } = require('../src/utils/tempPassword');

async function runTest() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM_EMAIL) {
    console.error('SMTP configuration missing in .env. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL.');
    process.exit(2);
  }

  const recipient = process.env.MAIL_TEST_RECIPIENT || SMTP_USER;
  const tempPassword = generateTempPassword();

  const template = studentWelcomeTemplate({
    name: 'Mailer Test User',
    loginIdentifier: recipient,
    matricNumber: 'TEST0001',
    tempPassword,
  });

  console.log('Sending test email to:', recipient);

  try {
    const res = await sendEmail({
      to: recipient,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (res.ok) {
      console.log('Test email sent successfully. Mailer info:', res.info);
      process.exit(0);
    }

    console.error('Test email failed to send. Error:', res.error && res.error.message);
    process.exit(1);
  } catch (err) {
    console.error('Unexpected error during send:', err && err.message);
    process.exit(1);
  }
}

runTest();
