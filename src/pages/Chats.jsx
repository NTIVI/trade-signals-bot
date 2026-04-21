import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Chats.css';

const DUMMY_CHATS = [
  { id: 1, name: 'Anna', lastMessage: 'Hey! How are you?', time: '12:45', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', unread: 2 },
  { id: 3, name: 'Elena', lastMessage: 'That sounds fun!', time: 'Yesterday', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100', unread: 0 },
];

const Chats = () => {
  const navigate = useNavigate();

  return (
    <div className="chats-container fade-in">
      <div className="chats-header">
        <h1>Messages</h1>
      </div>
      
      <div className="matches-section">
        <h3>New Matches</h3>
        <div className="matches-list">
          <div className="match-item new">
            <div className="match-avatar-ring">
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" alt="New match" />
            </div>
            <span>Sarah</span>
          </div>
        </div>
      </div>

      <div className="chats-list">
        {DUMMY_CHATS.map(chat => (
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
