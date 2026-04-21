import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyMatches } from '../lib/api';
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
      const data = await getMyMatches(user.id);

      const formatted = data.map(m => {
        const other = m.u1_id === user.id ? 
          { id: m.u2_id, name: m.u2_name, avatar: m.u2_avatar } : 
          { id: m.u1_id, name: m.u1_name, avatar: m.u1_avatar };
        return {
          id: m.id, // match_id
          name: other.name,
          avatar: other.avatar,
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
