import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Sparkles, Zap, AlertCircle } from 'lucide-react';

const SEGMENTS = [0, 1.2, 0.5, 2, 0, 1.5, 5, 0.2, 1.1, 0, 10, 0.5, 1.2, 0, 20];
const SEGMENT_ANGLE = 360 / SEGMENTS.length;

const WheelOfFortune: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<{ win: boolean; title: string; subtitle: string; amount?: number }>({ win: false, title: '', subtitle: '' });

  const handleSpin = async () => {

    if (balance < bet) {
      setMessage('❌ Недостаточно баланса');
      return;
    }

    setLoading(true);
    setSpinning(true);
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
        body: JSON.stringify({ game: 'wheel', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
        setSpinning(false);
      } else {
        // Calculate target rotation: multiple full spins + target segment
        // The index in data.segmentIdx is the winning index
        const targetAngle = data.segmentIdx * SEGMENT_ANGLE;
        const extraSpins = 360 * 5;
        // Total rotation to reach the target segment at 0 angle (the top pointer)
        const totalNewRotation = extraSpins + (360 - targetAngle) - (rotation % 360);
        
        setRotation((prev: number) => prev + totalNewRotation);

        setTimeout(() => {
          setSpinning(false);
          setBalance(data.balance !== undefined ? data.balance : data.newBalance);
          if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
          
          if (data.winAmount > bet) {
            setOverlayData({ win: true, title: 'ДЖЕКПОТ!', subtitle: `Множитель x${data.multiplier}`, amount: data.winAmount });
            setShowOverlay(true);
          } else if (data.winAmount > 0) {
            setOverlayData({ win: true, title: 'ПОБЕДА!', subtitle: `Множитель x${data.multiplier}`, amount: data.winAmount });
            setShowOverlay(true);
          } else {
            setOverlayData({ win: false, title: 'ПРОИГРЫШ', subtitle: 'Повезёт в следующий раз!', amount: bet });
            setShowOverlay(true);
          }
        }, 4000);
      }
    } catch (e: any) {
      setMessage('⚠️ Ошибка сети');
      setSpinning(false);
    } finally {
      setLoading(false);
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
        onClose={() => setShowOverlay(false)} 
      />
      
      {/* Premium Wheel Visualization */}
      <div style={{ 
        position: 'relative', 
        width: '300px', 
        height: '300px',
        padding: '10px',
        background: 'radial-gradient(circle, #1a1a1c 0%, #0d0d0f 70%, #000 100%)',
        borderRadius: '50%',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(168, 85, 247, 0.1)',
        border: '4px solid #1a1a1c'
      }}>
        {/* Outer Glowing Ring */}
        <div style={{ 
            position: 'absolute', top: '-5px', left: '-5px', right: '-5px', bottom: '-5px', 
            borderRadius: '50%', border: '2px solid var(--gold-glow)', opacity: 0.2 
        }} />

        {/* Center Pivot Indicator */}
        <div style={{ 
            position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', 
            zIndex: 10, filter: 'drop-shadow(0 0 10px var(--gold-glow))' 
        }}>
            <Zap size={32} color="var(--gold-color)" fill="var(--gold-color)" />
        </div>

        {/* Real Dynamic Wheel SVG */}
        <motion.svg 
            viewBox="0 0 200 200" 
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.1, 0, 0.1, 1] }} // Custom cubic-bezier for wheel stop
            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
        >
            {SEGMENTS.map((m, i) => {
                const angle = i * SEGMENT_ANGLE;
                const radians = (angle - 90) * Math.PI / 180;
                const nextRadians = (angle + SEGMENT_ANGLE - 90) * Math.PI / 180;
                const x1 = 100 + 100 * Math.cos(radians);
                const y1 = 100 + 100 * Math.sin(radians);
                const x2 = 100 + 100 * Math.cos(nextRadians);
                const y2 = 100 + 100 * Math.sin(nextRadians);

                const color = i % 2 === 0 ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)';
                const textColor = m >= 5 ? 'var(--gold-color)' : m >= 1.5 ? '#fff' : 'rgba(255,255,255,0.4)';

                return (
                    <g key={i}>
                        <path 
                            d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`} 
                            fill={color}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                        />
                        <text 
                            x={100 + 70 * Math.cos(radians + (SEGMENT_ANGLE * Math.PI / 360))}
                            y={100 + 70 * Math.sin(radians + (SEGMENT_ANGLE * Math.PI / 360))}
                            fill={textColor}
                            fontSize={m >= 10 ? "10" : "8"}
                            fontWeight="950"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            // Rotate text to point to center
                            transform={`rotate(${angle + SEGMENT_ANGLE/2 + 90}, ${100 + 70 * Math.cos(radians + (SEGMENT_ANGLE * Math.PI / 360))}, ${100 + 70 * Math.sin(radians + (SEGMENT_ANGLE * Math.PI / 360))})`}
                        >
                            {m}x
                        </text>
                    </g>
                );
            })}
            {/* Center Cap */}
            <circle cx="100" cy="100" r="15" fill="#121214" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            <circle cx="100" cy="100" r="10" fill="var(--primary-color)" />
        </motion.svg>
      </div>

      {/* Message & Win Indicator */}
      <div style={{ height: '40px', textAlign: 'center' }}>
        <AnimatePresence mode="wait">
          {message && (
             <motion.div
               key={message}
               initial={{ scale: 0.5, opacity: 0, y: 10 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.5, opacity: 0, y: -10 }}
               style={{
                    display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                    fontSize: '20px', fontWeight: '950', 
                    color: message.includes('WIN') || message.includes('JACKPOT') ? 'var(--gold-color)' : '#fff' 
               }}
             >
               {message.includes('JACKPOT') ? <Sparkles size={24} /> : null}
               {message.includes('⚠️') ? <AlertCircle size={20} color="var(--casino-red)" /> : null}
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
            onPlay={handleSpin} 
            loading={loading || spinning}
          />
      </div>

      {/* Probability Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['x20', '5%'], ['x10', '10%'], ['x5', '15%']].map(([x, p]) => (
              <div key={x} style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
                  {x}: <span style={{ color: 'rgba(255,255,255,0.4)' }}>{p}</span>
              </div>
          ))}
      </div>
    </div>
  );
};

export default WheelOfFortune;
