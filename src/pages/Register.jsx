import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { Camera, User, Heart, MessageCircle, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Register.css';

const Register = () => {
  const { tg, user } = useTelegram();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: user?.first_name || '',
    age: '',
    gender: '',
    intentions: [],
    avatar: user?.photo_url || null,
  });

  const intentionsList = [
    { id: 'serious', label: 'Серьёзные отношения', icon: <Heart size={20} /> },
    { id: 'dating', label: 'Свидания', icon: <Star size={20} /> },
    { id: 'friendship', label: 'Дружба', icon: <User size={20} /> },
    { id: 'chat', label: 'Просто общение', icon: <MessageCircle size={20} /> },
    { id: 'adult', label: '18+ Знакомства', icon: <Star size={20} fill="currentColor" /> },
    { id: 'casual', label: 'Свободные отношения', icon: <Heart size={20} strokeDasharray="4 4" /> },
    { id: 'event', label: 'Пойти на ивент', icon: <User size={20} strokeWidth={3} /> },
    { id: 'travel', label: 'Поиск попутчика', icon: <MessageCircle size={20} strokeWidth={1} /> },
  ];

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      if (!formData.avatar) {
        tg.showAlert('Пожалуйста, загрузите аватарку!');
        return;
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user?.id,
            username: user?.username,
            full_name: formData.name,
            avatar_url: formData.avatar,
            age: parseInt(formData.age),
            gender: formData.gender,
            intentions: formData.intentions,
          });

        if (error) throw error;

        localStorage.setItem('registered', 'true');
        navigate('/');
      } catch (error) {
        console.error('Error saving profile:', error);
        tg.showAlert('Ошибка при сохранении профиля: ' + error.message);
      }
    }
  };

  const toggleIntention = (id) => {
    setFormData(prev => ({
      ...prev,
      intentions: prev.intentions.includes(id)
        ? prev.intentions.filter(i => i !== id)
        : [...prev.intentions, id]
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="register-container fade-in">
      <div className="register-header">
        <h1>{step === 1 ? 'Что вы ищете?' : step === 2 ? 'О себе' : 'Почти готово!'}</h1>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>
      </div>

      <div className="register-content">
        {step === 1 && (
          <div className="intentions-grid">
            {intentionsList.map(item => (
              <div 
                key={item.id} 
                className={`intention-card ${formData.intentions.includes(item.id) ? 'active' : ''}`}
                onClick={() => toggleIntention(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="basic-info">
            <div className="input-group">
              <label>Имя</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ваше имя"
              />
            </div>
            <div className="input-group">
              <label>Возраст</label>
              <input 
                type="number" 
                value={formData.age} 
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                placeholder="20"
              />
            </div>
            <div className="input-group">
              <label>Пол</label>
              <div className="gender-selector">
                <button 
                  className={formData.gender === 'male' ? 'active' : ''} 
                  onClick={() => setFormData({...formData, gender: 'male'})}
                >Мужской</button>
                <button 
                  className={formData.gender === 'female' ? 'active' : ''} 
                  onClick={() => setFormData({...formData, gender: 'female'})}
                >Женский</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="avatar-upload">
            <div className="avatar-preview">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">
                  <Camera size={48} color="var(--tg-hint-color)" />
                </div>
              )}
            </div>
            <label className="upload-btn">
              <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
              {formData.avatar ? 'Изменить фото' : 'Загрузить фото'}
            </label>
            <p className="hint">Аватарка обязательна для вступления в сообщество.</p>
          </div>
        )}
      </div>

      <button className="next-btn" onClick={handleNext}>
        {step === 3 ? 'Готово' : 'Далее'}
      </button>
    </div>
  );
};

export default Register;
