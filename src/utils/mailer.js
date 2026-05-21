const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM_EMAIL,
  NODE_ENV,
} = process.env;

let transporter;

function createTransporter() {
  if (transporter) return transporter;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM_EMAIL) {
    // Create a stub transporter that doesn't send when configuration missing
    transporter = {
      sendMail: async (mailOptions) => {
        console.warn('Mailer not configured. Skipping actual send.', { mailOptions });
        return { accepted: [], rejected: [], info: 'skipped' };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * sendEmail
 * - Sends an email using configured SMTP transporter.
 * - Accepts either `text` or `html` or both.
 * - Returns an object { ok: boolean, info/error }
 */
async function sendEmail({ to, subject, text, html }) {
  const tx = createTransporter();

  const mailOptions = {
    from: SMTP_FROM_EMAIL || 'no-reply@example.com',
    to,
    subject,
    text,
    html,
  };

  try {
    const result = await tx.sendMail(mailOptions);
    return { ok: true, info: result };
  } catch (err) {
    // Log but do not crash the app
    console.error('Failed to send email', { to, subject, error: err && err.message });
    return { ok: false, error: err };
  }
}

module.exports = {
  sendEmail,
  createTransporter, // exported for testing or advanced usage
};
