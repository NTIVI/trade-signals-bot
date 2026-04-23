import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Club, Spade, Heart, Diamond, User, ShieldCheck } from 'lucide-react';

const SuitIcon = ({ suit, size = 20 }: { suit: string, size?: number }) => {
  switch (suit) {
    case 'hearts': return <Heart size={size} color="#ef4444" fill="#ef4444" />;
    case 'diamonds': return <Diamond size={size} color="#ef4444" fill="#ef4444" />;
    case 'clubs': return <Club size={size} color="#333" fill="#333" />;
    case 'spades': return <Spade size={size} color="#333" fill="#333" />;
    default: return null;
  }
};

const Card = ({ card, hidden, index }: { card: any, hidden?: boolean, index: number }) => (
  <motion.div 
    initial={{ x: -200, y: -200, rotate: -20, opacity: 0 }}
    animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
    transition={{ delay: index * 0.1, type: 'spring', damping: 20, stiffness: 100 }}
    style={{
      width: '70px',
      height: '100px',
      background: hidden ? 'linear-gradient(135deg, #1e40af 0%, #a855f7 100%)' : '#fff',
      borderRadius: '12px',
      border: '1px solid rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      position: 'relative',
      color: '#000',
      marginLeft: index > 0 ? '-40px' : '0',
      zIndex: index
    }}>
    {!hidden && (
      <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '14px', fontWeight: '900', lineHeight: 1 }}>{card.value}</div>
        <SuitIcon suit={card.suit} size={32} />
        <div style={{ position: 'absolute', bottom: '6px', right: '6px', fontSize: '14px', fontWeight: '900', transform: 'rotate(180deg)', lineHeight: 1 }}>{card.value}</div>
      </div>
    )}
    {hidden && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <div style={{ width: '80%', height: '80%', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} color="rgba(255,255,255,0.3)" />
            </div>
        </div>
    )}
  </motion.div>
);

const Blackjack: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [status, setStatus] = useState<'idle' | 'playing' | 'win' | 'lose' | 'push' | 'bust'>('idle');
  const [playerHand, setPlayerHand] = useState<any[]>([]);
  const [dealerHand, setDealerHand] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<{ win: boolean; title: string; subtitle: string; amount?: number }>({ win: false, title: '', subtitle: '' });

  const resetGame = () => {
    setStatus('idle');
    setPlayerHand([]);
    setDealerHand([]);
    setMessage('');
    setShowOverlay(false);
  };

  const startLevel = async () => {
    if (balance < bet) {
      setMessage('❌ Недостаточно баланса');
      return;
    }

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
        body: JSON.stringify({ game: 'blackjack', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
      } else {
        setPlayerHand(data.playerHand);
        setDealerHand(data.dealerHand);
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

  const handleAction = async (action: 'hit' | 'stand') => {
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
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (data.error) {
          setMessage('⚠️ ' + data.error);
      } else {
          if (data.playerHand) setPlayerHand(data.playerHand);
          if (data.dealerHand) setDealerHand(data.dealerHand);
          if (data.status) {
            const isWin = data.status === 'win';
            const isPush = data.status === 'push';
            setStatus(data.status);
            setBalance(data.balance);
            if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
            
            if (data.status !== 'playing') {
                if (isWin) {
                    setOverlayData({ win: true, title: 'БЛЭКДЖЕК!', subtitle: 'Вы победили дилера 🎴', amount: data.winAmount });
                } else if (isPush) {
                    setOverlayData({ win: true, title: 'НИЧЬЯ', subtitle: 'Ставка возвращена', amount: 0 });
                } else {
                    setOverlayData({ win: false, title: 'ПРОИГРЫШ', subtitle: `Дилер: ${data.dealerSum} vs Ваш: ${data.playerSum}`, amount: bet });
                }
                setShowOverlay(true);
            }
          }
      }
    } catch (e: any) {
      setMessage('⚠️ Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', width: '100%' }}>
      <ResultOverlay 
        show={showOverlay} 
        win={overlayData.win} 
        title={overlayData.title} 
        subtitle={overlayData.subtitle} 
        amount={overlayData.amount}
        onClose={resetGame} 
      />
      
      {/* Table Area */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        height: '420px', 
        background: 'radial-gradient(circle at center, #064e3b 0%, #064e3b 40%, #022c22 100%)', 
        borderRadius: '160px 160px 40px 40px', 
        padding: '40px 24px',
        border: '8px solid #1a1a1c',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 100px rgba(0,0,0,0.3)'
      }}>
        {/* Table Logo/Marking */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.1, pointerEvents: 'none', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '950', letterSpacing: '4px', color: 'rgba(255,255,255,0.05)' }}>YOURTURN</div>
            <div style={{ fontSize: '10px', color: '#fff', textTransform: 'uppercase' }}>Dealer must stand on 17</div>
        </div>

        {/* Dealer Side */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', height: '110px' }}>
            {dealerHand.map((c, i) => <Card key={i} card={c} hidden={c.hidden} index={i} />)}
            {dealerHand.length === 0 && (
                <div style={{ width: '70px', height: '100px', borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={32} color="rgba(255,255,255,0.05)" />
                </div>
            )}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: '12px', fontWeight: '800' }}>Дилер</div>
        </div>

        {/* Result Overlay */}
        <div style={{ textAlign: 'center', minHeight: '40px', zIndex: 20 }}>
          <AnimatePresence mode="wait">
            {message && (
              <motion.div 
                key={message}
                initial={{ scale: 0.5, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: -10 }}
                style={{ 
                    padding: '8px 16px',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    fontSize: '16px', 
                    fontWeight: '950', 
                    color: status === 'win' ? 'var(--success-color)' : status === 'playing' ? '#fff' : 'var(--casino-red)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                }}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player Side */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '800' }}>Вы</div>
          <div style={{ display: 'flex', gap: '4px', height: '110px' }}>
            {playerHand.map((c, i) => <Card key={i} card={c} index={i} />)}
            {playerHand.length === 0 && (
                <div style={{ width: '70px', height: '100px', borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={32} color="rgba(255,255,255,0.05)" />
                </div>
            )}
          </div>
        </div>
      </div>

      {status === 'playing' ? (
        <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '400px' }}>
          <button 
            className="btn-primary" 
            onClick={() => handleAction('hit')}
            disabled={loading}
            style={{ 
                flex: 1, 
                height: '70px', 
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '18px',
                fontWeight: '950'
            }}
          >
            ЕЩЁ (HIT)
          </button>
          <button 
            className="btn-primary" 
            onClick={() => handleAction('stand')}
            disabled={loading}
            style={{ 
                flex: 1, 
                height: '70px', 
                borderRadius: '24px',
                background: 'var(--primary-color)',
                fontSize: '18px',
                fontWeight: '950'
            }}
          >
            ХВАТИТ (STAND)
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <BetControls 
              bet={bet} 
              setBet={setBet} 
              minBet={100} 
              maxBet={100000} 
              onPlay={startLevel} 
              loading={loading}
            />
            {status !== 'idle' && (
                <button 
                    onClick={resetGame}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontWeight: '800' }}
                >
                    НОВАЯ РАЗДАЧА
                </button>
            )}
        </div>
      )}
    </div>
  );
};

export default Blackjack;

