# Trade Signals Bot

A premium Telegram Mini App for real-time crypto signal analysis.

## Features

- **Premium UI**: Glassmorphism, animations, and high-quality aesthetics.
- **Haptic Feedback**: Integrated Telegram haptic feedback for a native feel.
- **Real-time Analysis**: Monitors top crypto assets on a 5-second timeframe.
- **Serverless Backend**: Optimized for Vercel deployment using Node.js.
- **Large Start Button**: Easy access via a prominent keyboard button in the Telegram bot.

## Project Structure

- `api/`: Serverless functions (bot logic and signal endpoint).
- `index.html`, `app.js`, `style.css`: Frontend Mini App files.
- `vercel.json`: Vercel routing configuration.

## Deployment

This project is configured for deployment on Vercel.
1. Connect this repository to your Vercel account.
2. Set `BOT_TOKEN` in Environment Variables.
3. Vercel will automatically deploy and serve both the frontend and the bot API.

## API Endpoints

- `POST /api/signal`: Send a signal to a user.
  - Body: `{ "userId": "ID", "signalText": "Text" }`

## License

MIT
