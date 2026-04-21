import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MapPin, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProfile, getPotentialMatches, likeUser } from '../lib/api';
import { useTelegram } from '../hooks/useTelegram';
import MatchOverlay from '../components/MatchOverlay';
import './Home.css';

const Home = () => {
  const { tg, user } = useTelegram();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (user?.id) fetchUsers();
  }, [user?.id]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. Get my profile to know my gender and intentions
      const myProfile = await getProfile(user.id);

      if (!myProfile) {
        navigate('/register');
        return;
      }

      // 2. Fetch potential matches: opposite gender
      const data = await getPotentialMatches(user.id, myProfile.gender);

      // 3. Filter and Sort
      // Priority to shared intentions
      const sorted = (data || []).sort((a, b) => {
        const sharedA = a.intentions?.filter(i => myProfile.intentions.includes(i)).length || 0;
        const sharedB = b.intentions?.filter(i => myProfile.intentions.includes(i)).length || 0;
        return sharedB - sharedA;
      });

      setUsers(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    const target = users[currentIndex];
    if (!target) return;

    tg.HapticFeedback.impactOccurred('medium');

    if (direction === 'right') {
      const result = await likeUser(user.id, target.id);

      if (result.isMatch) {
        // MATCH!
        setMatchedUser({...target, matchId: result.match.id});
        setShowMatch(true);
      }
    }

    setCurrentIndex(prev => prev + 1);
    setPhotoIndex(0);
  };

  const currentUser = users[currentIndex];

  if (loading) return <div className="loading-state"><div className="loader" /></div>;

  return (
    <div className="home-page">
      <div className="swipe-container">
        <AnimatePresence>
          {currentUser ? (
            <motion.div
              key={currentUser.id}
              className="swipe-card"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) handleSwipe('right');
                else if (info.offset.x < -100) handleSwipe('left');
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ 
                x: currentIndex % 2 === 0 ? 500 : -500, 
                opacity: 0, 
                rotate: currentIndex % 2 === 0 ? 20 : -20 
              }}
            >
              <div className="card-images-container">
                <img 
                  src={currentUser.photos[photoIndex]} 
                  className="card-image" 
                  alt={currentUser.full_name} 
                  onClick={() => navigate(`/user/${currentUser.id}`)}
                />
                
                <div className="photo-dots">
                  {currentUser.photos.map((_, i) => (
                    <div key={i} className={`photo-dot ${i === photoIndex ? 'active' : ''}`} />
                  ))}
                </div>

                <div 
                  className="photo-tap-area photo-tap-left" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex(prev => Math.max(0, prev - 1));
                  }} 
                />
                <div 
                  className="photo-tap-area photo-tap-right" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex(prev => Math.min(currentUser.photos.length - 1, prev + 1));
                  }} 
                />
              </div>

              <div className="card-info">
                <h2 className="card-title">{currentUser.full_name}, {currentUser.age}</h2>
                <div className="card-subtitle">
                  <MapPin size={16} /> {currentUser.city}
                </div>
                <div className="card-tags">
                  {currentUser.interests.slice(0, 3).map(tag => (
                    <span key={tag} className="card-tag">{tag}</span>
                  ))}
                  {currentUser.interests.length > 3 && <span className="card-tag">+{currentUser.interests.length - 3}</span>}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="empty-state fade-in">
              <h1>Люди закончились</h1>
              <p>Заходите позже!</p>
              <button className="btn-premium" onClick={() => setCurrentIndex(0)}>Сначала</button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {currentUser && (
        <div className="home-actions">
          <button className="action-btn dislike" onClick={() => handleSwipe('left')}>
            <X size={32} />
          </button>
          <button className="action-btn like" onClick={() => handleSwipe('right')}>
            <Heart size={32} fill="white" />
          </button>
        </div>
      )}

      {showMatch && (
        <MatchOverlay 
          user={matchedUser} 
          onClose={() => setShowMatch(false)} 
          onChat={() => navigate(`/chat/${matchedUser.matchId}`)}
        />
      )}
    </div>
  );
};

export default Home;
