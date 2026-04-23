import { useState } from 'react';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Skull, Trophy } from 'lucide-react';

const Tower: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [status, setStatus] = useState<'idle' | 'playing' | 'win' | 'lose'>('idle');
  const [level, setLevel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<any>({ win: false, title: '', subtitle: '' });

  const ROWS = 8;
  const MULTIPLIERS = [1.2, 1.5, 2.0, 3.0, 5.0, 10.0, 25.0, 100.0];

  const resetGame = () => {
    setStatus('idle');
    setLevel(0);
    setMessage('');
    setShowOverlay(false);
  };

  const startGame = async () => {
    if (balance < bet) { setMessage('❌ Недостаточно баланса'); return; }

    setLoading(true);
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
        body: JSON.stringify({ game: 'tower', bet }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage('⚠️ ' + data.error);
      } else {
        setStatus('playing');
        setLevel(0);
        setBalance(data.balance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
      }
    } catch {
      setMessage('⚠️ Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleStep = async (choice: number) => {
    if (status !== 'playing' || loading) return;

    setLoading(true);
    try {
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/games/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Telegram-Id': tgUser?.telegram_id || tgUser?.id || ''
        },
        body: JSON.stringify({ action: 'step', level: level + 1, choice }),
      });
      const data = await res.json();

      if (data.win) {
        const nextLevel = level + 1;
        if (nextLevel === ROWS) {
          cashOut();
        } else {
          setLevel(nextLevel);
        }
      } else {
        setStatus('lose');
        setOverlayData({ win: false, title: 'ОБРУШЕНИЕ!', subtitle: 'Вы упали с башни', amount: bet });
        setShowOverlay(true);
      }
    } catch {
      setMessage('⚠️ Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const cashOut = async () => {
    if (level === 0 || loading) return;
    setLoading(true);
    try {
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/games/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Telegram-Id': tgUser?.telegram_id || tgUser?.id || ''
        },
        body: JSON.stringify({ action: 'cashout' }),
      });
      const data = await res.json();
      if (data.status === 'win') {
        setStatus('win');
        setBalance(data.balance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        setOverlayData({ win: true, title: 'ПОБЕДА!', subtitle: `Башня покорена! x${MULTIPLIERS[level-1]}`, amount: data.winAmount });
        setShowOverlay(true);
      }
    } catch {
      setMessage('⚠️ Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      <ResultOverlay show={showOverlay} win={overlayData.win} title={overlayData.title} subtitle={overlayData.subtitle} amount={overlayData.amount} onClose={resetGame} />
      
      <div style={{ 
        width: '100%', maxWidth: '360px', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)',
        padding: '20px', display: 'flex', flexDirection: 'column-reverse', gap: '8px'
      }}>
        {MULTIPLIERS.map((m, i) => (
          <div key={i} style={{ 
            display: 'flex', gap: '8px', opacity: i === level ? 1 : i < level ? 0.5 : 0.2,
            transition: 'all 0.3s'
          }}>
            <div style={{ width: '40px', fontSize: '10px', fontWeight: '900', color: 'var(--gold-color)', display: 'flex', alignItems: 'center' }}>x{m}</div>
            {[0, 1, 2].map(c => (
              <button
                key={c}
                disabled={i !== level || status !== 'playing' || loading}
                onClick={() => handleStep(c)}
                style={{ 
                  flex: 1, height: '40px', borderRadius: '10px', 
                  background: i < level ? 'var(--success-color)' : 'rgba(255,255,255,0.05)',
                  border: i === level ? '1px solid var(--primary-color)' : 'none',
                  cursor: i === level ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff'
                }}
              >
                {i < level ? <Trophy size={16} /> : i === level ? <HelpCircle size={16} /> : <Skull size={16} opacity={0.2} />}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ height: '30px', textAlign: 'center', marginBottom: '10px' }}>
             {message && <div style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>{message}</div>}
          </div>
          
          {status === 'playing' ? (
            <button onClick={cashOut} disabled={level === 0 || loading} className="btn-primary" style={{ height: '60px', width: '100%' }}>
              ЗАБРАТЬ ${((bet * (MULTIPLIERS[level - 1] || 0)) / 100).toFixed(2)}
            </button>
          ) : (
            <BetControls bet={bet} setBet={setBet} minBet={100} maxBet={100000} onPlay={startGame} loading={loading} />
          )}
      </div>
    </div>
  );
};

const HelpCircle = ({ size }: { size: number }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>?</div>
);

export default Tower;
