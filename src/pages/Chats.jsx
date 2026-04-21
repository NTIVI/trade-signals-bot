import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';
import './Chats.css';

const Chats = () => {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          user_1 (id, full_name, avatar_url),
          user_2 (id, full_name, avatar_url)
        `)
        .or(`user_1.eq.${user.id},user_2.eq.${user.id}`);

      if (error) throw error;

      const formattedMatches = data.map(m => {
        const otherUser = m.user_1.id === user.id ? m.user_2 : m.user_1;
        return {
          id: m.id,
          name: otherUser.full_name,
          avatar: otherUser.avatar_url,
          lastMessage: 'Начните общение!',
          time: 'Сейчас'
        };
      });

      setMatches(formattedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="chats-container loading-state">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="chats-container fade-in">
      <div className="chats-header">
        <h1>Сообщения</h1>
      </div>
      
      <div className="matches-section">
        <h3>Новые пары</h3>
        <div className="matches-list">
          <div className="match-item new">
            <div className="match-avatar-ring">
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" alt="New match" />
            </div>
            <span>Саша</span>
          </div>
        </div>
      </div>

      <div className="chats-list">
        {matches.map(chat => (
          <div key={chat.id} className="chat-item" onClick={() => navigate(`/chats/${chat.id}`)}>
            <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
            <div className="chat-info">
              <div className="chat-row">
                <span className="chat-name">{chat.name}</span>
                <span className="chat-time">{chat.time}</span>
              </div>
              <div className="chat-row">
                <span className="chat-last-msg">{chat.lastMessage}</span>
                {chat.unread > 0 && <span className="unread-badge">{chat.unread}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Chats;
