require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Telegraf, Markup } = require('telegraf');

const app = express();
const botToken = process.env.BOT_TOKEN;
const bot = new Telegraf(botToken || 'PLACEHOLDER_TOKEN');

// The production URL of your Mini App
const APP_URL = 'https://trade-signals-bot.vercel.app';

// Bot Commands
bot.start((ctx) => {
  ctx.reply('Добро пожаловать в Trade! 📈\n\nНажмите кнопку ниже, чтобы открыть приложение и начать получать торговые сигналы.',
    Markup.keyboard([
      [Markup.button.webApp('Открыть Trade', APP_URL)]
    ]).resize()
  );
});

app.use(cors());
app.use(express.json());

const signals = {}; // { asset: { direction, confidence, timestamp } }

// Telegram webhook endpoint
app.post('/api/index', (req, res) => {
  bot.handleUpdate(req.body, res);
});

// API Endpoint to receive signal from Python script and send to user
app.post('/api/signal', async (req, res) => {
  const { userId, signalText, asset, direction, confidence } = req.body;

  if (asset && direction) {
    signals[asset] = {
      direction,
      confidence,
      text: signalText,
      timestamp: Date.now()
    };
  }

  if (!userId || !signalText) {
    return res.status(400).json({ error: 'Missing userId or signalText' });
  }

  try {
    await bot.telegram.sendMessage(userId, signalText);
    res.json({ success: true, message: 'Signal sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Endpoint to get the latest signal for an asset
app.get('/api/latest-signal', (req, res) => {
  const { asset } = req.query;
  if (!asset) return res.status(400).json({ error: 'Asset required' });
  
  const signal = signals[asset];
  if (!signal || (Date.now() - signal.timestamp > 300000)) { // 5 mins expiry
    return res.json({ signal: null });
  }
  
  res.json({ signal });
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
  bot.launch();
}

module.exports = app;
