require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Telegraf } = require('telegraf');

const app = express();
const port = process.env.PORT || 3000;

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  console.warn("WARNING: BOT_TOKEN is not set in .env file.");
}

const bot = new Telegraf(botToken || 'PLACEHOLDER_TOKEN');

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Endpoint to send signal to user
app.post('/api/signal', async (req, res) => {
  const { userId, signalText } = req.body;

  if (!userId || !signalText) {
    return res.status(400).json({ error: 'Missing userId or signalText' });
  }

  try {
    // Send message directly to the user via the bot
    await bot.telegram.sendMessage(userId, signalText);
    res.json({ success: true, message: 'Signal sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Don't forget to set your BOT_TOKEN in the .env file!`);
});
