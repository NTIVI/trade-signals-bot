CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id BIGINT PRIMARY KEY, -- Telegram User ID
  username TEXT,
  full_name TEXT,
  avatar_url TEXT, -- This will be the "Main Photo"
  photos TEXT[],    -- Additional photos (at least 2 required)
  age INTEGER,
  gender TEXT,     -- 'male' or 'female'
  intentions TEXT[],
  interests TEXT[],
  city TEXT,
  bio TEXT,
  likes_count INTEGER DEFAULT 0,
  chats_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create likes table
CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
  to_user BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(from_user, to_user)
);

-- Create matches table
CREATE TABLE matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_1 BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
  user_2 BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_1, user_2)
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS and Policies removed for Neon backend

-- Function to update stats on like
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles SET likes_count = likes_count + 1 WHERE id = NEW.to_user;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles SET likes_count = likes_count - 1 WHERE id = OLD.to_user;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_added
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- Function to update stats on match
CREATE OR REPLACE FUNCTION update_chats_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles SET chats_count = chats_count + 1 WHERE id = NEW.user_1;
    UPDATE profiles SET chats_count = chats_count + 1 WHERE id = NEW.user_2;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles SET chats_count = chats_count - 1 WHERE id = OLD.user_1;
    UPDATE profiles SET chats_count = chats_count - 1 WHERE id = OLD.user_2;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_match_added
AFTER INSERT OR DELETE ON matches
FOR EACH ROW EXECUTE FUNCTION update_chats_count();
