import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';
import './Chats.css';

const Chats = () => {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchChats();
  }, [user?.id]);

  const fetchChats = async () => {
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

      // In a real app, we'd also fetch the last message for each match.
      // For now, let's just list the people.
      const formatted = data.map(m => {
        const other = m.user_1.id === user.id ? m.user_2 : m.user_1;
        return {
          id: m.id,
          name: other.full_name,
          avatar: other.avatar_url,
          lastMsg: 'Напишите что-нибудь...',
          time: 'Сейчас'
        };
      });

      setChats(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state"><div className="loader" /></div>;

  return (
    <div className="chats-page fade-in">
      <div className="page-header">
        <h1>Чаты</h1>
      </div>
      
      <div className="chats-list">
        {chats.length > 0 ? chats.map(chat => (
          <div key={chat.id} className="chat-item" onClick={() => navigate(`/chat/${chat.id}`)}>
            <img src={chat.avatar} className="chat-avatar" alt={chat.name} />
            <div className="chat-info">
              <div className="chat-row">
                <span className="chat-name">{chat.name}</span>
                <span className="chat-time">{chat.time}</span>
              </div>
              <p className="chat-last-msg">{chat.lastMsg}</p>
            </div>
          </div>
        )) : (
          <div className="empty-chats">
            <p>У вас пока нет активных чатов</p>
            <button className="btn-premium" onClick={() => navigate('/')} style={{ marginTop: 20 }}>Найти пару</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;
