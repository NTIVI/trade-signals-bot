import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Trophy, AlertCircle } from 'lucide-react';

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const getColor = (num: number) => {
  if (num === 0) return '#10b981'; // Green
  const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return reds.includes(num) ? '#ef4444' : '#1a1a1a'; // Red or Black
};

const Roulette: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [betOn, setBetOn] = useState<'red' | 'black' | 'green'>('red');
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<{ win: boolean; title: string; subtitle: string; amount?: number }>({ win: false, title: '', subtitle: '' });
  const tapeRef = useRef<HTMLDivElement>(null);

  const tapeNumbers = [...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS];

  const handlePlay = async () => {
    if (balance < bet) {
      setMessage('❌ Недостаточно баланса');
      return;
    }

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
        body: JSON.stringify({ game: 'roulette', bet, betOn }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
        setSpinning(false);
        return;
      }

      const winNumber = data.winNumber;
      const itemWidth = 70;
      const indexInTape = ROULETTE_NUMBERS.indexOf(winNumber) + (ROULETTE_NUMBERS.length * 2);

      const currentOffset = rotation % (ROULETTE_NUMBERS.length * (itemWidth + 10));
      const targetOffset = indexInTape * (itemWidth + 10) - (window.innerWidth / 2) + (itemWidth / 2) + 20;
      
      const additionalRotation = (targetOffset - currentOffset + (ROULETTE_NUMBERS.length * (itemWidth + 10)) * 2) % (ROULETTE_NUMBERS.length * (itemWidth + 10));
      
      // Ensure we spin at least one full tape
      const finalAdditional = additionalRotation + (ROULETTE_NUMBERS.length * (itemWidth + 10));
      
      setRotation((prev: number) => prev + finalAdditional);

      setTimeout(() => {
        setSpinning(false);
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        setHistory((prev: number[]) => [winNumber, ...prev].slice(0, 10));

        if (data.winAmount > 0) {
          setOverlayData({ win: true, title: 'ПОБЕДА!', subtitle: `Выпало ${winNumber}`, amount: data.winAmount });
        } else {
          setOverlayData({ win: false, title: 'ПРОИГРЫШ', subtitle: `Выпало ${winNumber}`, amount: bet });
        }
        setShowOverlay(true);
      }, 3000);

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
      
      {/* Premium Roulette Tape */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        overflow: 'hidden', 
        background: '#0d0d0f', 
        padding: '30px 0', 
        borderRadius: '32px',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        {/* Pointer */}
        <div style={{ 
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', 
            width: '4px', height: '100%', 
            background: 'var(--gold-color)', 
            zIndex: 10, 
            boxShadow: '0 0 20px var(--gold-glow)',
            borderRadius: '2px'
        }} />
        
        <div 
          ref={tapeRef}
          style={{ 
            display: 'flex', 
            gap: '10px',
            padding: '0 10px',
            transition: spinning ? 'transform 3s cubic-bezier(0.1, 0, 0.1, 1)' : 'none',
            transform: `translateX(-${rotation}px)`
          }}
        >
          {tapeNumbers.map((num, i) => (
            <div key={i} style={{ 
              minWidth: '70px', 
              height: '70px', 
              background: getColor(num), 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '24px', 
              fontWeight: '950',
              border: `2px solid ${num === 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: '16px',
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* Betting Table Layout */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '12px',
        padding: '10px'
      }}>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setBetOn('red')}
          disabled={spinning}
          style={{ 
              gridColumn: 'span 1',
              padding: '24px 12px', 
              borderRadius: '20px', 
              background: betOn === 'red' ? '#ef4444' : 'rgba(239, 68, 68, 0.05)', 
              border: `2px solid ${betOn === 'red' ? '#fff' : 'rgba(239, 68, 68, 0.3)'}`, 
              color: '#fff', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: betOn === 'red' ? '0 10px 20px rgba(239, 68, 68, 0.3)' : 'none'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '900', opacity: 0.8, textTransform: 'uppercase' }}>Красное</span>
          <span style={{ fontSize: '20px', fontWeight: '950' }}>x2</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setBetOn('green')}
          disabled={spinning}
          style={{ 
              gridColumn: 'span 1',
              padding: '24px 12px', 
              borderRadius: '20px', 
              background: betOn === 'green' ? '#10b981' : 'rgba(16, 185, 129, 0.05)', 
              border: `2px solid ${betOn === 'green' ? '#fff' : 'rgba(16, 185, 129, 0.3)'}`, 
              color: '#fff', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: betOn === 'green' ? '0 10px 20px rgba(16, 185, 129, 0.3)' : 'none'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '900', opacity: 0.8, textTransform: 'uppercase' }}>Зеро</span>
          <span style={{ fontSize: '20px', fontWeight: '950' }}>x14</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setBetOn('black')}
          disabled={spinning}
          style={{ 
              gridColumn: 'span 1',
              padding: '24px 12px', 
              borderRadius: '20px', 
              background: betOn === 'black' ? '#1a1a1a' : 'rgba(255, 255, 255, 0.05)', 
              border: `2px solid ${betOn === 'black' ? '#fff' : 'rgba(255, 255, 255, 0.1)'}`, 
              color: '#fff', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: betOn === 'black' ? '0 10px 20px rgba(0, 0, 0, 0.3)' : 'none'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '900', opacity: 0.8, textTransform: 'uppercase' }}>Черное</span>
          <span style={{ fontSize: '20px', fontWeight: '950' }}>x2</span>
        </motion.button>
      </div>

      {/* Message & Status Overlay */}
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
            onPlay={handlePlay} 
            loading={spinning}
          />
      </div>

      {/* History Track */}
      {history.length > 0 && (
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '10px 0' }}>
              <div style={{ fontSize: '10px', opacity: 0.3, textTransform: 'uppercase', fontWeight: '900', paddingRight: '4px' }}>История:</div>
              {history.map((num, i) => (
                  <div key={i} style={{ 
                      width: '24px', height: '24px', 
                      borderRadius: '6px', 
                      background: getColor(num), 
                      color: '#fff', 
                      fontSize: '10px', 
                      fontWeight: '900', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                  }}>
                      {num}
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default Roulette;
