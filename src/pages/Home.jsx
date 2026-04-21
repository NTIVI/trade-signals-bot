import { Heart, X, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';
import MatchOverlay from '../components/MatchOverlay';
import './Home.css';

const DUMMY_USERS = [
  { id: 1, name: 'Анна', age: 22, intentions: ['свидания', 'дружба'], photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500' },
  { id: 2, name: 'Марк', age: 25, intentions: ['серьёзные отношения'], photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500' },
  { id: 3, name: 'Елена', age: 24, intentions: ['свидания'], photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500' },
  { id: 4, name: 'Алекс', age: 28, intentions: ['общение'], photo: 'https://images.unsplash.com/photo-1492562080023-ab3dbdf5bb3d?w=500' },
];

const Home = ({ onChat }) => {
  const { user } = useTelegram();
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    const targetUser = users[currentIndex];
    console.log(`Swiped ${direction} on ${targetUser.full_name}`);
    
    if (direction === 'right') {
      // Save like and check for match
      try {
        const { data: existingLike, error: matchError } = await supabase
          .from('likes')
          .select('*')
          .eq('from_user', targetUser.id)
          .eq('to_user', user.id)
          .single();

        await supabase
          .from('likes')
          .insert({ from_user: user.id, to_user: targetUser.id });

        if (existingLike) {
          // It's a match!
          await supabase
            .from('matches')
            .insert({ user_1: user.id, user_2: targetUser.id });
          
          setMatchedUser({
            name: targetUser.full_name,
            photo: targetUser.avatar_url
          });
          setShowMatch(true);
        }
      } catch (error) {
        console.error('Error saving like:', error);
      }
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
              <img src={currentUser.avatar_url} alt={currentUser.full_name} className="card-image" />
              <div className="card-info">
                <div className="card-header">
                  <h2>{currentUser.full_name}, {currentUser.age}</h2>
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
              <h2>Люди закончились!</h2>
              <p>Попробуйте изменить настройки фильтра или загляните позже.</p>
              <button className="reset-btn" onClick={() => setCurrentIndex(0)}>Обновить</button>
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
