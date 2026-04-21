import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { Camera, User, Heart, MessageCircle, Star, MapPin, Globe, Calendar, Hash } from 'lucide-react';
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
    birth_year: '',
    gender: '',
    intentions: [],
    interests: [],
    avatar: user?.photo_url || null,
    city: '',
    country: '',
    bio: '',
  });

  const intentionsList = [
    { id: 'serious', label: 'Серьёзные отношения', icon: <Heart size={24} /> },
    { id: 'dating', label: 'Свидания', icon: <Star size={24} /> },
    { id: 'friendship', label: 'Дружба', icon: <User size={24} /> },
    { id: 'chat', label: 'Просто общение', icon: <MessageCircle size={24} /> },
    { id: 'adult', label: '18+ Знакомства', icon: <Hash size={24} /> },
    { id: 'casual', label: 'Свободные отношения', icon: <Heart size={24} strokeDasharray="4 4" /> },
  ];

  const interestsList = [
    { id: 'music', label: 'Музыка' },
    { id: 'travel', label: 'Путешествия' },
    { id: 'sport', label: 'Спорт' },
    { id: 'movies', label: 'Кино' },
    { id: 'art', label: 'Искусство' },
    { id: 'gaming', label: 'Игры' },
    { id: 'cooking', label: 'Кулинария' },
    { id: 'reading', label: 'Чтение' },
    { id: 'tech', label: 'Технологии' },
    { id: 'nature', label: 'Природа' },
  ];

  useEffect(() => {
    tg.MainButton.setParams({
      text: step === 4 ? 'ГОТОВО' : 'ПРОДОЛЖИТЬ',
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
    if (step === 1) {
      if (formData.intentions.length === 0) {
        tg.showAlert('Выберите хотя бы одно намерение!');
        return;
      }
      tg.HapticFeedback.impactOccurred('medium');
      setStep(2);
    } else if (step === 2) {
      if (!formData.name || !formData.age || !formData.birth_year || !formData.gender || !formData.city) {
        tg.showAlert('Заполните всю информацию о себе!');
        return;
      }
      tg.HapticFeedback.impactOccurred('medium');
      setStep(3);
    } else if (step === 3) {
      if (formData.interests.length === 0) {
        tg.showAlert('Выберите хотя бы одно увлечение!');
        return;
      }
      tg.HapticFeedback.impactOccurred('medium');
      setStep(4);
    } else if (step === 4) {
      if (!formData.avatar) {
        tg.showAlert('Аватарка обязательна для регистрации!');
        return;
      }

      setLoading(true);
      tg.MainButton.showProgress();
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user?.id,
            username: user?.username,
            full_name: formData.name,
            avatar_url: formData.avatar,
            age: parseInt(formData.age),
            birth_year: parseInt(formData.birth_year),
            gender: formData.gender,
            intentions: formData.intentions,
            interests: formData.interests,
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 1000;
          let w = img.width, h = img.height;
          if (w > h) { if (w > MAX) { h *= MAX/w; w = MAX; } }
          else { if (h > MAX) { w *= MAX/h; h = MAX; } }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          setFormData({ ...formData, avatar: canvas.toDataURL('image/jpeg', 0.8) });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="register-page">
      <div className="onboarding-container">
        {step === 1 && (
          <div className="onboarding-step fade-in">
            <h1 className="title-premium">Чего вы хотите?</h1>
            <p className="subtitle-premium">Выберите свои намерения, чтобы мы подобрали идеальные пары</p>
            <div className="intentions-grid-premium">
              {intentionsList.map(item => (
                <button 
                  key={item.id} 
                  className={`intention-btn-premium ${formData.intentions.includes(item.id) ? 'active' : ''}`}
                  onClick={() => {
                    const newInt = formData.intentions.includes(item.id)
                      ? formData.intentions.filter(i => i !== item.id)
                      : [...formData.intentions, item.id];
                    setFormData({...formData, intentions: newInt});
                  }}
                >
                  <div className="icon-box">{item.icon}</div>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step fade-in">
            <h1 className="title-premium">О вас</h1>
            <div className="form-premium">
              <div className="input-group-premium">
                <label><User size={16}/> Имя</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Иван"
                />
              </div>
              <div className="input-row-premium">
                <div className="input-group-premium">
                  <label><Calendar size={16}/> Возраст</label>
                  <input 
                    type="number" 
                    value={formData.age} 
                    onChange={e => setFormData({...formData, age: e.target.value})}
                    placeholder="25"
                  />
                </div>
                <div className="input-group-premium">
                  <label>Год рождения</label>
                  <input 
                    type="number" 
                    value={formData.birth_year} 
                    onChange={e => setFormData({...formData, birth_year: e.target.value})}
                    placeholder="1999"
                  />
                </div>
              </div>
              <div className="input-group-premium">
                <label><MapPin size={16}/> Город</label>
                <input 
                  type="text" 
                  value={formData.city} 
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  placeholder="Москва"
                />
              </div>
              <div className="gender-premium">
                <button 
                  className={formData.gender === 'male' ? 'active' : ''} 
                  onClick={() => setFormData({...formData, gender: 'male'})}
                >М</button>
                <button 
                  className={formData.gender === 'female' ? 'active' : ''} 
                  onClick={() => setFormData({...formData, gender: 'female'})}
                >Ж</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step fade-in">
            <h1 className="title-premium">Интересы</h1>
            <p className="subtitle-premium">Выберите то, что вам по душе</p>
            <div className="interests-grid-premium">
              {interestsList.map(item => (
                <button 
                  key={item.id} 
                  className={`interest-tag-premium ${formData.interests.includes(item.id) ? 'active' : ''}`}
                  onClick={() => {
                    const newInt = formData.interests.includes(item.id)
                      ? formData.interests.filter(i => i !== item.id)
                      : [...formData.interests, item.id];
                    setFormData({...formData, interests: newInt});
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="onboarding-step fade-in">
            <h1 className="title-premium">Ваше фото</h1>
            <p className="subtitle-premium">Без фото пользоваться приложением нельзя. Мы за честность!</p>
            <div className="avatar-section-premium">
              <div className="avatar-placeholder-premium" onClick={() => document.getElementById('avatarInput').click()}>
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" />
                ) : (
                  <Camera size={64} color="rgba(255,255,255,0.2)" />
                )}
              </div>
              <input 
                id="avatarInput" 
                type="file" 
                hidden 
                accept="image/*" 
                onChange={handleAvatarChange} 
              />
              <button className="upload-btn-premium" onClick={() => document.getElementById('avatarInput').click()}>
                Загрузить фото
              </button>
            </div>
            <div className="bio-section-premium">
              <label>О себе</label>
              <textarea 
                value={formData.bio} 
                onChange={e => setFormData({...formData, bio: e.target.value})}
                placeholder="Расскажите о своих хобби и интересах..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
