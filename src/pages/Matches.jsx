import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';
import { Heart } from 'lucide-react';
import './Matches.css';

const Matches = () => {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchMatches();
  }, [user?.id]);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          user_1 (id, full_name, avatar_url),
          user_2 (id, full_name, avatar_url)
        `)
        .or(`user_1.eq.${user.id},user_2.eq.${user.id}`);

      if (error) throw error;

      const formatted = data.map(m => m.user_1.id === user.id ? m.user_2 : m.user_1);
      setMatches(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state"><div className="loader" /></div>;

  return (
    <div className="matches-page fade-in">
      <h1 className="page-header">Мои матчи</h1>
      
      {matches.length > 0 ? (
        <div className="matches-grid">
          {matches.map(m => (
            <div 
              key={m.id} 
              className="match-card"
              onClick={() => navigate(`/user/${m.id}`)}
            >
              <img src={m.avatar_url} alt="" />
              <div className="match-card-overlay">
                <span>{m.full_name}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Heart size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p>Пока нет взаимных лайков</p>
          <button className="btn-premium" onClick={() => navigate('/')} style={{ marginTop: 24 }}>Начать поиск</button>
        </div>
      )}
    </div>
  );
};

export default Matches;
