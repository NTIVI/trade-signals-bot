import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Club, Spade, Heart, Diamond, ArrowUp, ArrowDown, HelpCircle, Trophy, AlertCircle } from 'lucide-react';

const SuitIcon = ({ suit, size = 20 }: { suit: string, size?: number }) => {
  switch (suit) {
    case 'hearts': return <Heart size={size} color="#ef4444" fill="#ef4444" />;
    case 'diamonds': return <Diamond size={size} color="#ef4444" fill="#ef4444" />;
    case 'clubs': return <Club size={size} color="#333" fill="#333" />;
    case 'spades': return <Spade size={size} color="#333" fill="#333" />;
    default: return null;
  }
};

const PremiumCard = ({ card }: { card: any }) => (
  <motion.div 
    initial={{ x: 100, opacity: 0, rotateY: 90 }}
    animate={{ x: 0, opacity: 1, rotateY: 0 }}
    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
    style={{
      width: '120px',
      height: '170px',
      background: '#fff',
      borderRadius: '20px',
      border: '1px solid rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      position: 'relative',
      color: '#000',
    }}>
    <div style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '20px', fontWeight: '950', lineHeight: 1 }}>{card.value}</div>
    <SuitIcon suit={card.suit} size={48} />
    <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '20px', fontWeight: '950', transform: 'rotate(180deg)', lineHeight: 1 }}>{card.value}</div>
    
    {/* Subtle Card Pattern */}
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none', background: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
  </motion.div>
);

const HiLo: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [status, setStatus] = useState<'idle' | 'playing' | 'win' | 'lose'>('idle');
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<{ win: boolean; title: string; subtitle: string; amount?: number }>({ win: false, title: '', subtitle: '' });
  const [message, setMessage] = useState('');

  const resetGame = () => {
    setStatus('idle');
    setCurrentCard(null);
    setMultiplier(1);
    setMessage('');
    setShowOverlay(false);
  };

  const startGame = async () => {
    if (balance < bet) {
      setMessage('❌ Недостаточно баланса');
      return;
    }

    setLoading(true);
    setMessage('');
    setMultiplier(1.0);
    
    try {
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Telegram-Id': tgUser?.telegram_id || tgUser?.id || ''
        },
        body: JSON.stringify({ game: 'hilo', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
      } else {
        setCurrentCard(data.currentCard);
        setStatus('playing');
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
      }
    } catch (e: any) {
      setMessage('⚠️ Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async (guess: 'higher' | 'lower' | 'same') => {
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
        body: JSON.stringify({ action: 'guess', guess }),
      });
      const data = await res.json();

      if (data.status === 'lose') {
        setStatus('lose');
        setCurrentCard(data.nextCard);
        setOverlayData({ win: false, title: 'ПРОИГРЫШ!', subtitle: 'Неверный прогноз', amount: bet });
        setShowOverlay(true);
      } else if (data.status === 'playing' || data.status === 'win') {
        setCurrentCard(data.currentCard);
        setMultiplier(data.currentMultiplier);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        if (data.status === 'win') {
             // Some backends might auto-win on certain conditions, usually stays 'playing'
        }
      } else if (data.error) {
          setMessage('⚠️ ' + data.error);
      }
    } catch (e: any) {
      setMessage('⚠️ Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const cashOut = async () => {
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
        body: JSON.stringify({ action: 'cashout' }),
      });
      const data = await res.json();

      if (data.status === 'win') {
        setStatus('win');
        setBalance(data.balance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        setOverlayData({ 
            win: true, 
            title: 'ПОБЕДА!', 
            subtitle: `Множитель x${multiplier.toFixed(2)}`,
            amount: data.winAmount
        });
        setShowOverlay(true);
      }
    } catch (e: any) {
      setMessage('⚠️ Ошибка подключения');
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
        onClose={resetGame} 
      />
      
      {/* Premium Playing Area */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        height: '350px', 
        borderRadius: '40px', 
        background: 'radial-gradient(circle at center, #064e3b 0%, #022c22 100%)',
        border: '8px solid #1a1a1c',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 100px rgba(0,0,0,0.3)'
      }}>
        {/* Table Felt Logo */}
        <div style={{ position: 'absolute', opacity: 0.05, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
            <Club size={200} />
        </div>

        <AnimatePresence mode="wait">
            {currentCard ? (
                <PremiumCard key={currentCard.value + currentCard.suit} card={currentCard} />
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.1 }}>
                    <HelpCircle size={100} color="#fff" />
                </motion.div>
            )}
        </AnimatePresence>
        
        {status === 'playing' && (
            <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                style={{ 
                    position: 'absolute', top: '30px', right: '30px', 
                    padding: '8px 16px', borderRadius: '14px', 
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                    border: '1px solid var(--gold-glow)',
                    color: 'var(--gold-color)', fontSize: '16px', fontWeight: '950',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                }}
            >
               x{multiplier.toFixed(2)}
            </motion.div>
        )}
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
                    style={{ fontSize: '18px', fontWeight: '950', color: status === 'win' ? 'var(--success-color)' : status === 'lose' ? 'var(--casino-red)' : '#fff', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                    {status === 'win' && <Trophy size={20} />}
                    {message.includes('⚠️') && <AlertCircle size={20} />}
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {status === 'playing' ? (
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr 1fr', gap: '12px' }}>
                  <button 
                    onClick={() => handleGuess('higher')} 
                    className="btn-primary" 
                    style={{ height: '70px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                        <ArrowUp size={20} />
                        <span style={{ fontSize: '11px', fontWeight: '900' }}>ВЫШЕ</span>
                  </button>
                  <button 
                    onClick={() => handleGuess('same')} 
                    className="btn-primary" 
                    style={{ height: '70px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '950' }}
                  >
                      =
                  </button>
                  <button 
                    onClick={() => handleGuess('lower')} 
                    className="btn-primary" 
                    style={{ height: '70px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                        <ArrowDown size={20} />
                        <span style={{ fontSize: '11px', fontWeight: '900' }}>НИЖЕ</span>
                  </button>
              </div>
              
              <button 
                className="btn-primary" 
                onClick={cashOut}
                disabled={loading}
                style={{ 
                    height: '80px', borderRadius: '28px', 
                    background: 'var(--success-color)', 
                    boxShadow: '0 15px 30px rgba(16, 185, 129, 0.4)',
                    fontSize: '20px', fontWeight: '950',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px'
                }}
              >
                <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '2px' }}>Забрать профит</div>
                <div>${((bet * multiplier) / 100).toFixed(2)}</div>
              </button>
          </div>
      ) : (
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <BetControls bet={bet} setBet={setBet} minBet={100} maxBet={100000} onPlay={startGame} loading={loading} />
              
              {status !== 'idle' && (
                  <button 
                    onClick={resetGame} 
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontWeight: '800' }}
                  >
                      СБРОСИТЬ СТОЛ
                  </button>
              )}
          </div>
      )}
    </div>
  );
};

export default HiLo;
