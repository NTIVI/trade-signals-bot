import React from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { Settings, Edit2, Shield, HelpCircle } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user } = useTelegram();

  const stats = [
    { label: 'Likes', value: '124' },
    { label: 'Matches', value: '12' },
    { label: 'Views', value: '450' },
  ];

  return (
    <div className="profile-container fade-in">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <img 
            src={user?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'} 
            alt="Profile" 
            className="profile-avatar"
          />
          <button className="edit-btn">
            <Edit2 size={16} />
          </button>
        </div>
        <h1 className="profile-name">{user?.first_name || 'Alex'}, 24</h1>
        <p className="profile-status">Looking for: Dating, Friendship</p>
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
          <span>Account Settings</span>
        </div>
        <div className="menu-item">
          <Shield size={20} />
          <span>Privacy & Safety</span>
        </div>
        <div className="menu-item">
          <HelpCircle size={20} />
          <span>Help Center</span>
        </div>
      </div>

      <button className="logout-btn">Log Out</button>
    </div>
  );
};

export default Profile;
