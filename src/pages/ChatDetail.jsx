import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Image, Smile } from 'lucide-react';
import './ChatDetail.css';

const ChatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hey there!', sender: 'them', time: '12:45' },
    { id: 2, text: 'Hi Anna, how are you?', sender: 'me', time: '12:46' },
    { id: 3, text: 'I am doing great, just saw your profile!', sender: 'them', time: '12:47' },
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMessage]);
    setMessage('');
  };

  return (
    <div className="chat-detail-container">
      <div className="chat-header">
        <button onClick={() => navigate('/chats')} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <div className="chat-user-info">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Anna" className="header-avatar" />
          <div className="header-text">
            <h3>Anna</h3>
            <span>Online</span>
          </div>
        </div>
      </div>

      <div className="messages-list">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.sender}`}>
            <div className="bubble-content">
              <p>{msg.text}</p>
              <span className="msg-time">{msg.time}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <button className="input-icon-btn"><Image size={20} /></button>
        <div className="input-wrapper">
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="input-icon-btn"><Smile size={20} /></button>
        </div>
        <button className={`send-btn ${message.trim() ? 'active' : ''}`} onClick={handleSend}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatDetail;
