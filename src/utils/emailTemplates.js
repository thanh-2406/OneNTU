const { APP_NAME, APP_LOGIN_URL, SUPPORT_EMAIL } = process.env;
const { HTTP_STATUS } = require('../config/constants');

const defaultAppName = APP_NAME || 'My Dashboard';
const defaultLoginUrl = APP_LOGIN_URL || 'https://dashboard.example.com/login';
const defaultSupportEmail = SUPPORT_EMAIL || 'support@example.com';

function studentWelcomeTemplate({
  name,
  loginIdentifier,
  matricNumber,
  tempPassword,
  loginUrl = defaultLoginUrl,
  appName = defaultAppName,
  supportEmail = defaultSupportEmail,
}) {
  const subject = `${appName} — Welcome to your student account`;

  const text = `Hello ${name},

Your student account has been created on ${appName}.

Login identifier: ${loginIdentifier}
Matric number: ${matricNumber}
Temporary password: ${tempPassword}

Please log in at ${loginUrl} and change your password immediately.

If you did not expect this email, contact ${supportEmail}.

Regards,
${appName} Team`;

  const html = `
<div style="font-family: Arial, sans-serif; color: #111; line-height:1.4;">
  <h2 style="color:#0b5ed7;">Welcome to ${appName}, ${name}</h2>
  <p>Your student account has been created. Below are your account details:</p>
  <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
    <tr><td style="font-weight:600">Login identifier:</td><td>${loginIdentifier}</td></tr>
    <tr><td style="font-weight:600">Matric number:</td><td>${matricNumber}</td></tr>
    <tr><td style="font-weight:600">Temporary password:</td><td style="font-family: monospace;">${tempPassword}</td></tr>
  </table>

  <h4>Next steps</h4>
  <ol>
    <li>Visit <a href="${loginUrl}">${loginUrl}</a> to sign in.</li>
    <li>Use the temporary password above and change it immediately in your account settings.</li>
  </ol>

  <p>If you did not request this account or believe this is an error, contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

  <p style="color:#666; font-size:12px;">Regards,<br/>${appName} Team</p>
</div>
`;

  return { subject, text, html };
}

function staffWelcomeTemplate({
  name,
  loginIdentifier,
  staffEmail,
  tempPassword,
  loginUrl = defaultLoginUrl,
  appName = defaultAppName,
  supportEmail = defaultSupportEmail,
}) {
  const subject = `${appName} — Welcome to your staff account`;

  const text = `Hello ${name},

Your staff account has been created on ${appName}.

Login identifier: ${loginIdentifier}
Staff email: ${staffEmail}
Temporary password: ${tempPassword}

Please log in at ${loginUrl} and change your password immediately.

If you did not expect this email, contact ${supportEmail}.

Regards,
${appName} Team`;

  const html = `
<div style="font-family: Arial, sans-serif; color: #111; line-height:1.4;">
  <h2 style="color:#0b5ed7;">Welcome to ${appName}, ${name}</h2>
  <p>Your staff account has been created. Below are your account details:</p>
  <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
    <tr><td style="font-weight:600">Login identifier:</td><td>${loginIdentifier}</td></tr>
    <tr><td style="font-weight:600">Staff email:</td><td>${staffEmail}</td></tr>
    <tr><td style="font-weight:600">Temporary password:</td><td style="font-family: monospace;">${tempPassword}</td></tr>
  </table>

  <h4>Next steps</h4>
  <ol>
    <li>Visit <a href="${loginUrl}">${loginUrl}</a> to sign in.</li>
    <li>Use the temporary password above and change it immediately in your account settings.</li>
  </ol>

  <p>If you did not request this account or believe this is an error, contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

  <p style="color:#666; font-size:12px;">Regards,<br/>${appName} Team</p>
</div>
`;

  return { subject, text, html };
}

function studentPasswordResetTemplate({
  name,
  loginIdentifier,
  tempPassword,
  loginUrl = defaultLoginUrl,
  appName = defaultAppName,
  supportEmail = defaultSupportEmail,
}) {
  const subject = `${appName} — Password Reset Request`;

  const text = `Hello ${name},

Your password has been reset by an administrator on ${appName}.

Login identifier: ${loginIdentifier}
Temporary password: ${tempPassword}

Please log in at ${loginUrl} and change your password immediately.

If you did not request this password reset or believe this is an error, contact ${supportEmail}.

Regards,
${appName} Team`;

  const html = `
<div style="font-family: Arial, sans-serif; color: #111; line-height:1.4;">
  <h2 style="color:#0b5ed7;">Password Reset Notification, ${name}</h2>
  <p>Your password has been reset by an administrator. Below are your temporary account credentials:</p>
  <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
    <tr><td style="font-weight:600">Login identifier:</td><td>${loginIdentifier}</td></tr>
    <tr><td style="font-weight:600">Temporary password:</td><td style="font-family: monospace;">${tempPassword}</td></tr>
  </table>

  <h4>Next steps</h4>
  <ol>
    <li>Visit <a href="${loginUrl}">${loginUrl}</a> to sign in.</li>
    <li>Use the temporary password above and change it immediately in your account settings.</li>
  </ol>

  <p>If you did not request this password reset or believe this is an error, contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

  <p style="color:#666; font-size:12px;">Regards,<br/>${appName} Team</p>
</div>
`;

  return { subject, text, html };
}

function staffPasswordResetTemplate({
  name,
  loginIdentifier,
  tempPassword,
  loginUrl = defaultLoginUrl,
  appName = defaultAppName,
  supportEmail = defaultSupportEmail,
}) {
  const subject = `${appName} — Password Reset Request`;

  const text = `Hello ${name},

Your password has been reset by an administrator on ${appName}.

Login identifier: ${loginIdentifier}
Temporary password: ${tempPassword}

Please log in at ${loginUrl} and change your password immediately.

If you did not request this password reset or believe this is an error, contact ${supportEmail}.

Regards,
${appName} Team`;

  const html = `
<div style="font-family: Arial, sans-serif; color: #111; line-height:1.4;">
  <h2 style="color:#0b5ed7;">Password Reset Notification, ${name}</h2>
  <p>Your password has been reset by an administrator. Below are your temporary account credentials:</p>
  <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
    <tr><td style="font-weight:600">Login identifier:</td><td>${loginIdentifier}</td></tr>
    <tr><td style="font-weight:600">Temporary password:</td><td style="font-family: monospace;">${tempPassword}</td></tr>
  </table>

  <h4>Next steps</h4>
  <ol>
    <li>Visit <a href="${loginUrl}">${loginUrl}</a> to sign in.</li>
    <li>Use the temporary password above and change it immediately in your account settings.</li>
  </ol>

  <p>If you did not request this password reset or believe this is an error, contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

  <p style="color:#666; font-size:12px;">Regards,<br/>${appName} Team</p>
</div>
`;

  return { subject, text, html };
}

module.exports = {
  studentWelcomeTemplate,
  staffWelcomeTemplate,
  studentPasswordResetTemplate,
  staffPasswordResetTemplate,
};
