import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Info } from 'lucide-react';
import MatchOverlay from '../components/MatchOverlay';
import './Home.css';

const DUMMY_USERS = [
  { id: 1, name: 'Anna', age: 22, intentions: ['dating', 'friendship'], photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500' },
  { id: 2, name: 'Mark', age: 25, intentions: ['serious'], photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500' },
  { id: 3, name: 'Elena', age: 24, intentions: ['dating'], photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500' },
  { id: 4, name: 'Alex', age: 28, intentions: ['chat'], photo: 'https://images.unsplash.com/photo-1492562080023-ab3dbdf5bb3d?w=500' },
];

const Home = ({ onChat }) => {
  const [users, setUsers] = useState(DUMMY_USERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);

  const handleSwipe = (direction) => {
    console.log(`Swiped ${direction} on ${users[currentIndex].name}`);
    
    // Simulate a match if swiped right on the first user
    if (direction === 'right' && currentIndex === 0) {
      setMatchedUser(users[currentIndex]);
      setShowMatch(true);
    }

    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // End of stack
      setCurrentIndex(-1);
    }
  };

  const currentUser = currentIndex !== -1 ? users[currentIndex] : null;

  return (
    <div className="home-container">
      <div className="card-stack">
        <AnimatePresence>
          {currentUser ? (
            <motion.div
              key={currentUser.id}
              className="swipe-card"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = offset.x;
                if (swipe > 100) handleSwipe('right');
                else if (swipe < -100) handleSwipe('left');
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ 
                x: window.innerWidth * (Math.random() > 0.5 ? 1 : -1), 
                opacity: 0, 
                rotate: 20 
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <img src={currentUser.photo} alt={currentUser.name} className="card-image" />
              <div className="card-info">
                <div className="card-header">
                  <h2>{currentUser.name}, {currentUser.age}</h2>
                  <button className="info-btn"><Info size={20} /></button>
                </div>
                <div className="intentions-tags">
                  {currentUser.intentions.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="empty-state">
              <h2>No more users in your area!</h2>
              <p>Try changing your preferences or check back later.</p>
              <button className="reset-btn" onClick={() => setCurrentIndex(0)}>Refresh</button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {currentUser && (
        <div className="action-buttons">
          <button className="action-btn skip" onClick={() => handleSwipe('left')}>
            <X size={32} />
          </button>
          <button className="action-btn like" onClick={() => handleSwipe('right')}>
            <Heart size={32} fill="white" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {showMatch && (
          <MatchOverlay 
            user={matchedUser} 
            onClose={() => setShowMatch(false)} 
            onChat={onChat}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
