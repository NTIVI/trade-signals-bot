import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { Camera, User, Heart, MessageCircle, Star } from 'lucide-react';
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
    { id: 'dating', label: 'Dating', icon: <Heart size={20} /> },
    { id: 'friendship', label: 'Friendship', icon: <User size={20} /> },
    { id: 'serious', label: 'Serious relationship', icon: <Star size={20} /> },
    { id: 'chat', label: 'Just chatting', icon: <MessageCircle size={20} /> },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Finalize registration
      if (!formData.avatar) {
        tg.showAlert('Please upload an avatar to continue!');
        return;
      }
      // Here we would save to Supabase
      localStorage.setItem('registered', 'true');
      console.log('Registration complete:', formData);
      navigate('/');
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
        <h1>{step === 1 ? 'What are you looking for?' : step === 2 ? 'About you' : 'Almost there!'}</h1>
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
              <label>Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Your name"
              />
            </div>
            <div className="input-group">
              <label>Age</label>
              <input 
                type="number" 
                value={formData.age} 
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                placeholder="20"
              />
            </div>
            <div className="input-group">
              <label>Gender</label>
              <div className="gender-selector">
                <button 
                  className={formData.gender === 'male' ? 'active' : ''} 
                  onClick={() => setFormData({...formData, gender: 'male'})}
                >Male</button>
                <button 
                  className={formData.gender === 'female' ? 'active' : ''} 
                  onClick={() => setFormData({...formData, gender: 'female'})}
                >Female</button>
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
              {formData.avatar ? 'Change Photo' : 'Upload Photo'}
            </label>
            <p className="hint">A profile picture is mandatory to join the community.</p>
          </div>
        )}
      </div>

      <button className="next-btn" onClick={handleNext}>
        {step === 3 ? 'Finish' : 'Next'}
      </button>
    </div>
  );
};

export default Register;
