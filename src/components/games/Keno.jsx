import { useState } from 'react';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';

const Keno: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [picks, setPicks] = useState<number[]>([]);
  const [draws, setDraws] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<any>({ win: false, title: '', subtitle: '' });

  const togglePick = (n: number) => {
    if (picks.includes(n)) setPicks(picks.filter(p => p !== n));
    else if (picks.length < 10) setPicks([...picks, n]);
  };

  const handlePlay = async () => {
    if (picks.length === 0) { setMessage('⚠️ Выберите числа'); return; }
    if (balance < bet) { setMessage('❌ Недостаточно баланса'); return; }

    setLoading(true);
    setDraws([]);
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
        body: JSON.stringify({ game: 'keno', bet, picks }),
      });
      const data = await res.json();
      if (data.error) setMessage('⚠️ ' + data.error);
      else {
        // Local animation
        const finalDraws = data.draws;
        for (let i = 1; i <= finalDraws.length; i++) {
            await new Promise(r => setTimeout(r, 150));
            setDraws(finalDraws.slice(0, i));
        }

        setBalance(data.balance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        
        if (data.winAmount > 0) {
            setOverlayData({ win: true, title: 'ПОБЕДА!', subtitle: `Совпадений: ${data.matches} — x${data.multiplier}`, amount: data.winAmount });
        } else {
            setOverlayData({ win: false, title: 'ПРОИГРЫШ', subtitle: `Совпадений: ${data.matches}`, amount: bet });
        }
        setShowOverlay(true);
      }
    } catch {
      setMessage('⚠️ Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      <ResultOverlay show={showOverlay} win={overlayData.win} title={overlayData.title} subtitle={overlayData.subtitle} amount={overlayData.amount} onClose={() => { setShowOverlay(false); setDraws([]); }} />
      
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', 
        width: '100%', maxWidth: '360px', background: 'rgba(255,255,255,0.02)', 
        padding: '12px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const n = i + 1;
          const isPick = picks.includes(n);
          const isDraw = draws.includes(n);
          const isHit = isPick && isDraw;
          return (
            <button
              key={n}
              onClick={() => togglePick(n)}
              disabled={loading || draws.length > 0}
              style={{
                aspectRatio: '1', borderRadius: '8px', border: 'none',
                background: isHit ? 'var(--success-color)' : isDraw ? '#ef4444' : isPick ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                color: '#fff', fontSize: '12px', fontWeight: '950', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isHit ? '0 0 15px var(--success-glow)' : 'none'
              }}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ height: '30px', textAlign: 'center', marginBottom: '10px' }}>
             {message && <div style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>{message}</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px', fontWeight: '900', opacity: 0.5 }}>
              <span>ВЫБРАНО: {picks.length}/10</span>
              <button onClick={() => setPicks([])} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>ОЧИСТИТЬ</button>
          </div>
          <BetControls bet={bet} setBet={setBet} minBet={100} maxBet={100000} onPlay={handlePlay} loading={loading} />
      </div>

    </div>
  );
};

export default Keno;
