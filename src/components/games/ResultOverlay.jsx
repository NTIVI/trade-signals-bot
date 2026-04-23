import { motion, AnimatePresence } from 'framer-motion';

interface ResultOverlayProps {
  show: boolean;
  win: boolean;
  title: string;
  subtitle?: string;
  amount?: number;
  onClose: () => void;
}

const ResultOverlay = ({ show, win, title, subtitle, amount, onClose }: ResultOverlayProps) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          style={{
            textAlign: 'center', padding: '40px 48px',
            borderRadius: '36px',
            background: win
              ? 'linear-gradient(135deg, #064e3b 0%, #0d2818 100%)'
              : 'linear-gradient(135deg, #4c0519 0%, #1a0508 100%)',
            border: `2px solid ${win ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            boxShadow: win
              ? '0 30px 80px rgba(16,185,129,0.3)'
              : '0 30px 80px rgba(239,68,68,0.3)',
            maxWidth: '300px',
          }}
        >
          {/* Emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 250, damping: 12 }}
            style={{ fontSize: '72px', marginBottom: '16px', lineHeight: 1 }}
          >
            {win ? '🏆' : '💥'}
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: '32px', fontWeight: '950', lineHeight: 1,
              color: win ? '#10b981' : '#ef4444',
              textShadow: win ? '0 0 30px rgba(16,185,129,0.5)' : '0 0 30px rgba(239,68,68,0.5)',
              marginBottom: amount !== undefined ? '8px' : '24px'
            }}
          >
            {title}
          </motion.div>

          {/* Amount Display */}
          {amount !== undefined && (
             <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
              style={{
                fontSize: '42px', 
                fontWeight: '950', 
                color: '#fff',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
             >
                <span style={{ color: win ? '#10b981' : '#ef4444' }}>{win ? '+' : '-'}</span>
                <span>${(Math.abs(amount) / 100).toFixed(2)}</span>
             </motion.div>
          )}

          {subtitle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginBottom: '24px' }}
            >
              {subtitle}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px' }}
          >
            Нажмите чтобы продолжить
          </motion.div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ResultOverlay;
