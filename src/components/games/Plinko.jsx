import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Trophy, AlertCircle } from 'lucide-react';

const ROWS = 8;
const BUCKETS = [10, 5, 2, 0.5, 0.2, 0.2, 0.5, 2, 5, 10];

const Plinko: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [loading, setLoading] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [message, setMessage] = useState('');
  const [ballPos, setBallPos] = useState({ x: 50, y: 5 });
  const [activeBucket, setActiveBucket] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<{ win: boolean; title: string; subtitle: string; amount?: number }>({ win: false, title: '', subtitle: '' });

  const handleDrop = async () => {

    if (balance < bet) {
      setMessage('❌ Недостаточно баланса');
      return;
    }

    setLoading(true);
    setDropping(true);
    setMessage('');
    setActiveBucket(null);
    setBallPos({ x: 50, y: 5 });
    
    try {
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Telegram-Id': tgUser?.telegram_id || tgUser?.id || ''
        },
        body: JSON.stringify({ game: 'plinko', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
        setDropping(false);
      } else {
        animateBall(data.bucketIdx, data);
      }
    } catch (e: any) {
      setMessage('⚠️ Ошибка сети');
      setDropping(false);
    } finally {
      setLoading(false);
    }
  };

  const animateBall = (targetBucket: number, data: any) => {
    const startTime = performance.now();
    const duration = 2500;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress < 1) {
        // Horizontal: ease towards target bucket center
        const startX = 50;
        const targetX = 50 + ((targetBucket - 4.5) * 8.5);
        const currentX = startX + (targetX - startX) * progress;
        
        // Vertical: parabolic arc for each bounce
        const ROWS_COUNT = 8;
        const subProgress = (progress * ROWS_COUNT) % 1;
        const peakHeight = 5;
        const yOffset = Math.sin(subProgress * Math.PI) * peakHeight;
        const currentY = 5 + (progress * 85) - yOffset;
        
        setBallPos({ 
          x: currentX + (Math.sin(elapsed * 0.01) * 0.5), // Subtle jitter
          y: currentY 
        });
        
        requestAnimationFrame(animate);
      } else {
        setDropping(false);
        setActiveBucket(targetBucket);
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        
        setOverlayData({ 
            win: data.winAmount > bet, 
            title: data.winAmount > bet ? 'ПОБЕДА!' : 'МНОЖИТЕЛЬ x' + data.multiplier, 
            subtitle: data.winAmount > bet ? `Множитель x${data.multiplier}` : 'Повезет в следующий раз!', 
            amount: data.winAmount > bet ? data.winAmount : bet 
        });
        setShowOverlay(true);
      }
    };
    
    requestAnimationFrame(animate);
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
      
      {/* Plinko Board Visual */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        height: '420px', 
        background: 'radial-gradient(circle at center, #121214 0%, #0d0d0f 100%)', 
        borderRadius: '40px', 
        position: 'relative',
        padding: '24px',
        border: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(168, 85, 247, 0.03)'
      }}>
        {/* Board Background Particles */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {/* Pins Layout */}
        <div style={{ marginTop: '20px' }}>
            {Array.from({ length: ROWS }).map((_, r) => (
                <div key={r} style={{ display: 'flex', justifyContent: 'center', gap: `${36 - r*2}px`, marginBottom: '24px' }}>
                    {Array.from({ length: r + 3 }).map((_, p) => (
                        <div key={p} style={{ 
                            width: '6px', height: '6px', 
                            borderRadius: '50%', 
                            background: 'rgba(255,255,255,0.2)',
                            boxShadow: '0 0 10px rgba(255,255,255,0.1)'
                        }} />
                    ))}
                </div>
            ))}
        </div>

        {/* Buckets with multipliers */}
        <div style={{ position: 'absolute', bottom: '20px', left: '12px', right: '12px', display: 'flex', gap: '6px' }}>
          {BUCKETS.map((m, i) => (
            <motion.div 
              key={i}
              animate={activeBucket === i ? { y: [-10, 0], scale: [1, 1.1, 1], backgroundColor: 'var(--primary-color)' } : {}}
              style={{ 
                flex: 1, 
                height: '40px', 
                background: m >= 5 ? 'rgba(245, 158, 11, 0.1)' : m >= 1 ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.03)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: '950',
                color: m >= 5 ? 'var(--gold-color)' : '#fff',
                border: `1px solid ${m >= 5 ? 'var(--gold-glow)' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.3s ease'
              }}
            >
              {m}x
            </motion.div>
          ))}
        </div>

        {/* The Ball */}
        <AnimatePresence>
            {dropping && (
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ 
                        position: 'absolute', 
                        top: `${ballPos.y}%`, 
                        left: `${ballPos.x}%`, 
                        width: '18px', 
                        height: '18px', 
                        background: 'var(--gold-color)', 
                        borderRadius: '50%',
                        boxShadow: '0 0 20px var(--gold-glow)',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10
                    }} 
                />
            )}
        </AnimatePresence>
      </div>

      {/* Result Indicator */}
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

      <div style={{ width: '100%', maxWidth: '400px' }}>
          <BetControls 
            bet={bet} 
            setBet={setBet} 
            minBet={100} 
            maxBet={100000} 
            onPlay={handleDrop} 
            loading={loading || dropping}
          />
      </div>
    </div>
  );
};

export default Plinko;
