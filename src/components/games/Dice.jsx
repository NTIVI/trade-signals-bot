import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Dice6, Trophy, Sparkles, AlertCircle } from 'lucide-react';

const Dice: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [target, setTarget] = useState(50);
  const [type, setType] = useState<'under' | 'over'>('under');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<{ win: boolean; title: string; subtitle: string; amount?: number }>({ win: false, title: '', subtitle: '' });

  const winChance = type === 'under' ? target : 100 - target;
  const multiplier = winChance > 0 ? (98 / winChance).toFixed(2) : '0.00';

  const handleRoll = async () => {
    if (balance < bet) {
      setMessage('❌ Недостаточно баланса');
      return;
    }

    setLoading(true);
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
        body: JSON.stringify({ game: 'dice', bet, target, type }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
      } else {
        setResult(data);
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        
        if (data.win) {
          setOverlayData({ win: true, title: 'ПОБЕДА!', subtitle: `Выпало ${data.roll} — x${data.multiplier?.toFixed(2) || ''}`, amount: data.winAmount });
          setShowOverlay(true);
        } else {
          setOverlayData({ win: false, title: 'ПРОИГРЫШ', subtitle: `Выпало ${data.roll}`, amount: bet });
          setShowOverlay(true);
        }
      }
    } catch (e: any) {
      setMessage('⚠️ Ошибка сети');
    } finally {
      setLoading(false);
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
      
      {/* Visual Dice Display Panel */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '40px', 
        textAlign: 'center', 
        borderRadius: '40px',
        background: 'linear-gradient(180deg, #121214 0%, #0d0d0f 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(168, 85, 247, 0.03)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Decoration */}
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '150px', height: '150px', background: 'var(--primary-color)', opacity: 0.05, filter: 'blur(60px)', borderRadius: '50%' }} />
        
        <div style={{ fontSize: '12px', opacity: 0.4, textTransform: 'uppercase', fontWeight: '900', letterSpacing: '2px', marginBottom: '24px' }}>Результат Ролла</div>
        
        <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <AnimatePresence mode="wait">
                {result ? (
                    <motion.div 
                        key={result.roll}
                        initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 12 }}
                        style={{ 
                            fontSize: '84px', 
                            fontWeight: '950', 
                            color: result.win ? 'var(--success-color)' : '#fff',
                            textShadow: result.win ? '0 0 30px var(--success-glow)' : 'none'
                        }}
                    >
                        {result.roll}
                    </motion.div>
                ) : (
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                        style={{ opacity: 0.05 }}
                    >
                        <Dice6 size={100} />
                    </motion.div>
                )}
            </AnimatePresence>
            
            {result?.win && (
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    style={{ position: 'absolute', top: -10, right: 40, color: 'var(--gold-color)' }}
                >
                    <Sparkles size={32} fill="currentColor" />
                </motion.div>
            )}
        </div>

        {/* Multiplier / Win Chance HUD */}
        <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '32px',
            padding: '16px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.05)'
        }}>
            <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase' }}>Шанс</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--gold-color)' }}>{winChance.toFixed(1)}%</div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase' }}>Выплата</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--success-color)' }}>x{multiplier}</div>
            </div>
        </div>
      </div>

      {/* Target Control */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              padding: '24px', 
              borderRadius: '28px', 
              border: '1px solid rgba(255,255,255,0.08)' 
          }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase' }}>Цель</span>
                      <span style={{ fontSize: '24px', fontWeight: '950', color: '#fff' }}>{type === 'under' ? 'Меньше' : 'Больше'} {target}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setType('under')}
                        style={{ padding: '8px 16px', borderRadius: '12px', background: type === 'under' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                      >
                          UNDER
                      </button>
                      <button 
                        onClick={() => setType('over')}
                        style={{ padding: '8px 16px', borderRadius: '12px', background: type === 'over' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                      >
                          OVER
                      </button>
                  </div>
              </div>
              <input 
                type="range" min="2" max="98" value={target} 
                onChange={(e) => setTarget(parseInt(e.target.value))}
                disabled={loading}
                style={{ width: '100%', height: '8px', cursor: 'pointer' }}
              />
          </div>

          <div style={{ height: '30px', textAlign: 'center' }}>
            <AnimatePresence mode="wait">
                {message && (
                    <motion.div 
                        key={message}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ fontSize: '16px', fontWeight: '900', color: message.includes('WIN') ? 'var(--success-color)' : '#fff', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                    >
                        {message.includes('WIN') && <Trophy size={18} />}
                        {message.includes('⚠️') && <AlertCircle size={18} color="var(--casino-red)" />}
                        {message}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <BetControls bet={bet} setBet={setBet} minBet={50} maxBet={100000} onPlay={handleRoll} loading={loading} />
      </div>
    </div>
  );
};

export default Dice;
