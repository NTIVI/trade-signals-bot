import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import { getMatchDetail, getMessages, socket } from '../lib/api';
import { useTelegram } from '../hooks/useTelegram';
import './ChatDetail.css';

const ChatDetail = () => {
  const { id } = useParams(); // match_id
  const { user } = useTelegram();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const scrollRef = useRef();

  useEffect(() => {
    if (id) {
      fetchData();
      
      socket.emit('join_chat', id);
      
      const handleReceive = (newMsg) => {
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      };
      
      socket.on('receive_message', handleReceive);

      return () => {
        socket.off('receive_message', handleReceive);
      };
    }
  }, [id]);

  const fetchData = async () => {
    try {
      // 1. Get other user info
      const match = await getMatchDetail(id);

      if (match) {
        const other = match.u1_id === user.id ? 
          { id: match.u2_id, full_name: match.u2_name, avatar_url: match.u2_avatar } : 
          { id: match.u1_id, full_name: match.u1_name, avatar_url: match.u1_avatar };
        setOtherUser(other);
      }

      // 2. Get existing messages
      const msgs = await getMessages(id);
      if (msgs) setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch(err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const msgText = message;
    setMessage('');

    socket.emit('send_message', {
        match_id: id,
        sender_id: user.id,
        content: msgText
    });
  };

  return (
    <div className="chat-detail-page">
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white' }}>
          <ChevronLeft />
        </button>
        <img src={otherUser?.avatar_url} className="header-avatar" alt="" />
        <span className="header-name">{otherUser?.full_name || 'Загрузка...'}</span>
      </div>

      <div className="messages-area">
        {messages.map((m, i) => (
          <div key={i} className={`msg-bubble ${m.sender_id === user.id ? 'me' : 'them'}`}>
            {m.content}
            <span className="msg-time">
              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="chat-input-container">
        <input 
          className="chat-input" 
          placeholder="Cообщение..." 
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
        />
        <button className="send-btn" onClick={handleSend}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatDetail;
