import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'dist')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test DB Connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Successfully connected to Neon Database');
  release();
});

// --- API Routes ---

// Get User Profile
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upsert User Profile
app.post('/api/profiles', async (req, res) => {
  const { id, username, full_name, gender, age, city, bio, intentions, interests, avatar_url, photos } = req.body;
  try {
    const query = `
      INSERT INTO profiles (id, username, full_name, gender, age, city, bio, intentions, interests, avatar_url, photos)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        gender = EXCLUDED.gender,
        age = EXCLUDED.age,
        city = EXCLUDED.city,
        bio = EXCLUDED.bio,
        intentions = EXCLUDED.intentions,
        interests = EXCLUDED.interests,
        avatar_url = EXCLUDED.avatar_url,
        photos = EXCLUDED.photos
      RETURNING *;
    `;
    const values = [id, username, full_name, gender, age, city, bio, intentions, interests, avatar_url, photos];
    const { rows } = await pool.query(query, values);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get potential matches (opposite gender)
app.get('/api/users', async (req, res) => {
  const { userId, gender } = req.query;
  const oppositeGender = gender === 'male' ? 'female' : 'male';
  try {
    const { rows } = await pool.query('SELECT * FROM profiles WHERE id != $1 AND gender = $2', [userId, oppositeGender]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Like a user
app.post('/api/likes', async (req, res) => {
  const { from_user, to_user } = req.body;
  try {
    // 1. Insert like
    await pool.query('INSERT INTO likes (from_user, to_user) VALUES ($1, $2) ON CONFLICT DO NOTHING', [from_user, to_user]);
    
    // 2. Check for mutual like
    const { rows: mutual } = await pool.query('SELECT * FROM likes WHERE from_user = $1 AND to_user = $2', [to_user, from_user]);
    
    if (mutual.length > 0) {
      // It's a match!
      const matchQuery = `
        INSERT INTO matches (user_1, user_2) VALUES ($1, $2) 
        ON CONFLICT DO NOTHING RETURNING *;
      `;
      const { rows: match } = await pool.query(matchQuery, [from_user, to_user]);
      
      // If returning is empty due to conflict, fetch the existing one
      if (match.length === 0) {
         const { rows: existingMatch } = await pool.query(
            'SELECT * FROM matches WHERE (user_1 = $1 AND user_2 = $2) OR (user_1 = $2 AND user_2 = $1)', 
            [from_user, to_user]
         );
         return res.json({ isMatch: true, match: existingMatch[0] });
      }
      return res.json({ isMatch: true, match: match[0] });
    }
    
    res.json({ isMatch: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's matches
app.get('/api/matches/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const query = `
      SELECT m.id, 
             u1.id as u1_id, u1.full_name as u1_name, u1.avatar_url as u1_avatar,
             u2.id as u2_id, u2.full_name as u2_name, u2.avatar_url as u2_avatar
      FROM matches m
      JOIN profiles u1 ON m.user_1 = u1.id
      JOIN profiles u2 ON m.user_2 = u2.id
      WHERE m.user_1 = $1 OR m.user_2 = $1
    `;
    const { rows } = await pool.query(query, [userId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get match info
app.get('/api/matches/detail/:matchId', async (req, res) => {
  try {
    const query = `
      SELECT m.id, 
             u1.id as u1_id, u1.full_name as u1_name, u1.avatar_url as u1_avatar,
             u2.id as u2_id, u2.full_name as u2_name, u2.avatar_url as u2_avatar
      FROM matches m
      JOIN profiles u1 ON m.user_1 = u1.id
      JOIN profiles u2 ON m.user_2 = u2.id
      WHERE m.id = $1
    `;
    const { rows } = await pool.query(query, [req.params.matchId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Match not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a match
app.get('/api/messages/:matchId', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM messages WHERE match_id = $1 ORDER BY created_at ASC', [req.params.matchId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Stats
app.get('/api/stats/:userId', async (req, res) => {
   try {
      const { rows: likes } = await pool.query('SELECT count(*) FROM likes WHERE to_user = $1', [req.params.userId]);
      const { rows: chats } = await pool.query('SELECT count(*) FROM matches WHERE user_1 = $1 OR user_2 = $1', [req.params.userId]);
      res.json({
         likes: parseInt(likes[0].count),
         chats: parseInt(chats[0].count)
      });
   } catch(error) {
      console.error(error);
      res.status(500).json({ error: error.message });
   }
});

// --- Socket.io for Realtime Chat ---

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_chat', (matchId) => {
    socket.join(matchId);
    console.log(`User joined chat: ${matchId}`);
  });

  socket.on('send_message', async (data) => {
    const { match_id, sender_id, content } = data;
    try {
      const { rows } = await pool.query(
        'INSERT INTO messages (match_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
        [match_id, sender_id, content]
      );
      const newMessage = rows[0];
      io.to(match_id).emit('receive_message', newMessage);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Catch-all route to serve index.html for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
