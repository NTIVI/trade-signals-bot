# Telegram Dating Mini App

A premium, modern dating app built for Telegram.

## Features
- **Mandatory Registration**: Users must set their intentions, age, and upload an avatar.
- **Swipe Interface**: Tinder-like swiping with Framer Motion animations.
- **Match System**: Real-time match overlay on mutual likes.
- **Chat System**: Real-time messaging with message history.
- **Profile Management**: View and edit your profile.

## Tech Stack
- **Frontend**: Vite + React
- **Styling**: Vanilla CSS (Premium Design)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (Database + Realtime)

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Supabase**:
   - Create a project on [Supabase](https://supabase.com).
   - Run the SQL in `supabase_schema.sql` in the SQL Editor.
   - Copy your `Project URL` and `Anon Key`.

3. **Configure Environment**:
   - Create a `.env` file from `.env.example`.
   - Add your Supabase credentials.

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Telegram Integration
To test in Telegram, you need to:
1. Create a bot using [@BotFather](https://t.me/BotFather).
2. Set up a Mini App using `/newapp`.
3. Provide the URL where your app is hosted (use `ngrok` for local development).
