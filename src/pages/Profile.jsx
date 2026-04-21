import React, { useEffect, useState } from 'react';
import { getProfile, saveProfile } from '../lib/api';
import { useTelegram } from '../hooks/useTelegram';
import { Settings, Edit2, MapPin, Check, X, Eye, Camera, Plus } from 'lucide-react';
import './UserProfile.css'; // Reuse profile styles

const Profile = () => {
  const { tg, user } = useTelegram();
  const [dbProfile, setDbProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfile(user?.id);
      
      if (data) {
        setDbProfile(data);
        setEditData(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedProfile = await saveProfile({
        id: user.id,
        full_name: editData.full_name,
        age: parseInt(editData.age),
        city: editData.city,
        bio: editData.bio,
        interests: editData.interests,
        intentions: editData.intentions,
        avatar_url: editData.avatar_url,
        photos: editData.photos
      });

      setDbProfile(updatedProfile);
      setIsEditing(false);
      tg.showAlert('Профиль обновлен!');
    } catch (err) {
      console.error(err);
      tg.showAlert('Ошибка сохранения');
    }
    setLoading(false);
  };

  if (loading && !dbProfile) return <div className="loading-state"><div className="loader" /></div>;

  return (
    <div className="user-profile-page fade-in">
      <div className="profile-photos-slider">
        {dbProfile.photos?.map((photo, i) => (
          <div key={i} className="profile-slide">
            <img src={photo} alt="" />
          </div>
        ))}
      </div>

      <div className="profile-details">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>Имя</label>
              <input value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Возраст</label>
              <input type="number" value={editData.age} onChange={e => setEditData({...editData, age: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Город</label>
              <input value={editData.city} onChange={e => setEditData({...editData, city: e.target.value})} />
            </div>
            <div className="input-group">
              <label>О себе</label>
              <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-premium" onClick={handleSave}>Сохранить</button>
              <button className="btn-premium" style={{ background: '#333' }} onClick={() => setIsEditing(false)}>Отмена</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="profile-name-xl">{dbProfile.full_name}, {dbProfile.age}</h1>
            <p className="profile-city-xl"><MapPin size={18} /> {dbProfile.city}</p>
            
            <div className="profile-stats">
              <div className="stat-card">
                <div className="stat-value">{dbProfile.likes_count || 0}</div>
                <div className="stat-label">Лайков</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dbProfile.chats_count || 0}</div>
                <div className="stat-label">Чатов</div>
              </div>
            </div>

            <button className="btn-premium" style={{ background: 'var(--bg-card)', marginBottom: 24 }} onClick={() => setIsEditing(true)}>
              <Edit2 size={16} style={{ marginRight: 8 }} /> Редактировать
            </button>

            <div className="profile-section">
              <h3 className="section-title">О себе</h3>
              <p className="profile-bio">{dbProfile.bio || 'Нет описания'}</p>
            </div>

            <div className="profile-section">
              <h3 className="section-title">Интересы</h3>
              <div className="profile-interests">
                {dbProfile.interests?.map(tag => (
                  <span key={tag} className="interest-badge">{tag}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
