'use strict';

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { handleWebhook } = require('./webhooks/webhookHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/webhook', handleWebhook);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});

module.exports = app;
