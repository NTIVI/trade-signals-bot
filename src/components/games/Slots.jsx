import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Star, Zap, Gem, Bell, Apple, Cherry, Trophy, Heart, Coins, AlertTriangle } from 'lucide-react';

const SYMBOLS = [
  { icon: <Star size={32} />, color: '#fbbf24', value: 'star', label: 'Jackpot', multiplier: 100 },
  { icon: <Gem size={32} />, color: '#3b82f6', value: 'gem', label: 'Grand', multiplier: 50 },
  { icon: <Zap size={32} />, color: '#a855f7', value: 'zap', label: 'Mega', multiplier: 25 },
  { icon: <Bell size={32} />, color: '#f59e0b', value: 'bell', label: 'Big', multiplier: 10 },
  { icon: <Heart size={32} />, color: '#ec4899', value: 'heart', label: 'Bonus', multiplier: 5 },
  { icon: <Apple size={32} />, color: '#ef4444', value: 'apple', label: 'Fruit', multiplier: 2 },
  { icon: <Cherry size={32} />, color: '#ef4444', value: 'cherry', label: 'Fruit', multiplier: 1 },
];

const Slots: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [1, 0, 2]]);
  const [message, setMessage] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<{ win: boolean; title: string; subtitle: string; amount?: number }>({ win: false, title: '', subtitle: '' });

  const spinReels = async () => {
    if (balance < bet) {
      setMessage('❌ Недостаточно баланса');
      return;
    }

    setSpinning(true);
    setMessage('');
    setWinAmount(0);

    try {
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Telegram-Id': tgUser?.telegram_id || tgUser?.id || ''
        },
        body: JSON.stringify({ game: 'slots', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
        setSpinning(false);
        return;
      }

      // Backend outcome (spread into 5 reels for premium look, though backend might return 3)
      // If backend returns 3, we fill others randomly
      let outcome = data.outcome;
      if (!Array.isArray(outcome) || outcome.length < 5) {
          // Fallback if backend returned 3 or something else
          outcome = Array.from({ length: 5 }, (_, i) => outcome[i] ?? Math.floor(Math.random() * SYMBOLS.length));
      }
      
      const visualOutcome = outcome;

      // Sequential Reel Stop Animation
      visualOutcome.forEach((o: number, i: number) => {
        setTimeout(() => {
            setReels((prev: any[]) => {
                const next = [...prev];
                next[i] = [
                    (o + 1) % SYMBOLS.length,
                    o,
                    (o - 1 + SYMBOLS.length) % SYMBOLS.length
                ];
                return next;
            });
            if (i === visualOutcome.length - 1) {
                setSpinning(false);
                setBalance(data.balance !== undefined ? data.balance : data.newBalance);
                if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));

                if (data.winAmount > 0) {
                  setWinAmount(data.winAmount);
                  setOverlayData({ win: true, title: 'ПОБЕДА!', subtitle: 'Крупный выигрыш!', amount: data.winAmount });
                  setShowOverlay(true);
                } else {
                  setOverlayData({ win: false, title: 'ПРОИГРЫШ', subtitle: 'Попробуйте ещё раз!', amount: bet });
                  setShowOverlay(true);
                }
            }
        }, 1500 + (i * 300));
      });

    } catch (e: any) {
      setMessage('⚠️ Ошибка сети');
      setSpinning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>
      <ResultOverlay 
        show={showOverlay} 
        win={overlayData.win} 
        title={overlayData.title} 
        subtitle={overlayData.subtitle} 
        amount={overlayData.amount}
        onClose={() => setShowOverlay(false)} 
      />
      
      {/* Premium Jackpot Counter */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px',
        background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, rgba(0,0,0,0.5) 100%)', 
        border: '1px solid var(--gold-glow)', 
        borderRadius: '24px', 
        padding: '16px', 
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(245, 158, 11, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ fontSize: '10px', fontWeight: '950', color: 'var(--gold-color)', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '4px' }}
        >
            Grand Jackpot
        </motion.div>
        <div style={{ fontSize: '32px', fontWeight: '950', color: '#fff', textShadow: '0 0 15px var(--gold-glow)' }}>
            $748,500.<span style={{ opacity: 0.3 }}>00</span>
        </div>
      </div>

      {/* 5-Reel Slot Machine */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        padding: '20px',
        background: '#121214',
        borderRadius: '32px',
        border: '4px solid #1a1a1c',
        boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 0 40px rgba(168, 85, 247, 0.05)',
      }}>
        <div style={{
            display: 'flex',
            gap: '8px',
            height: '180px',
            background: '#050506',
            borderRadius: '20px',
            padding: '10px',
            border: '1px solid rgba(255,255,255,0.02)',
            position: 'relative',
            overflow: 'hidden'
        }}>
           {/* Center Payline Indicator */}
           <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', background: 'var(--gold-glow)', zIndex: 10, boxShadow: '0 0 10px var(--gold-color)', opacity: spinning ? 0.2 : 0.8 }} />
           
           {reels.map((reel, i) => (
            <div key={i} style={{
                flex: 1,
                background: 'linear-gradient(180deg, #0d0d0f 0%, #1a1a1c 50%, #0d0d0f 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.03)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <motion.div
                    animate={spinning ? { y: [-1200, 0] } : { y: 0 }}
                    transition={spinning ? { repeat: Infinity, duration: 0.15 - (i * 0.02), ease: "linear" } : { type: "spring", stiffness: 120, damping: 12 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        alignItems: 'center',
                        filter: spinning ? 'blur(4px)' : 'none'
                    }}
                >
                    {reel.concat(reel).map((symIdx, j) => (
                        <div key={j} style={{ color: SYMBOLS[symIdx].color, filter: `drop-shadow(0 0 8px ${SYMBOLS[symIdx].color}44)` }}>
                            {SYMBOLS[symIdx].icon}
                        </div>
                    ))}
                </motion.div>
            </div>
           ))}
        </div>
      </div>

      {/* Win Display HUD */}
      <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <AnimatePresence mode="wait">
            {winAmount > 0 ? (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0, y: -20 }}
                    style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '12px 32px', borderRadius: '20px', border: '1px solid var(--success-color)' }}
                >
                    <div style={{ color: 'var(--gold-color)', fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '6px' }}>Big Win!</div>
                    <div style={{ fontSize: '28px', fontWeight: '950', color: '#fff' }}>+${(winAmount / 100).toFixed(2)}</div>
                </motion.div>
            ) : message && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ color: message.includes('Недостаточно') || message.includes('⚠️') ? 'var(--casino-red)' : 'rgba(255,255,255,0.4)', fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    {message.includes('❌') ? <AlertTriangle size={18} /> : null}
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Control Panel */}
      <div style={{ width: '100%', maxWidth: '400px' }}>
          <BetControls 
            bet={bet} 
            setBet={setBet} 
            minBet={100} 
            maxBet={100000} 
            onPlay={spinReels} 
            loading={spinning}
          />
      </div>

      {/* Machine Stats */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: '800' }}>
              <Trophy size={14} /> RTP: 96.8%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: '800' }}>
              <Coins size={14} /> HIGH VOLATILITY
          </div>
      </div>
    </div>
  );
};

export default Slots;
