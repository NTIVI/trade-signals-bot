import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useTelegram } from './hooks/useTelegram';
import './App.css';

import Home from './pages/Home';
import Chats from './pages/Chats';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ChatDetail from './pages/ChatDetail';

function App() {
  const { tg, onExpand } = useTelegram();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    tg?.ready();
    onExpand();

    const checkRegistration = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!data && location.pathname !== '/register') {
        navigate('/register');
      } else if (data && location.pathname === '/register') {
        navigate('/');
      }
    };

    checkRegistration();
  }, [tg, onExpand, navigate, location.pathname, user?.id]);

  const navItems = [
    { id: 'home', path: '/', label: 'Главная', icon: '🔥' },
    { id: 'chats', path: '/chats', label: 'Чаты', icon: '💬' },
    { id: 'profile', path: '/profile', label: 'Профиль', icon: '👤' },
  ];

  const showNav = ['/', '/chats', '/profile'].includes(location.pathname);

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Home onChat={() => navigate('/chats/1')} />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chats/:id" element={<ChatDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />
      </Routes>

      {showNav && (
        <nav className="bottom-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export default App;
