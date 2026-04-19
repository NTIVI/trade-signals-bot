require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Telegraf, Markup } = require('telegraf');

const app = express();
const botToken = process.env.BOT_TOKEN;
const bot = new Telegraf(botToken || 'PLACEHOLDER_TOKEN');

// Webhook setup for Telegram
const WEBHOOK_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/index` : '';

// Bot Commands
bot.start((ctx) => {
  ctx.reply('Добро пожаловать в Trade! Нажмите кнопку ниже, чтобы открыть приложение.', Markup.inlineKeyboard([
    [Markup.button.webApp('Открыть Trade', `https://${process.env.VERCEL_URL || 'your-app.vercel.app'}`)]
  ]));
});

app.use(cors());
app.use(express.json());

// Telegram webhook endpoint
app.post('/api/index', (req, res) => {
  bot.handleUpdate(req.body, res);
});

// API Endpoint to send signal to user
app.post('/api/signal', async (req, res) => {
  const { userId, signalText } = req.body;

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

// For local testing
if (process.env.NODE_ENV !== 'production') {
    bot.launch();
}

module.exports = app;
