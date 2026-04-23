import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import ResultOverlay from './ResultOverlay';
import { Zap, Rocket, History, AlertCircle } from 'lucide-react';

const Crash: React.FC<any> = ({ balance, setBalance, tgUser, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [status, setStatus] = useState<'idle' | 'playing' | 'cashedOut' | 'crashed'>('idle');
  const [multiplier, setMultiplier] = useState(1.00);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ mult: number; win: boolean }[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayWin, setOverlayWin] = useState(false);
  const [overlayTitle, setOverlayTitle] = useState('');
  const [overlaySubtitle, setOverlaySubtitle] = useState('');
  const [overlayAmount, setOverlayAmount] = useState<number | undefined>(undefined);
  const [autoCashout, setAutoCashout] = useState(false);
  const [autoCashoutAt, setAutoCashoutAt] = useState(2.0);

  const startTimeRef = useRef<number | null>(null);
  const crashPointRef = useRef<number>(2.0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hashedCashedOutRef = useRef(false);
  const currentBetRef = useRef(bet);

  useEffect(() => { currentBetRef.current = bet; }, [bet]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetGame = () => {
    stopTimer();
    setStatus('idle');
    setMultiplier(1.00);
    setMessage('');
    setShowOverlay(false);
    hashedCashedOutRef.current = false;
  };

  // Cashout action — called either manually or by auto-cashout
  const doCashout = useCallback(async () => {
    if (hashedCashedOutRef.current || status !== 'playing') return;
    hashedCashedOutRef.current = true;
    stopTimer();

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
        setStatus('cashedOut');
        setBalance(data.balance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        const mult = data.multiplier ?? multiplier;
        setHistory(h => [{ mult, win: true }, ...h].slice(0, 12));
        setOverlayWin(true);
        setOverlayAmount(data.winAmount);
        setOverlayTitle('ВЫВЕДЕНО!');
        setOverlaySubtitle(`Множитель x${(data.multiplier ?? multiplier).toFixed(2)}`);
        setShowOverlay(true);
      } else if (data.status === 'crashed' || data.error?.includes('crashed')) {
        // Already crashed on server when we tried to cash out
        setStatus('crashed');
        const cp = data.crashPoint || multiplier;
        setHistory(h => [{ mult: cp, win: false }, ...h].slice(0, 12));
        setOverlayWin(false);
        setOverlayAmount(bet);
        setOverlayTitle('КРЭШ!');
        setOverlaySubtitle(`Взрыв на x${cp.toFixed(2)}`);
        setShowOverlay(true);
      } else if (data.error) {
        setMessage('⚠️ ' + data.error);
        hashedCashedOutRef.current = false;
        // Resume timer if it wasn't a crash? No, better restart or just show error.
      }
    } catch {
      setMessage('⚠️ Ошибка сети');
      hashedCashedOutRef.current = false;
    }
  }, [multiplier, setBalance, setTgUser, stopTimer, status, bet]);

  const startGame = async () => {
    if (balance < bet) { setMessage('❌ Недостаточно баланса'); return; }

    setLoading(true);
    setMessage('');
    setMultiplier(1.00);
    hashedCashedOutRef.current = false;

    try {
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Telegram-Id': tgUser?.telegram_id || tgUser?.id || ''
        },
        body: JSON.stringify({ game: 'crash', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
        setLoading(false);
        return;
      }

      // Balance already deducted on server
      setBalance(data.balance !== undefined ? data.balance : balance - bet);

      // Derive crash point from startTime — server stores crashPoint in state
      // The server uses: crashPoint stored in state, formula: Math.pow(E, 0.06 * elapsed)
      // We run the animation client‑side and cashout manually or auto
      startTimeRef.current = data.startTime ?? Date.now();

      // We don't know crashPoint here, so we track time and server will tell us on cashout
      // To know when it crashes without cashout, use a local simulation with a conservative max
      // The server's crashPoint is random 1–20x. We store a safe local max.
      crashPointRef.current = 20; // pessimistic max for animation

      setStatus('playing');
      setLoading(false);

      // Start multiplier animation
      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const mult = Math.pow(Math.E, 0.06 * elapsed);
        setMultiplier(mult);

        // Auto cashout
        if (autoCashout && mult >= autoCashoutAt && !hashedCashedOutRef.current) {
          doCashout();
        }

        // Safety stop animation after 5 minutes
        if (elapsed > 300) {
          stopTimer();
        }
      }, 50);

    } catch {
      setMessage('⚠️ Ошибка сети');
      setLoading(false);
    }
  };

  const handleManualCashout = () => {
    if (status !== 'playing' || loading || hashedCashedOutRef.current) return;
    doCashout();
  };

  // Color by multiplier
  const multColor = multiplier >= 5 ? '#f59e0b' : multiplier >= 2 ? '#10b981' : '#fff';

  // Points for the SVG chart
  const chartPoints = useCallback(() => {
    if (!startTimeRef.current || status !== 'playing') return '';
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const points: string[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = (elapsed * i) / steps;
      const m = Math.pow(Math.E, 0.06 * t);
      const x = (i / steps) * 340;
      const y = 200 - Math.min((m - 1) * 30, 180);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }, [multiplier, status]); // eslint-disable-line

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>

      <ResultOverlay
        show={showOverlay}
        win={overlayWin}
        title={overlayTitle}
        subtitle={overlaySubtitle}
        amount={overlayAmount}
        onClose={resetGame}
      />

      {/* ── CRASH VISUAL ── */}
      <div style={{
        width: '100%', height: '280px',
        background: '#0a0a0f',
        borderRadius: '28px',
        border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 40px rgba(168,85,247,0.03)'
      }}>
        {/* Grid lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <line key={`h${i}`} x1="0" y1={`${i * 25}%`} x2="100%" y2={`${i * 25}%`} stroke="#fff" strokeWidth="1" />
          ))}
          {[1, 2, 3, 4].map(i => (
            <line key={`v${i}`} x1={`${i * 25}%`} y1="0" x2={`${i * 25}%`} y2="100%" stroke="#fff" strokeWidth="1" />
          ))}
        </svg>

        {/* Chart line */}
        {status === 'playing' && (
          <svg style={{ position: 'absolute', bottom: '40px', left: '20px', right: '20px', height: '200px', width: 'calc(100% - 40px)' }}>
            <defs>
              <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="100%" stopColor={multColor} />
              </linearGradient>
            </defs>
            <polyline
              points={chartPoints()}
              fill="none"
              stroke="url(#cg)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Big multiplier */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <motion.div
            animate={status === 'playing' ? { scale: [1, 1.015, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.4 }}
            style={{
              fontSize: '80px', fontWeight: '950', fontFamily: 'monospace',
              lineHeight: 1, letterSpacing: '-3px',
              color: status === 'crashed' ? '#ef4444' : status === 'cashedOut' ? '#10b981' : multColor,
              textShadow: `0 0 40px ${status === 'crashed' ? 'rgba(239,68,68,0.4)' : `${multColor}44`}`
            }}
          >
            {multiplier.toFixed(2)}x
          </motion.div>

          <AnimatePresence>
            {status === 'playing' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '3px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Zap size={12} fill="currentColor" /> ЛЕТИМ ВВЕРХ...
              </motion.div>
            )}
            {status === 'crashed' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{ fontSize: '14px', fontWeight: '900', color: '#ef4444', marginTop: '8px' }}>
                💥 КРЭШ
              </motion.div>
            )}
            {status === 'cashedOut' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{ fontSize: '14px', fontWeight: '900', color: '#10b981', marginTop: '8px' }}>
                ✅ ВЫВЕДЕНО
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rocket */}
        {status === 'playing' && (
          <motion.div
            animate={{
              x: [0, 3, -3, 3, 0],
              y: [0, -3, 3, -3, 0],
            }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            style={{
              position: 'absolute', bottom: '60px', right: '40px',
              color: multColor, filter: `drop-shadow(0 0 12px ${multColor})`,
              transform: 'rotate(45deg)',
              zIndex: 5
            }}
          >
            <Rocket size={40} fill="currentColor" />
          </motion.div>
        )}
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
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

      {/* Controls */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {status === 'playing' ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleManualCashout}
            disabled={loading || hashedCashedOutRef.current}
            style={{
              width: '100%', height: '80px', borderRadius: '22px',
              background: 'var(--success-color)',
              border: 'none', color: '#fff', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
              boxShadow: '0 15px 35px rgba(16,185,129,0.4)',
              fontSize: '24px', fontWeight: '950',
            }}
          >
            <span style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '2px' }}>Вывести прямо сейчас</span>
            <span>${((currentBetRef.current * multiplier) / 100).toFixed(2)}</span>
          </motion.button>
        ) : (
          <>
            {/* Auto cashout toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(255,255,255,0.03)', padding: '12px 16px',
              borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)'
            }}>
              <button
                onClick={() => setAutoCashout(v => !v)}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: autoCashout ? '#10b981' : 'rgba(255,255,255,0.1)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.3s'
                }}
              >
                <div style={{
                  width: '18px', height: '18px', background: '#fff', borderRadius: '50%',
                  position: 'absolute', top: '3px',
                  left: autoCashout ? '22px' : '3px',
                  transition: 'left 0.3s'
                }} />
              </button>
              <span style={{ fontSize: '13px', fontWeight: '800', flex: 1 }}>
                Авто-вывод при x{autoCashoutAt.toFixed(1)}
              </span>
              {autoCashout && (
                <input
                  type="range" min="1.2" max="10" step="0.1" value={autoCashoutAt}
                  onChange={e => setAutoCashoutAt(parseFloat(e.target.value))}
                  style={{ width: '80px', accentColor: '#10b981' }}
                />
              )}
            </div>

            <BetControls bet={bet} setBet={setBet} minBet={100} maxBet={100000} onPlay={startGame} loading={loading} />
          </>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <History size={14} style={{ opacity: 0.25, flexShrink: 0 }} />
          {history.map((h, i) => (
            <div key={i} style={{
              padding: '5px 12px', borderRadius: '10px', flexShrink: 0,
              background: h.win ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${h.win ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: h.win ? '#10b981' : '#ef4444',
              fontSize: '12px', fontWeight: '900'
            }}>
              {h.win ? '✓' : '✗'} {h.mult.toFixed(2)}x
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Crash;
