import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Trophy, AlertCircle, Coins, Sparkles } from 'lucide-react';

const CoinFlip: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [side, setSide] = useState<'heads' | 'tails'>('heads');
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<{ win: boolean; title: string; subtitle: string; amount?: number }>({ win: false, title: '', subtitle: '' });

  const handleFlip = async () => {
    if (balance < bet) {
      setMessage('❌ Недостаточно баланса');
      return;
    }

    setSpinning(true);
    setMessage('');
    setResult(null);

    try {
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Telegram-Id': tgUser?.telegram_id || tgUser?.id || ''
        },
        body: JSON.stringify({ game: 'coinflip', bet, side }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
        setSpinning(false);
      } else {
        setTimeout(() => {
          setResult(data.result);
          setSpinning(false);
          setBalance(data.balance !== undefined ? data.balance : data.newBalance);
          if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
          
          if (data.win) {
            setOverlayData({ win: true, title: 'ПОБЕДА!', subtitle: `${data.result?.toUpperCase()} — Вы угадали! 🎯`, amount: data.winAmount });
          } else {
            setOverlayData({ win: false, title: 'ПРОИГРЫШ', subtitle: `Выпало ${data.result?.toUpperCase()}`, amount: bet });
          }
          setShowOverlay(true);
        }, 2000);
      }
    } catch (e: any) {
      setMessage('⚠️ Ошибка сети');
      setSpinning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%' }}>
      <ResultOverlay 
        show={showOverlay} 
        win={overlayData.win} 
        title={overlayData.title} 
        subtitle={overlayData.subtitle} 
        amount={overlayData.amount}
        onClose={() => { setShowOverlay(false); setResult(null); setMessage(''); }} 
      />
      
      {/* Premium Coin Visual */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        height: '350px', 
        background: 'radial-gradient(circle at center, #121214 0%, #0d0d0f 100%)',
        borderRadius: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Glow behind coin */}
        <div style={{ position: 'absolute', width: '150px', height: '150px', background: 'var(--gold-glow)', opacity: 0.1, filter: 'blur(60px)', borderRadius: '50%' }} />

        <motion.div
            animate={spinning ? { 
                rotateY: [0, 1800], 
                y: [0, -100, 0],
                scale: [1, 1.2, 1]
            } : { 
                rotateY: result === 'tails' ? 180 : 0 
            }}
            transition={spinning ? { duration: 2, ease: "easeInOut" } : { type: "spring", stiffness: 100 }}
            style={{
                width: '160px',
                height: '160px',
                position: 'relative',
                transformStyle: 'preserve-3d',
                cursor: 'pointer'
            }}
        >
            {/* Front (Heads / Gold) */}
            <div style={{
                position: 'absolute', width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                borderRadius: '50%', border: '8px solid #b45309',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backfaceVisibility: 'hidden',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#78350f', textTransform: 'uppercase' }}>YT</div>
                    <Coins size={64} color="#78350f" strokeWidth={1.5} />
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#78350f', textTransform: 'uppercase' }}>Heads</div>
                </div>
            </div>

            {/* Back (Tails / Silver) */}
            <div style={{
                position: 'absolute', width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)',
                borderRadius: '50%', border: '8px solid #1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>Casino</div>
                    <Trophy size={64} color="#0f172a" strokeWidth={1.5} />
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>Tails</div>
                </div>
            </div>
        </motion.div>

        {/* Win Sparkles */}
        <AnimatePresence>
            {result && !spinning && (
                <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ position: 'absolute', top: '20%' }}
                >
                    <Sparkles size={40} color="var(--gold-color)" />
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Choice Panel */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                onClick={() => setSide('heads')}
                disabled={spinning}
                style={{ 
                    padding: '24px', borderRadius: '24px', 
                    background: side === 'heads' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${side === 'heads' ? 'var(--gold-color)' : 'rgba(255,255,255,0.05)'}`,
                    color: side === 'heads' ? 'var(--gold-color)' : 'rgba(255,255,255,0.4)',
                    fontWeight: '950', fontSize: '16px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                  HEADS
              </button>
              <button 
                onClick={() => setSide('tails')}
                disabled={spinning}
                style={{ 
                    padding: '24px', borderRadius: '24px', 
                    background: side === 'tails' ? 'rgba(71, 85, 105, 0.15)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${side === 'tails' ? '#94a3b8' : 'rgba(255,255,255,0.05)'}`,
                    color: side === 'tails' ? '#94a3b8' : 'rgba(255,255,255,0.4)',
                    fontWeight: '950', fontSize: '16px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                  TAILS
              </button>
          </div>

          {/* Result Message Overlay */}
          <div style={{ height: '30px', textAlign: 'center' }}>
            <AnimatePresence mode="wait">
                {message && (
                    <motion.div
                        key={message}
                        initial={{ scale: 0.8, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -10 }}
                        style={{ fontSize: '18px', fontWeight: '950', color: message.includes('WIN') ? 'var(--success-color)' : '#fff', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                    >
                        {message.includes('WIN') && <Trophy size={18} />}
                        {message.includes('⚠️') && <AlertCircle size={18} color="var(--casino-red)" />}
                        {message}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <BetControls 
            bet={bet} 
            setBet={setBet} 
            minBet={100} 
            maxBet={100000} 
            onPlay={handleFlip} 
            loading={spinning}
          />
      </div>
    </div>
  );
};

export default CoinFlip;
