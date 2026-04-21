import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import './MatchOverlay.css';

const MatchOverlay = ({ user, onClose, onChat }) => {
  if (!user) return null;

  return (
    <motion.div 
      className="match-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="match-content">
        <motion.h1
          initial={{ y: -50, scale: 0.5 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          Это Мэтч!
        </motion.h1>
        
        <p>Вы и {user.full_name} понравились друг другу.</p>
        <div className="match-avatars">
          <div className="avatar-left">
            <img src={user.avatar_url} alt={user.full_name} />
          </div>
          <div className="avatar-right">
            <div className="heart-icon">❤️</div>
          </div>
        </div>

        <div className="match-actions">
          <button className="send-msg-btn" onClick={onChat}>
            <MessageCircle size={20} />
            Отправить сообщение
          </button>
          <button className="keep-swiping-btn" onClick={onClose}>
            Продолжить поиск
          </button>
        </div>

        <button className="close-overlay" onClick={onClose}>
          <X size={24} />
        </button>
      </div>
    </motion.div>
  );
};

export default MatchOverlay;
