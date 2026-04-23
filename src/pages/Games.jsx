import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CircleDot, 
  TrendingUp, 
  ArrowDownCircle, 
  Bomb, 
  Coins, 
  Zap,
  Gamepad2,
  Trophy,
  History,
  Star,
  Flame,
  Castle,
  LayoutGrid,
  FileText,
  Shield
} from 'lucide-react';

const GAME_LIST = [
  { id: 'slots', name: 'Royal Slots', icon: <Gamepad2 size={32} />, color: '#f59e0b', desc: 'Классические автоматы с джекпотом' },
  { id: 'crash', name: 'Neon Crash', icon: <TrendingUp size={32} />, color: '#10b981', desc: 'Успей забрать до взрыва' },
  { id: 'mines', name: 'Cyber Mines', icon: <Bomb size={32} />, color: '#f43f5e', desc: 'Найди алмазы, обходи мины' },
  { id: 'roulette', name: 'Galaxy Roulette', icon: <CircleDot size={32} />, color: '#ef4444', desc: 'Европейская классика' },
  { id: 'plinko', name: 'Plinko Master', icon: <ArrowDownCircle size={32} />, color: '#a855f7', desc: 'Падение шарика за множителем' },
  { id: 'dice', name: 'Quantum Dice', icon: <Flame size={32} />, color: '#6366f1', desc: 'Угадай число на костях' },
  { id: 'coinflip', name: 'Flip & Win', icon: <Coins size={32} />, color: '#fbbf24', desc: 'Орел или Решка?' },
  { id: 'wheel', name: 'Wheel of Luck', icon: <Zap size={32} />, color: '#8b5cf6', desc: 'Колесо фортуны' },
  { id: 'tower', name: 'Dragon Tower', icon: <Castle size={32} />, color: '#ea580c', desc: 'Покори вершину башни' },
  { id: 'keno', name: 'Keno Classic', icon: <LayoutGrid size={32} />, color: '#06b6d4', desc: 'Угадай счастливые числа' },
  { id: 'scratch', name: 'Gold Rush', icon: <FileText size={32} />, color: '#fbbf24', desc: 'Сотри и выиграй ' },
  { id: 'baccarat', name: 'Royal Baccarat', icon: <Shield size={32} />, color: '#db2777', desc: 'Статусная карточная игра' },
];

const Games = ({ balance }) => {
  const navigate = useNavigate();

  return (
    <div className="page casino-gradient-bg" style={{ paddingBottom: '120px', minHeight: '100vh' }}>
      <header style={{ 
        marginBottom: '40px', 
        textAlign: 'center',
        position: 'relative',
        paddingTop: '20px'
      }}>
        {/* ambient glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '260px', height: '120px',
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.25) 0%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(168,85,247,0.12)',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '999px',
          padding: '5px 14px',
          fontSize: '11px', fontWeight: '800',
          color: 'rgba(168,85,247,1)',
          textTransform: 'uppercase', letterSpacing: '2px',
          marginBottom: '14px',
          position: 'relative', zIndex: 1
        }}>
          <Star size={11} fill="currentColor" /> Elite Gaming Platform
        </div>

        <h1 style={{
          fontSize: '48px',
          fontWeight: '950',
          letterSpacing: '-2px',
          lineHeight: 1,
          margin: '0 0 6px 0',
          background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          position: 'relative',
          zIndex: 1
        }}>
          Your<span style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 60%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Turn</span>
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.35)',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '4px',
          marginBottom: 0,
          position: 'relative',
          zIndex: 1
        }}>
          Make your move
        </p>
      </header>

      {/* Stats Mini Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '16px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--gold-glow)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={18} color="var(--gold-color)" />
          </div>
          <div>
            <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>Твой Баланс</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--gold-color)' }}>${((balance || 0) / 100).toFixed(2)}</div>
          </div>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '16px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(30, 64, 175, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History size={18} color="var(--primary-color)" />
          </div>
          <div>
            <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>Активные Игры</div>
            <div style={{ fontSize: '18px', fontWeight: '900' }}>8</div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="games-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px' 
      }}>
        {GAME_LIST.map((game) => (
          <div 
            key={game.id}
            onClick={() => navigate(`/game/${game.id}`)}
            className="casino-card"
            style={{
              padding: '28px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '14px',
              cursor: 'pointer',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
            }}
          >
            {/* Hover Glow */}
            <div className="game-card-glow" style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              width: '120px', 
              height: '120px', 
              background: game.color, 
              filter: 'blur(45px)', 
              opacity: 0, 
              transform: 'translate(-50%, -50%)',
              transition: 'opacity 0.3s'
            }} />

            <div style={{ 
              width: '72px', 
              height: '72px', 
              borderRadius: '22px', 
              background: `linear-gradient(135deg, ${game.color}22, ${game.color}44)`, 
              border: `1px solid ${game.color}44`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: game.color,
              boxShadow: `0 12px 24px ${game.color}15`,
              position: 'relative',
              zIndex: 1
            }}>
              {game.icon}
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontWeight: '900', fontSize: '18px', color: '#fff', marginBottom: '6px' }}>{game.name}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', lineHeight: '1.4', padding: '0 8px' }}>{game.desc}</div>
            </div>

            <div style={{ 
              marginTop: '8px',
              padding: '8px 20px', 
              borderRadius: '14px', 
              background: 'rgba(255,255,255,0.05)', 
              fontSize: '13px', 
              fontWeight: '900',
              color: '#fff',
              border: `1px solid rgba(255,255,255,0.1)`,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Играть
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .casino-card:hover .game-card-glow {
          opacity: 0.15;
        }
        .casino-card:active {
          transform: scale(0.96);
        }
      `}</style>
    </div>
  );
};

export default Games;
