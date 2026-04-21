import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
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
      const subscription = subscribeToMessages();
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [id]);

  const fetchData = async () => {
    // 1. Get other user info
    const { data: match } = await supabase
      .from('matches')
      .select(`
        user_1 (id, full_name, avatar_url),
        user_2 (id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (match) {
      const other = match.user_1.id === user.id ? match.user_2 : match.user_1;
      setOtherUser(other);
    }

    // 2. Get existing messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', id)
      .order('created_at', { ascending: true });

    if (msgs) setMessages(msgs);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const subscribeToMessages = () => {
    return supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `match_id=eq.${id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const msgText = message;
    setMessage('');

    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: id,
        sender_id: user.id,
        content: msgText
      });

    if (error) {
      console.error(error);
      setMessage(msgText);
    }
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
