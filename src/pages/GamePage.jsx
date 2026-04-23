import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Wallet, Info, History } from 'lucide-react';

// Individual Game Components (to be implemented)
import Slots from '../components/games/Slots';
import Roulette from '../components/games/Roulette';
import Blackjack from '../components/games/Blackjack';
import Crash from '../components/games/Crash';
import Plinko from '../components/games/Plinko';
import Mines from '../components/games/Mines';
import Dice from '../components/games/Dice';
import CoinFlip from '../components/games/CoinFlip';
import HiLo from '../components/games/HiLo';
import WheelOfFortune from '../components/games/WheelOfFortune';
import Tower from '../components/games/Tower';
import Keno from '../components/games/Keno';
import Scratch from '../components/games/Scratch';
import Baccarat from '../components/games/Baccarat';

const GAME_INFO = {
  slots: { name: 'Royal Slots', color: '#f59e0b' },
  roulette: { name: 'Galaxy Roulette', color: '#ef4444' },
  blackjack: { name: 'Blackjack', color: '#3b82f6' },
  crash: { name: 'Neon Crash', color: '#10b981' },
  plinko: { name: 'Plinko Master', color: '#a855f7' },
  mines: { name: 'Cyber Mines', color: '#f43f5e' },
  dice: { name: 'Quantum Dice', color: '#6366f1' },
  coinflip: { name: 'Flip & Win', color: '#fbbf24' },
  hilo: { name: 'Hi-Lo', color: '#2dd4bf' },
  wheel: { name: 'Wheel of Luck', color: '#8b5cf6' },
  tower: { name: 'Dragon Tower', color: '#ea580c' },
  keno: { name: 'Keno Classic', color: '#06b6d4' },
  scratch: { name: 'Gold Rush', color: '#fbbf24' },
  baccarat: { name: 'Royal Baccarat', color: '#db2777' },
};

const GamePage = ({ balance, setBalance, tgUser, setTgUser }) => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);

  const game = gameId ? GAME_INFO[gameId] : null;

  useEffect(() => {
    if (!game) navigate('/games');
  }, [gameId, game, navigate]);

  if (!game) return null;

  const renderGame = () => {
    const props = { balance, setBalance, tgUser, setTgUser, gameId };
    switch (gameId) {
      case 'slots': return <Slots {...props} />;
      case 'roulette': return <Roulette {...props} />;
      case 'blackjack': return <Blackjack {...props} />;
      case 'crash': return <Crash {...props} />;
      case 'plinko': return <Plinko {...props} />;
      case 'mines': return <Mines {...props} />;
      case 'dice': return <Dice {...props} />;
      case 'coinflip': return <CoinFlip {...props} />;
      case 'hilo': return <HiLo {...props} />;
      case 'wheel': return <WheelOfFortune {...props} />;
      case 'tower': return <Tower {...props} />;
      case 'keno': return <Keno {...props} />;
      case 'scratch': return <Scratch {...props} />;
      case 'baccarat': return <Baccarat {...props} />;
      default: return <div style={{ textAlign: 'center', padding: '40px' }}>Game not found</div>;
    }
  };

  return (
    <div className="game-page-container casino-gradient-bg" style={{ 
      minHeight: '100vh', 
      color: '#fff',
      paddingBottom: '80px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow */}
      <div style={{ 
        position: 'absolute', 
        top: '-10%', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: '100%', 
        height: '400px', 
        background: `radial-gradient(circle, ${game.color}15 0%, transparent 70%)`,
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Premium Header */}
      <header style={{ 
        padding: '24px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.4)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(15px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => navigate('/games')}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '42px', height: '42px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>YourTurn GAMING</span>
            <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#fff' }}>{game.name}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '10px 18px', borderRadius: '16px', border: '1px solid var(--gold-glow)', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.1)' }}>
                <Wallet size={16} color="var(--gold-color)" />
                <span style={{ fontWeight: '900', color: 'var(--gold-color)', fontSize: '17px' }}>${((balance || 0) / 100).toFixed(2)}</span>
            </div>
        </div>
      </header>

      {/* Game Area */}
      <main style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
        {renderGame()}
      </main>

      {/* Floating Action Buttons */}
      <div style={{ 
        position: 'fixed', 
        bottom: '30px', 
        right: '25px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px',
        zIndex: 150
      }}>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          style={{ width: '54px', height: '54px', borderRadius: '18px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', transition: 'all 0.2s' }}
        >
          <History size={24} />
        </button>
        <button 
          style={{ width: '54px', height: '54px', borderRadius: '18px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', transition: 'all 0.2s' }}
        >
          <Info size={24} />
        </button>
      </div>

      {/* History Modal (Sleek Overlay) */}
      {showHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
            <div className="casino-card" style={{ width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '32px 24px', animation: 'slideUp 0.3s ease-out', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>История раундов</h3>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>Последние 20</div>
                </div>
                
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[1, 2, 3].map((_, i) => (
                             <div key={i} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>12.04.2026 14:32</div>
                                    <div style={{ fontWeight: '800' }}>Ставка: $1.00</div>
                                </div>
                                <div style={{ color: i === 0 ? 'var(--casino-green)' : 'var(--casino-red)', fontWeight: '900', fontSize: '18px' }}>
                                    {i === 0 ? '+$2.50' : '-$1.00'}
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
                
                <button 
                    onClick={() => setShowHistory(false)}
                    className="btn-primary" 
                    style={{ width: '100%', marginTop: '32px', height: '60px' }}
                >
                    Закрыть
                </button>
            </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GamePage;
