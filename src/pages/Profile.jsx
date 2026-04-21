import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';
import { Settings, Edit2, Shield, HelpCircle, MapPin, Check, X, Eye } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { tg, user } = useTelegram();
  const [dbProfile, setDbProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (!error && data) {
      setDbProfile(data);
      setEditData(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editData.full_name,
        age: parseInt(editData.age),
        city: editData.city,
        bio: editData.bio
      })
      .eq('id', user.id);

    if (!error) {
      setDbProfile(editData);
      setIsEditing(false);
      tg.showAlert('Профиль успешно обновлен!');
    }
    setLoading(false);
  };

  if (loading && !dbProfile) {
    return <div className="loading-state"><div className="loader"></div></div>;
  }

  if (showPreview) {
    return (
      <div className="profile-preview-overlay fade-in">
        <button className="close-preview" onClick={() => setShowPreview(false)}><X size={24}/></button>
        <div className="preview-card-container">
          <div className="swipe-card" style={{ position: 'relative' }}>
            <img src={dbProfile.avatar_url} className="card-image" alt="Preview" />
            <div className="card-overlay-gradient" />
            <div className="card-content-premium">
              <div className="name-age-row">
                <h2>{dbProfile.full_name}, {dbProfile.age}</h2>
                <div className="verified-badge">✓</div>
              </div>
              <div className="location-row"><MapPin size={14} /><span>{dbProfile.city}</span></div>
              <div className="intentions-tags-premium">
                {dbProfile.intentions?.map(t => <span key={t} className="tag-premium">{t}</span>)}
              </div>
              <p className="card-bio-snippet">{dbProfile.bio}</p>
            </div>
          </div>
        </div>
        <p className="preview-hint">Так вашу анкету видят другие пользователи</p>
      </div>
    );
  }

  return (
    <div className="profile-page fade-in">
      <div className="profile-header-premium">
        <div className="avatar-wrapper-premium">
          <img src={dbProfile.avatar_url} alt="Profile" className="profile-avatar-large" />
          <button className="preview-btn" onClick={() => setShowPreview(true)}>
            <Eye size={20} />
          </button>
        </div>
        
        {isEditing ? (
          <div className="edit-form-premium">
            <input 
              type="text" 
              value={editData.full_name} 
              onChange={e => setEditData({...editData, full_name: e.target.value})}
              className="edit-input-name"
            />
            <div className="edit-row">
              <input 
                type="number" 
                value={editData.age} 
                onChange={e => setEditData({...editData, age: e.target.value})}
                className="edit-input-small"
              />
              <input 
                type="text" 
                value={editData.city} 
                onChange={e => setEditData({...editData, city: e.target.value})}
                className="edit-input-city"
              />
            </div>
            <textarea 
              value={editData.bio} 
              onChange={e => setEditData({...editData, bio: e.target.value})}
              className="edit-input-bio"
            />
            <div className="edit-actions">
              <button className="save-btn" onClick={handleSave}><Check size={20} /> Сохранить</button>
              <button className="cancel-btn" onClick={() => setIsEditing(false)}><X size={20} /> Отмена</button>
            </div>
          </div>
        ) : (
          <div className="profile-info-premium">
            <h1 className="profile-name-large">{dbProfile.full_name}, {dbProfile.age}</h1>
            <p className="profile-city-large"><MapPin size={16} /> {dbProfile.city}</p>
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} /> Редактировать профиль
            </button>
          </div>
        )}
      </div>

      <div className="profile-menu-premium">
        <div className="menu-group">
          <div className="menu-item-premium">
            <Shield size={20} />
            <span>Приватность и безопасность</span>
          </div>
          <div className="menu-item-premium">
            <Settings size={20} />
            <span>Настройки аккаунта</span>
          </div>
          <div className="menu-item-premium">
            <HelpCircle size={20} />
            <span>Служба поддержки</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
