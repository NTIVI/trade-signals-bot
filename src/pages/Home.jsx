import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Info, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';
import MatchOverlay from '../components/MatchOverlay';
import './Home.css';

const Home = ({ onChat }) => {
  const { tg, user } = useTelegram();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get my profile to know my intentions
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('intentions')
        .eq('id', user?.id)
        .single();

      const myIntentions = myProfile?.intentions || [];

      // Fetch users excluding self
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .limit(40);

      if (error) throw error;

      // Sort users: priority to those with shared intentions
      const sortedUsers = (data || []).sort((a, b) => {
        const sharedA = a.intentions?.filter(i => myIntentions.includes(i)).length || 0;
        const sharedB = b.intentions?.filter(i => myIntentions.includes(i)).length || 0;
        return sharedB - sharedA;
      });

      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    const targetUser = users[currentIndex];
    tg.HapticFeedback.impactOccurred('medium');
    
    if (direction === 'right') {
      try {
        // Check if they liked me back
        const { data: existingLike } = await supabase
          .from('likes')
          .select('*')
          .eq('from_user', targetUser.id)
          .eq('to_user', user.id)
          .single();

        // Save my like
        await supabase
          .from('likes')
          .upsert({ from_user: user.id, to_user: targetUser.id });

        if (existingLike) {
          // It's a match!
          const { data: matchData } = await supabase
            .from('matches')
            .upsert({ user_1: user.id, user_2: targetUser.id })
            .select()
            .single();

          setMatchedUser(targetUser);
          setShowMatch(true);
          
          // The user requested that chat opens after match. 
          // We show the overlay first, but the overlay "Send message" will go to the chat.
        }
      } catch (e) {
        console.error('Match error:', e);
      }
    }

    setCurrentIndex(prev => prev + 1);
  };

  const currentUser = currentIndex < users.length ? users[currentIndex] : null;

  if (loading) {
    return (
      <div className="home-container loading-state">
        <div className="loader"></div>
        <p>Ищем идеальные пары...</p>
      </div>
    );
  }

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
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <img src={currentUser.avatar_url} alt={currentUser.full_name} className="card-image" />
              
              <div className="card-overlay-gradient" />

              <div className="card-content-premium">
                <div className="card-main-info">
                  <div className="name-age-row">
                    <h2>{currentUser.full_name}, {currentUser.age}</h2>
                    <div className="verified-badge">✓</div>
                  </div>
                  <div className="location-row">
                    <MapPin size={14} />
                    <span>{currentUser.city || 'Не указан'}</span>
                  </div>
                </div>

                <div className="intentions-tags-premium">
                  {currentUser.intentions?.slice(0, 3).map(tag => (
                    <span key={tag} className="tag-premium">{tag}</span>
                  ))}
                </div>
                
                {currentUser.bio && (
                  <p className="card-bio-snippet">{currentUser.bio}</p>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="empty-state fade-in">
              <div className="empty-icon">☕</div>
              <h2>Люди закончились</h2>
              <p>Попробуйте зайти позже или изменить свои предпочтения</p>
              <button className="reload-btn" onClick={() => setCurrentIndex(0)}>Начать заново</button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {currentUser && (
        <div className="action-buttons-premium">
          <button className="action-btn skip glass" onClick={() => handleSwipe('left')}>
            <X size={32} />
          </button>
          <button className="action-btn like glass" onClick={() => handleSwipe('right')}>
            <Heart size={32} fill="white" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {showMatch && (
          <MatchOverlay 
            user={matchedUser} 
            onClose={() => setShowMatch(false)} 
            onChat={() => {
              // Get the match ID if we want to go straight to chat
              // For now, redirect to chats list or a generic chat detail
              navigate('/chats');
              setShowMatch(false);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
