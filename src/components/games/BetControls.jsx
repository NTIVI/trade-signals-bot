import type { FC } from 'react';

interface BetControlsProps {
  bet: number;
  setBet: (val: number) => void;
  minBet: number;
  maxBet: number;
  onPlay: () => void;
  loading: boolean;
  disabled?: boolean;
}

const BetControls: FC<BetControlsProps> = ({ bet, setBet, minBet, maxBet, onPlay, loading, disabled }) => {
  const handleHalf = () => setBet(Math.max(minBet, Math.floor(bet / 2)));
  const handleDouble = () => setBet(Math.min(maxBet, bet * 2));

  return (
    <div className="bet-controls-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {[1, 5, 10, 50, 100].map(val => (
            <button 
                key={val}
                onClick={() => setBet(Math.min(maxBet, Math.max(minBet, val * 100)))}
                disabled={loading || disabled}
                style={{ flex: 1, padding: '8px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', color: '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
            >
                ${val}
            </button>
        ))}
      </div>

      <div className="bet-input-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '18px', padding: '6px', border: '1px solid rgba(255,255,255,0.05)', gap: '6px' }}>
        <button 
            onClick={handleHalf}
            disabled={loading || disabled}
            style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
        >
            1/2
        </button>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '15px', color: 'var(--gold-color)', fontWeight: '800' }}>$</span>
            <input 
                type="number" 
                value={(bet / 100).toFixed(2)}
                onChange={(e) => setBet(Math.floor(parseFloat(e.target.value) * 100) || 0)}
                disabled={loading || disabled}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', padding: '10px 10px 10px 30px', fontSize: '18px', fontWeight: '900', textAlign: 'center' }}
            />
        </div>
        <button 
            onClick={handleDouble}
            disabled={loading || disabled}
            style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
        >
            x2
        </button>
      </div>

      <button 
        className="btn-primary" 
        onClick={onPlay}
        disabled={loading || disabled || bet < minBet || bet > maxBet}
        style={{ 
            width: '100%', 
            height: '60px', 
            borderRadius: '20px', 
            fontSize: '18px', 
            fontWeight: '900', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            boxShadow: '0 10px 20px rgba(168, 85, 247, 0.3)'
        }}
      >
        {loading ? <div className="spinner" style={{ width: '24px', height: '24px' }} /> : (
            <>
                {bet > 0 ? `СТАВКА $${(bet / 100).toFixed(2)}` : 'ВЫБЕРИТЕ СТАВКУ'}
            </>
        )}
      </button>
    </div>
  );
};

export default BetControls;
