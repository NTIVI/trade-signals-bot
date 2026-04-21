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
          It's a Match!
        </motion.h1>
        
        <p>You and {user.name} have liked each other.</p>

        <div className="match-avatars">
          <div className="avatar-left">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" alt="Me" />
          </div>
          <div className="avatar-right">
            <img src={user.photo} alt={user.name} />
          </div>
        </div>

        <div className="match-actions">
          <button className="send-msg-btn" onClick={onChat}>
            <MessageCircle size={20} />
            Send a Message
          </button>
          <button className="keep-swiping-btn" onClick={onClose}>
            Keep Swiping
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
