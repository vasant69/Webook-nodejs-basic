'use strict';

const crypto = require('crypto');
const { sendEmail } = require('../services/gmailService');

/**
 * Verify the HMAC-SHA256 signature sent by the webhook provider.
 * Signature is expected in the X-Hub-Signature-256 header as "sha256=<hex>".
 */
function verifySignature(req) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return true; // skip verification when no secret is configured

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex')}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * Build an HTML email body from the incoming webhook payload.
 */
function buildEmailBody(event, payload) {
  const rows = Object.entries(payload)
    .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${JSON.stringify(v)}</td></tr>`)
    .join('');

  return `
    <h2>Webhook Event: <code>${event}</code></h2>
    <table border="1" cellpadding="6" cellspacing="0">
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#888;font-size:12px">Received at ${new Date().toISOString()}</p>
  `;
}

/**
 * POST /webhook
 * Receives a webhook payload and forwards a notification email via Gmail.
 */
async function handleWebhook(req, res) {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const payload = req.body;
  const event = payload.event || 'webhook.received';

  try {
    const result = await sendEmail({
      to: process.env.GMAIL_TO,
      subject: `Webhook received: ${event}`,
      body: buildEmailBody(event, payload),
    });

    console.log(`[webhook] Email sent for event "${event}", messageId=${result.id}`);

    return res.status(200).json({
      success: true,
      event,
      messageId: result.id,
    });
  } catch (err) {
    console.error(`[webhook] Failed to send email:`, err.message);
    return res.status(500).json({ error: 'Failed to send notification email', detail: err.message });
  }
}

module.exports = { handleWebhook };
