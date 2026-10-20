import { Link } from 'react-router-dom'
import { Zap, Star, GitFork } from 'lucide-react'
import { motion } from 'framer-motion'
import PredictionBadge from './PredictionBadge'
import AnimatedNumber from './AnimatedNumber'
import SaveButton from './SaveButton'
import { difficultyLabel } from '../lib/format'

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export default function IssueCard({ issue, scoreLabel = 'Match' }) {
  const {
    issue_id,
    title,
    repo,
    labels = [],
    difficulty,
    score = 0,
    language,
    stars = 0,
    forks = 0,
  } = issue

  return (
    <motion.article
      className="card issue-card"
      variants={cardVariants}
      whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2 } }}
    >
      <div className="card-header">
        <div className="repo-info">
          <span className="repo-name">{repo}</span>
          <div className="repo-stats">
            <span className="stat"><Star size={12} /> {stars}</span>
            <span className="stat"><GitFork size={12} /> {forks}</span>
          </div>
        </div>
        <PredictionBadge probability={score / 100} label={scoreLabel} />
      </div>

      <div className="card-body">
        <h3 className="issue-title">{title}</h3>

        <div className="labels-row">
          {labels.map((l) => (
            <span key={l} className="badge badge-outline">{l}</span>
          ))}
          {language && <span className="badge badge-primary">{language}</span>}
        </div>

        <div className="metrics-row">
          <div className="metric">
            <span className="metric-label">{scoreLabel}:</span>
            <span className="metric-value text-success"><AnimatedNumber value={score} suffix="%" /></span>
          </div>
          <div className="metric">
            <span className="metric-label">Difficulty:</span>
            <span className="metric-value">{difficultyLabel(difficulty) ?? '—'}</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <SaveButton issueId={issue_id} />
        <Link to={`/issues/${issue_id}`}>
          <motion.span
            className="button button-primary"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <Zap size={16} />
            <span>View & Predict</span>
          </motion.span>
        </Link>
      </div>

      <style>{`
        .issue-card {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .repo-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .repo-name {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .repo-stats {
          display: flex;
          gap: 12px;
          color: var(--muted);
          font-size: 11px;
        }
        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .issue-title {
          font-size: 18px;
          margin-bottom: 12px;
          line-height: 1.4;
          color: var(--text);
        }
        .labels-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .badge {
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .badge-outline {
          border: 1px solid var(--border);
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.03);
        }
        .badge-primary {
          background: var(--border-light);
          color: var(--primary);
          border: 1px solid var(--border-light);
        }
        .metrics-row {
          display: flex;
          gap: 24px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
        }
        .metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .metric-label {
          font-size: 10px;
          color: var(--muted);
          text-transform: uppercase;
        }
        .metric-value {
          font-size: 14px;
          font-weight: 700;
        }
        .text-success { color: var(--success); }
        .card-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .card-footer a {
          text-decoration: none;
        }
      `}</style>
    </motion.article>
  )
}
