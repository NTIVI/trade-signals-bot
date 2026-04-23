import { useState } from 'react';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';

const Baccarat: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [betOn, setBetOn] = useState<'player' | 'banker' | 'tie'>('player');
  const [status, setStatus] = useState<'idle' | 'playing' | 'revealed'>('idle');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<any>({ win: false, title: '', subtitle: '' });

  const handlePlay = async () => {
    if (balance < bet) { setMessage('❌ Недостаточно баланса'); return; }

    setLoading(true);
    setResult(null);
    setMessage('');

    try {
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Telegram-Id': tgUser?.telegram_id || tgUser?.id || ''
        },
        body: JSON.stringify({ game: 'baccarat', bet, betOn }),
      });
      const data = await res.json();
      if (data.error) setMessage('⚠️ ' + data.error);
      else {
        setResult(data);
        setStatus('playing');
        setBalance(data.balance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        
        setTimeout(() => {
            setStatus('revealed');
            if (data.winAmount > 0) {
                setOverlayData({ win: true, title: 'ПОБЕДА!', subtitle: `Результат: ${data.result.toUpperCase()} (${data.pValue} vs ${data.bValue})`, amount: data.winAmount });
            } else {
                setOverlayData({ win: false, title: 'ПРОИГРЫШ', subtitle: `Результат: ${data.result.toUpperCase()} (${data.pValue} vs ${data.bValue})`, amount: bet });
            }
            setShowOverlay(true);
        }, 1500);
      }
    } catch {
      setMessage('⚠️ Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>
      <ResultOverlay show={showOverlay} win={overlayData.win} title={overlayData.title} subtitle={overlayData.subtitle} amount={overlayData.amount} onClose={() => { setShowOverlay(false); setStatus('idle'); }} />
      
      <div style={{ 
        width: '100%', maxWidth: '360px', height: '200px', 
        background: 'linear-gradient(180deg, #064e3b 0%, #022c22 100%)', 
        borderRadius: '32px', border: '6px solid #1a1a1c',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
          <div style={{ textAlign: 'center' }}>
             <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '8px' }}>ИГРОК</div>
             <div style={{ fontSize: '48px', fontWeight: '950', color: result && status === 'revealed' ? (result.result === 'player' ? 'var(--success-color)' : '#fff') : 'rgba(255,255,255,0.1)' }}>
                {status === 'revealed' ? result?.pValue : '?'}
             </div>
          </div>
          <div style={{ height: '60px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
             <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '8px' }}>БАНКИР</div>
             <div style={{ fontSize: '48px', fontWeight: '950', color: result && status === 'revealed' ? (result.result === 'banker' ? 'var(--success-color)' : '#fff') : 'rgba(255,255,255,0.1)' }}>
                {status === 'revealed' ? result?.bValue : '?'}
             </div>
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '100%', maxWidth: '360px' }}>
          {['player', 'tie', 'banker'].map((type: any) => (
              <button 
                key={type}
                onClick={() => setBetOn(type)}
                disabled={loading || status === 'playing'}
                style={{
                  padding: '16px 8px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                  background: betOn === type ? 'var(--primary-color)' : 'rgba(255,255,255,0.03)',
                  color: '#fff', fontSize: '12px', fontWeight: '950', cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                  {type === 'player' ? 'ИГРОК x2' : type === 'banker' ? 'БАНКИР x2' : 'НИЧЬЯ x8'}
              </button>
          ))}
      </div>

      <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ height: '30px', textAlign: 'center', marginBottom: '10px' }}>
             {message && <div style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>{message}</div>}
          </div>
          <BetControls bet={bet} setBet={setBet} minBet={100} maxBet={100000} onPlay={handlePlay} loading={loading || status === 'playing'} />
      </div>
    </div>
  );
};

export default Baccarat;
