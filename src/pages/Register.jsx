import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { Camera, User, Heart, MessageCircle, Star, MapPin, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Register.css';

const Register = () => {
  const { tg, user } = useTelegram();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.first_name || '',
    age: '',
    gender: '',
    intentions: [],
    avatar: user?.photo_url || null,
    city: '',
    country: '',
    bio: '',
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

  useEffect(() => {
    tg.MainButton.setParams({
      text: step === 3 ? 'ГОТОВО' : 'ДАЛЕЕ',
      color: '#ff0055',
      text_color: '#ffffff',
      is_visible: true
    });

    const handleMainButtonClick = () => {
      handleNext();
    };

    tg.onEvent('mainButtonClicked', handleMainButtonClick);
    return () => {
      tg.offEvent('mainButtonClicked', handleMainButtonClick);
      tg.MainButton.hide();
    };
  }, [step, formData]);

  const handleNext = async () => {
    if (step < 3) {
      if (step === 2 && (!formData.name || !formData.age || !formData.gender || !formData.city || !formData.country)) {
        tg.showAlert('Пожалуйста, заполните все основные поля!');
        return;
      }
      tg.HapticFeedback.impactOccurred('light');
      setStep(step + 1);
    } else {
      if (!formData.avatar) {
        tg.showAlert('Пожалуйста, загрузите фото!');
        return;
      }

      setLoading(true);
      tg.MainButton.showProgress();
      try {
        const ageInt = parseInt(formData.age);
        if (isNaN(ageInt)) throw new Error('Возраст должен быть числом');

        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user?.id,
            username: user?.username,
            full_name: formData.name,
            avatar_url: formData.avatar,
            age: ageInt,
            gender: formData.gender,
            intentions: formData.intentions,
            city: formData.city,
            country: formData.country,
            bio: formData.bio,
          });

        if (error) throw error;
        tg.HapticFeedback.notificationOccurred('success');
        localStorage.setItem('registered', 'true');
        navigate('/');
      } catch (error) {
        tg.HapticFeedback.notificationOccurred('error');
        tg.showAlert('Ошибка: ' + error.message);
      } finally {
        setLoading(false);
        tg.MainButton.hideProgress();
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
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, avatar: compressedBase64 }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="register-container fade-in">
      <div className="register-header">
        <h1>{step === 1 ? 'Что вы ищете?' : step === 2 ? 'О себе' : 'Последний штрих'}</h1>
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
          <div className="basic-info fade-in">
            <div className="input-group">
              <label><User size={14} /> Имя</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Как вас зовут?"
              />
            </div>
            <div className="input-group">
              <label>Возраст</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                placeholder="Ваш возраст"
              />
            </div>
            <div className="input-group">
              <label>Пол</label>
              <div className="gender-selector">
                <button 
                  className={formData.gender === 'male' ? 'active' : ''}
                  onClick={() => setFormData({...formData, gender: 'male'})}
                >Мужчина</button>
                <button 
                  className={formData.gender === 'female' ? 'active' : ''}
                  onClick={() => setFormData({...formData, gender: 'female'})}
                >Женщина</button>
              </div>
            </div>
            <div className="input-row" style={{ display: 'flex', gap: '10px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label><Globe size={14} /> Страна</label>
                <input 
                  type="text" 
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  placeholder="Россия"
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label><MapPin size={14} /> Город</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Москва"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="avatar-upload fade-in">
            <div className="avatar-preview">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Preview" />
              ) : (
                <Camera size={48} color="rgba(255,255,255,0.2)" />
              )}
            </div>
            <label className="upload-btn">
              Выбрать фото
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
            <div className="input-group" style={{ width: '100%', marginTop: '20px' }}>
              <label>О себе</label>
              <textarea 
                className="bio-textarea"
                style={{
                  width: '100%',
                  minHeight: '100px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '18px',
                  padding: '15px',
                  color: 'white',
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Расскажите немного о себе..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
