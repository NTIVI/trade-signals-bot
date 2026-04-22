import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { Camera, User, Heart, MessageCircle, Star, MapPin, Globe, Calendar, Hash, Plus, Check } from 'lucide-react';
import { saveProfile, api } from '../lib/api';
import './Register.css';

const Register = () => {
  const { tg, user } = useTelegram();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.first_name || '',
    gender: '',
    age: '',
    city: '',
    bio: '',
    intentions: [],
    interests: [],
    mainPhoto: null,
    extraPhotos: [null, null, null], // Exactly 3 required extras
  });

  const intentionsList = [
    { id: 'friendship', label: 'Дружба', icon: '🤝' },
    { id: 'chat', label: 'Общение', icon: '💬' },
    { id: 'dating', label: 'Свидания', icon: '✨' },
    { id: 'serious', label: 'Серьёзные отношения', icon: '❤️' },
  ];

  const interestsList = [
    'Музыка', 'Кино', 'Путешествия', 'Спорт', 'Искусство', 
    'Игры', 'Кулинария', 'Чтение', 'Технологии', 'Природа',
    'Танцы', 'Фотография', 'Мода', 'Авто', 'Бизнес'
  ];

  useEffect(() => {
    tg.MainButton.setParams({
      text: step === 4 ? 'ЗАВЕРШИТЬ' : 'ПРОДОЛЖИТЬ',
      color: '#ff2d55',
      is_visible: true
    });

    const handleMainButton = () => handleNext();
    tg.onEvent('mainButtonClicked', handleMainButton);
    return () => {
      tg.offEvent('mainButtonClicked', handleMainButton);
      tg.MainButton.hide();
    };
  }, [step, formData]);

  const handleNext = async () => {
    if (step === 1) {
      if (formData.intentions.length === 0) {
        tg.showAlert('Выберите хотя бы одно намерение');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.name || !formData.gender || !formData.age || !formData.city) {
        tg.showAlert('Заполните все обязательные поля');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (formData.interests.length < 3) {
        tg.showAlert('Выберите хотя бы 3 интереса');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      const extraCount = formData.extraPhotos.filter(p => p !== null).length;
      if (!formData.mainPhoto || extraCount < 3) {
        tg.showAlert('Загрузите главную аватарку и минимум 3 доп. фото');
        return;
      }
      submitProfile();
    }
  };

  const submitProfile = async () => {
    setLoading(true);
    tg.MainButton.showProgress();
    
    try {
      const allPhotos = [formData.mainPhoto, ...formData.extraPhotos.filter(p => p !== null)];
      
      await saveProfile({
          id: user.id,
          username: user.username,
          full_name: formData.name,
          gender: formData.gender,
          age: parseInt(formData.age),
          city: formData.city,
          bio: formData.bio,
          intentions: formData.intentions,
          interests: formData.interests,
          avatar_url: formData.mainPhoto,
          photos: allPhotos,
      });

      tg.HapticFeedback.notificationOccurred('success');
      navigate('/');
    } catch (err) {
      tg.showAlert('Ошибка сохранения: ' + err.message + ' | URL: ' + api.defaults.baseURL);
    } finally {
      setLoading(false);
      tg.MainButton.hideProgress();
    }
  };

  const handlePhotoUpload = (e, index = -1) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimensions
        const MAX_SIZE = 1000;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress and convert to base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        if (index === -1) {
          setFormData({ ...formData, mainPhoto: compressedBase64 });
        } else {
          const newExtras = [...formData.extraPhotos];
          newExtras[index] = compressedBase64;
          setFormData({ ...formData, extraPhotos: newExtras });
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="register-page">
      <div className="onboarding-step fade-in">
        {step === 1 && (
          <>
            <h1 className="step-title">Что вы ищете?</h1>
            <p className="step-subtitle">Можно выбрать несколько вариантов</p>
            <div className="intentions-grid">
              {intentionsList.map(item => (
                <button 
                  key={item.id}
                  className={`intention-card ${formData.intentions.includes(item.id) ? 'active' : ''}`}
                  onClick={() => {
                    const next = formData.intentions.includes(item.id)
                      ? formData.intentions.filter(i => i !== item.id)
                      : [...formData.intentions, item.id];
                    setFormData({ ...formData, intentions: next });
                  }}
                >
                  <span className="intention-icon">{item.icon}</span>
                  <span className="intention-label">{item.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="step-title">О себе</h1>
            <div className="gender-selector">
              <button 
                className={`gender-btn ${formData.gender === 'male' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, gender: 'male' })}
              >Мужчина</button>
              <button 
                className={`gender-btn ${formData.gender === 'female' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, gender: 'female' })}
              >Девушка</button>
            </div>
            <div className="input-group">
              <label>Имя</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Возраст</label>
              <input 
                type="number" 
                value={formData.age} 
                onChange={e => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Город</label>
              <input 
                type="text" 
                value={formData.city} 
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Коротко о себе</label>
              <textarea 
                value={formData.bio} 
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="step-title">Интересы</h1>
            <p className="step-subtitle">Выберите минимум 3 интереса</p>
            <div className="interests-grid">
              {interestsList.map(tag => (
                <button 
                  key={tag}
                  className={`interest-tag ${formData.interests.includes(tag) ? 'active' : ''}`}
                  onClick={() => {
                    const next = formData.interests.includes(tag)
                      ? formData.interests.filter(t => t !== tag)
                      : [...formData.interests, tag];
                    setFormData({ ...formData, interests: next });
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="step-title">Фотографии</h1>
            <p className="step-subtitle">Главная аватарка + 3 доп. фото</p>
            <div className="photos-grid">
              <div className="main-photo-upload" onClick={() => document.getElementById('mainPhoto').click()}>
                {formData.mainPhoto ? (
                  <img src={formData.mainPhoto} className="photo-preview" />
                ) : (
                  <div className="upload-placeholder"><Camera size={48} /></div>
                )}
                <input id="mainPhoto" type="file" hidden onChange={e => handlePhotoUpload(e)} />
              </div>
              
              {formData.extraPhotos.map((p, i) => (
                <div key={i} className="extra-photo-upload" onClick={() => document.getElementById(`extra-${i}`).click()}>
                  {p ? (
                    <img src={p} className="photo-preview" />
                  ) : (
                    <Plus size={32} />
                  )}
                  <input id={`extra-${i}`} type="file" hidden onChange={e => handlePhotoUpload(e, i)} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
