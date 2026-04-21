import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';
import { Settings, Edit2, Shield, HelpCircle } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user } = useTelegram();
  const [stats, setStats] = useState([
    { label: 'Лайки', value: '0' },
    { label: 'Пары', value: '0' },
    { label: 'Просмотры', value: '0' },
  ]);
  const [dbProfile, setDbProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (!error && data) setDbProfile(data);
  };

  const fetchStats = async () => {
    // This is a simplified example. In a real app, you'd use RPC or count queries.
    const { count: likesCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('to_user', user?.id);

    const { count: matchesCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .or(`user_1.eq.${user?.id},user_2.eq.${user?.id}`);

    setStats([
      { label: 'Лайки', value: likesCount || 0 },
      { label: 'Пары', value: matchesCount || 0 },
      { label: 'Просмотры', value: '0' },
    ]);
  };

  return (
    <div className="profile-container fade-in">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <img 
            src={dbProfile?.avatar_url || user?.photo_url || 'https://via.placeholder.com/120'} 
            alt="Profile" 
            className="profile-avatar"
          />
          <button className="edit-btn">
            <Edit2 size={16} />
          </button>
        </div>
        <h1 className="profile-name">{dbProfile?.full_name || user?.first_name}, {dbProfile?.age}</h1>
        <p className="profile-status">Ищу: {dbProfile?.intentions?.join(', ')}</p>
      </div>

      <div className="stats-row">
        {stats.map(stat => (
          <div key={stat.label} className="stat-card">
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="menu-list">
        <div className="menu-item">
          <Settings size={20} />
          <span>Настройки аккаунта</span>
        </div>
        <div className="menu-item">
          <Shield size={20} />
          <span>Приватность</span>
        </div>
        <div className="menu-item">
          <HelpCircle size={20} />
          <span>Центр помощи</span>
        </div>
      </div>

      <button className="logout-btn">Выйти</button>
    </div>
  );
};

export default Profile;
