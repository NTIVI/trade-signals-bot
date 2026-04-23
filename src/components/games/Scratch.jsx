import { useState } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Gift } from 'lucide-react';

const Scratch: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [status, setStatus] = useState<'idle' | 'scratching' | 'revealed'>('idle');
  const [symbols, setSymbols] = useState<string[]>(['?', '?', '?']);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<any>({ win: false, title: '', subtitle: '' });

  const startScratch = async () => {
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
        body: JSON.stringify({ game: 'scratch', bet }),
      });
      const data = await res.json();
      if (data.error) setMessage('⚠️ ' + data.error);
      else {
        setSymbols(data.symbols);
        setStatus('scratching');
        setRevealed([]);
        setBalance(data.balance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        
        // Save current win data for final reveal
        setOverlayData({ 
            win: data.winAmount > 0, 
            title: data.winAmount > 0 ? 'УДАЧА!' : 'ПУСТО', 
            subtitle: data.winAmount > 0 ? `Вы выиграли x${data.multiplier}` : 'Попробуйте еще раз', 
            amount: data.winAmount > 0 ? data.winAmount : bet 
        });
      }
    } catch {
      setMessage('⚠️ Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = (idx: number) => {
    if (status !== 'scratching' || revealed.includes(idx)) return;
    const newRevealed = [...revealed, idx];
    setRevealed(newRevealed);
    if (newRevealed.length === 3) {
        setTimeout(() => setShowOverlay(true), 800);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>
      <ResultOverlay show={showOverlay} win={overlayData.win} title={overlayData.title} subtitle={overlayData.subtitle} amount={overlayData.amount} onClose={() => { setShowOverlay(false); setStatus('idle'); setSymbols(['?', '?', '?']); setRevealed([]); }} />
      
      <div style={{ 
        width: '100%', maxWidth: '340px', aspectRatio: '1.6', 
        background: 'linear-gradient(135deg, #1e1e24 0%, #111115 100%)', 
        borderRadius: '24px', border: '2px solid rgba(255,255,255,0.05)',
        padding: '20px', display: 'flex', gap: '12px', position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        {symbols.map((s, i) => (
          <div key={i} onClick={() => handleReveal(i)} style={{ 
            flex: 1, background: revealed.includes(i) ? 'rgba(255,255,255,0.03)' : '#444', 
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px', cursor: status === 'scratching' ? 'pointer' : 'default',
            transition: 'background 0.3s, transform 0.2s',
            transform: revealed.includes(i) ? 'scale(1)' : 'scale(1)',
            border: '2px solid rgba(255,255,255,0.1)'
          }}>
             {revealed.includes(i) ? (
                 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>{s}</motion.div>
             ) : (
                 <Gift size={32} opacity={0.2} />
             )}
          </div>
        ))}
        {status === 'idle' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backdropFilter: 'blur(2px)' }}>
                <span style={{ fontSize: '14px', fontWeight: '950', letterSpacing: '2px' }}>ЖМИТЕ ИГРАТЬ</span>
            </div>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ height: '30px', textAlign: 'center', marginBottom: '10px' }}>
             {message && <div style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>{message}</div>}
          </div>
          <BetControls bet={bet} setBet={setBet} minBet={50} maxBet={50000} onPlay={startScratch} loading={loading || status === 'scratching'} />
      </div>
    </div>
  );
};

export default Scratch;
