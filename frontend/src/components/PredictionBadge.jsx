export default function PredictionBadge({ probability = 0 }) {
  const p = Math.round(probability * 100)
  
  let type = 'danger'
  if (p >= 80) type = 'success'
  else if (p >= 50) type = 'warning'

  const colors = {
    success: { bg: 'rgba(62, 207, 142, 0.1)', text: 'var(--primary)', dot: 'var(--primary)' },
    warning: { bg: 'rgba(245, 176, 65, 0.1)', text: 'var(--warning)', dot: 'var(--warning)' },
    danger: { bg: 'rgba(255, 93, 93, 0.1)', text: 'var(--danger)', dot: 'var(--danger)' }
  }

  const theme = colors[type]

  return (
    <div className="prediction-badge" style={{ background: theme.bg, color: theme.text }}>
      <div className="pulse-dot" style={{ background: theme.dot }} />
      <span className="percentage">{p}%</span>
      <span className="label">Match</span>

      <style>{`
        .prediction-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
        }
        .pulse-dot::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: inherit;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .label {
          font-size: 10px;
          text-transform: uppercase;
          opacity: 0.7;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  )
}
