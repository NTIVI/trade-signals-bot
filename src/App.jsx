import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { getProfile } from './lib/api';
import { useTelegram } from './hooks/useTelegram';
import './App.css';

import Home from './pages/Home';
import Chats from './pages/Chats';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ChatDetail from './pages/ChatDetail';
import UserProfile from './pages/UserProfile';
import Matches from './pages/Matches';

function App() {
  const { tg, onExpand, user } = useTelegram();
  const navigate = useNavigate();
  const location = useLocation();

  const [isChecking, setIsChecking] = useState(true);
  const [tgUser, setTgUser] = useState(null);

  useEffect(() => {
    tg?.ready();
    onExpand();

    const checkRegistration = async () => {
      if (!user?.id) {
        setIsChecking(false);
        return;
      }
      
      try {
        const data = await getProfile(user.id);
        if (data) {
          setTgUser(data);
        }
        if (!data && location.pathname !== '/register') {
          navigate('/register');
        }
      } catch (err) {
        console.error('Check failed:', err);
        if (location.pathname !== '/register') {
          navigate('/register');
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkRegistration();
  }, [user?.id]);

  if (isChecking) {
    return (
      <div className="loading-state">
        <div className="loader"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  const showNav = ['/', '/chats', '/matches', '/profile'].includes(location.pathname);

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chat/:id" element={<ChatDetail />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user/:id" element={<UserProfile />} />
      </Routes>

      {showNav && (
        <nav className="bottom-nav">
          <button className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
            <span className="nav-icon">🔥</span>
            <span className="nav-label">Знакомства</span>
          </button>
          <button className={`nav-item ${location.pathname === '/chats' ? 'active' : ''}`} onClick={() => navigate('/chats')}>
            <span className="nav-icon">💬</span>
            <span className="nav-label">Чаты</span>
          </button>
          <button className={`nav-item ${location.pathname === '/matches' ? 'active' : ''}`} onClick={() => navigate('/matches')}>
            <span className="nav-icon">💖</span>
            <span className="nav-label">Матчи</span>
          </button>
          <button className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => navigate('/profile')}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">Профиль</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
