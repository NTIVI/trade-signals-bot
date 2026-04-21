import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, MessageCircle, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';
import './UserProfile.css';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tg, user: me } = useTelegram();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ likes: 0, chats: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // 1. Fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);

      // 2. Fetch stats
      // Likes received
      const { count: likes } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('to_user', id);

      // Matches (chats)
      const { count: chats } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user_1.eq.${id},user_2.eq.${id}`);

      setStats({ likes: likes || 0, chats: chats || 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    tg.HapticFeedback.impactOccurred('medium');
    
    // Logic for mutual like check (similar to Home.jsx)
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('from_user', id)
      .eq('to_user', me.id)
      .single();

    await supabase.from('likes').upsert({ from_user: me.id, to_user: id });

    if (existingLike) {
      const { data: matchData } = await supabase
        .from('matches')
        .upsert({ user_1: me.id, user_2: id })
        .select()
        .single();
        
      tg.showAlert('Это взаимно! Чат открыт.');
      navigate(`/chat/${matchData.id}`);
    } else {
      tg.showAlert('Лайк отправлен!');
    }
  };

  if (loading) return <div className="loading-state"><div className="loader" /></div>;
  if (!profile) return <div>Профиль не найден</div>;

  return (
    <div className="user-profile-page fade-in">
      <button className="back-btn-float glass" onClick={() => navigate(-1)}>
        <ChevronLeft size={24} />
      </button>

      <div className="profile-photos-slider">
        {profile.photos?.map((photo, i) => (
          <div key={i} className="profile-slide">
            <img src={photo} alt={`${profile.full_name} ${i}`} />
          </div>
        ))}
      </div>

      <div className="profile-details">
        <h1 className="profile-name-xl">{profile.full_name}, {profile.age}</h1>
        <p className="profile-city-xl"><MapPin size={18} /> {profile.city}</p>

        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.likes}</div>
            <div className="stat-label">Лайков</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.chats}</div>
            <div className="stat-label">Чатов</div>
          </div>
        </div>

        <div className="profile-section">
          <h3 className="section-title">Намерения</h3>
          <div className="profile-interests">
            {profile.intentions?.map(i => (
              <span key={i} className="interest-badge" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                {i === 'serious' ? '❤️ Серьёзные' : i === 'dating' ? '✨ Свидания' : i === 'chat' ? '💬 Общение' : '🤝 Дружба'}
              </span>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <h3 className="section-title">О себе</h3>
          <p className="profile-bio">{profile.bio || 'Пользователь не оставил описание'}</p>
        </div>

        <div className="profile-section">
          <h3 className="section-title">Интересы</h3>
          <div className="profile-interests">
            {profile.interests?.map(tag => (
              <span key={tag} className="interest-badge">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="profile-actions-fixed">
        <button className="btn-premium" onClick={handleLike}>
          <Heart size={20} fill="white" style={{ marginRight: 8 }} /> Лайкнуть
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
