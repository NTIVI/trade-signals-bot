import React from 'react';
import { motion } from 'framer-motion';
import './MatchOverlay.css';

const MatchOverlay = ({ user, onClose, onChat }) => {
  return (
    <motion.div 
      className="match-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="match-content">
        <motion.h1 
          initial={{ scale: 0.5, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          className="match-title"
        >
          ЭТО МАТЧ!
        </motion.h1>
        <p className="match-subtitle">Вы понравились друг другу с {user.full_name}</p>
        
        <div className="match-avatars">
          <div className="match-avatar-circle">
            <img src={user.avatar_url} alt="" />
          </div>
        </div>

        <div className="match-buttons">
          <button className="btn-premium" onClick={onChat}>Написать сообщение</button>
          <button className="btn-skip" onClick={onClose}>Продолжить свайпать</button>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchOverlay;
