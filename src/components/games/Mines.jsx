import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Gem, Bomb, AlertCircle, Trophy, TrendingUp } from 'lucide-react';

interface MinesProps {
  balance: number;
  setBalance: (val: number) => void;
  tgUser?: any;
  setTgUser?: (val: (prev: any) => any) => void;
}

const Mines: React.FC<MinesProps> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [mineCount, setMineCount] = useState(3);
  const [status, setStatus] = useState<'idle' | 'playing' | 'win' | 'lose'>('idle');
  const [revealed, setRevealed] = useState<number[]>([]);
  const [mines, setMines] = useState<boolean[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayWin, setOverlayWin] = useState(false);
  const [overlayTitle, setOverlayTitle] = useState('');
  const [overlaySubtitle, setOverlaySubtitle] = useState('');
  const [overlayAmount, setOverlayAmount] = useState<number | undefined>(undefined);

  // Clear message after 3s if not terminal state
  useEffect(() => {
    if (message && status !== 'win' && status !== 'lose') {
      const t = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [message, status]);

  const resetGame = () => {
    setStatus('idle');
    setRevealed([]);
    setMines([]);
    setCurrentMultiplier(1);
    setMessage('');
    setShowOverlay(false);
  };

  const startGame = async () => {
    if (balance < bet) { setMessage('❌ Недостаточно баланса'); return; }

    setLoading(true);
    setRevealed([]);
    setMines([]);
    setCurrentMultiplier(1);
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
        body: JSON.stringify({ game: 'mines', bet, mineCount }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
      } else {
        setStatus('playing');
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
      }
    } catch {
      setMessage('⚠️ Ошибка сети. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async (index: number) => {
    if (status !== 'playing' || revealed.includes(index) || mines.length > 0 || loading) return;

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
        body: JSON.stringify({ action: 'open', index }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
        return;
      }

      if (data.status === 'lose') {
        setStatus('lose');
        setMines(data.mines || []);
        // Show overlay after short delay so mine reveal animates
        setTimeout(() => {
          setOverlayWin(false);
          setOverlayAmount(bet);
          setOverlayTitle('ВЗРЫВ!');
          setOverlaySubtitle('Вы наступили на мину 💣');
          setShowOverlay(true);
        }, 600);
      } else if (data.status === 'playing') {
        setRevealed(data.revealed);
        setCurrentMultiplier(data.currentMultiplier);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
      }
    } catch {
      setMessage('⚠️ Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const cashOut = async () => {
    if (status !== 'playing' || revealed.length === 0 || loading) return;

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

      if (data.error) { setMessage('⚠️ ' + data.error); return; }

      if (data.status === 'win') {
        setStatus('win');
        setBalance(data.balance);
        setMines(data.mines || []);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        setOverlayWin(true);
        setOverlayAmount(data.winAmount);
        setOverlayTitle('ПОБЕДА!');
        setOverlaySubtitle(`Множитель x${currentMultiplier.toFixed(2)}`);
        setShowOverlay(true);
      }
    } catch {
      setMessage('⚠️ Ошибка при выводе');
    } finally {
      setLoading(false);
    }
  };

  const getCellState = (i: number): 'gem' | 'mine' | 'hidden' | 'unrevealed' => {
    if (revealed && revealed.includes(i)) return 'gem';
    if (mines && mines.length > 0 && mines[i]) return 'mine';
    if (mines && mines.length > 0 && !mines[i]) return 'hidden'; // safe unrevealed after game
    return 'unrevealed';
  };

  const cellStyle = (state: ReturnType<typeof getCellState>): React.CSSProperties => {
    const base: React.CSSProperties = {
      aspectRatio: '1',
      borderRadius: '12px',
      cursor: status === 'playing' && state === 'unrevealed' && !loading ? 'pointer' : 'default',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
    };
    switch (state) {
      case 'gem': return { ...base, background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)' };
      case 'mine': return { ...base, background: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.5)' };
      case 'hidden': return { ...base, background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.1)' };
      default: return { ...base, background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', minHeight: '500px' }}>

      {/* Win/Loss overlay */}
      <ResultOverlay
        show={showOverlay}
        win={overlayWin}
        title={overlayTitle}
        subtitle={overlaySubtitle}
        amount={overlayAmount}
        onClose={resetGame}
      />

      {/* HUD */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', width: '100%',
        maxWidth: '360px', padding: '16px 20px',
        background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div>
          <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>Множитель</div>
          <div style={{ fontSize: '26px', fontWeight: '950', color: 'var(--gold-color)' }}>
            x{currentMultiplier.toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>Профит</div>
          <div style={{ fontSize: '26px', fontWeight: '950', color: 'var(--success-color)' }}>
            +${((bet * Math.max(currentMultiplier - 1, 0)) / 100).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '14px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: '14px', fontWeight: '800', color: '#ef4444'
            }}
          >
            <AlertCircle size={16} /> {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5×5 GRID */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px', width: '100%', maxWidth: '360px',
        background: 'rgba(255,255,255,0.02)', padding: '14px',
        borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {Array.from({ length: 25 }).map((_, i) => {
          const state = getCellState(i);
          const isClickable = status === 'playing' && state === 'unrevealed' && !loading;

          return (
            <motion.div
              key={i}
              onClick={() => handleOpen(i)}
              whileHover={isClickable ? { scale: 1.08, backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
              whileTap={isClickable ? { scale: 0.92 } : {}}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.015, duration: 0.2 }}
              style={cellStyle(state)}
            >
              <AnimatePresence mode="wait">
                {state === 'gem' && (
                  <motion.div
                    key="gem"
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    <Gem size={22} color="#10b981" fill="#10b981"
                      style={{ filter: 'drop-shadow(0 0 8px #10b981)' }} />
                  </motion.div>
                )}
                {state === 'mine' && (
                  <motion.div
                    key="mine"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.4, times: [0, 0.6, 1] }}
                  >
                    <Bomb size={22} color="#ef4444" fill="#ef4444"
                      style={{ filter: 'drop-shadow(0 0 10px #ef4444)' }} />
                  </motion.div>
                )}
                {state === 'unrevealed' && (
                  <motion.div key="q" style={{ fontSize: '16px', opacity: 0.15 }}>?</motion.div>
                )}
                {state === 'hidden' && (
                  <motion.div key="safe" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Gem size={16} color="rgba(16,185,129,0.2)" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {status === 'playing' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Cashout */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={cashOut}
              disabled={revealed.length === 0 || loading}
              style={{
                width: '100%', height: '64px', borderRadius: '20px',
                background: revealed.length === 0 ? 'rgba(255,255,255,0.05)' : 'var(--success-color)',
                border: 'none', color: '#fff', cursor: revealed.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                boxShadow: revealed.length > 0 ? '0 10px 25px rgba(16,185,129,0.35)' : 'none',
                opacity: revealed.length === 0 ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? (
                <div style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>
                  <span style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Trophy size={12} /> Забрать выигрыш
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: '950' }}>
                    ${((bet * currentMultiplier) / 100).toFixed(2)}
                  </span>
                </>
              )}
            </motion.button>

            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 4px' }}>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${(revealed.length / (25 - mineCount)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '4px' }}
                />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>
                {revealed.length}/{25 - mineCount}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Mine count */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '14px 18px', borderRadius: '18px',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <Bomb size={18} color="#ef4444" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', marginBottom: '2px' }}>
                  Мины: <span style={{ color: '#ef4444', fontWeight: '900' }}>{mineCount}</span>
                </div>
                <input
                  type="range" min="1" max="24" value={mineCount}
                  onChange={e => setMineCount(parseInt(e.target.value))}
                  disabled={loading}
                  style={{ width: '100%', accentColor: '#ef4444' }}
                />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', fontWeight: '800', color: 'var(--success-color)',
                background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '10px'
              }}>
                <TrendingUp size={12} />
                x{(1 + mineCount * 0.15).toFixed(2)}
              </div>
            </div>

            <BetControls bet={bet} setBet={setBet} minBet={50} maxBet={100000} onPlay={startGame} loading={loading} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Mines;
