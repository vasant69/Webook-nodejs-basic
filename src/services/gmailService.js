'use strict';

const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

/**
 * Encode an email message in RFC 2822 base64url format.
 */
function buildRawMessage({ from, to, subject, body }) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    body,
  ].join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send an email via the Gmail API.
 * @param {object} options
 * @param {string} options.to      - Recipient address
 * @param {string} options.subject - Email subject
 * @param {string} options.body    - HTML body
 * @param {string} [options.from]  - Sender address (falls back to GMAIL_FROM env var)
 * @returns {Promise<object>}      - Gmail API send response
 */
async function sendEmail({ to, subject, body, from }) {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const raw = buildRawMessage({
    from: from || process.env.GMAIL_FROM,
    to,
    subject,
    body,
  });

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return response.data;
}

module.exports = { sendEmail };
