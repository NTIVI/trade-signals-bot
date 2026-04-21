import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Image, Smile } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';
import './ChatDetail.css';

const ChatDetail = () => {
  const { id } = useParams();
  const { user } = useTelegram();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchOtherUser();

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `match_id=eq.${id}`
      }, (payload) => {
        setMessages(prev => [...prev, {
          id: payload.new.id,
          text: payload.new.content,
          sender: payload.new.sender_id === user.id ? 'me' : 'them',
          time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data.map(m => ({
        id: m.id,
        text: m.content,
        sender: m.sender_id === user.id ? 'me' : 'them',
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    }
  };

  const fetchOtherUser = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        user_1 (id, full_name, avatar_url),
        user_2 (id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (!error && data) {
      const other = data.user_1.id === user.id ? data.user_2 : data.user_1;
      setOtherUser(other);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: id,
        sender_id: user.id,
        content: message
      });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setMessage('');
    }
  };

  return (
    <div className="chat-detail-container">
      <div className="chat-header">
        <button onClick={() => navigate('/chats')} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <div className="chat-user-info">
          <img src={otherUser?.avatar_url || 'https://via.placeholder.com/40'} alt={otherUser?.full_name} className="header-avatar" />
          <div className="header-text">
            <h3>{otherUser?.full_name || 'Загрузка...'}</h3>
            <span>В сети</span>
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
            placeholder="Сообщение..." 
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
