import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Hourglass, Users, XCircle, Trash2, Zap, Bookmark } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useSavedIssues, useToggleSave } from '../hooks/useSaved'
import { difficultyLabel, timeAgo } from '../lib/format'

const STATUS = {
  open: { label: 'Open field', color: 'var(--success)', icon: CheckCircle2 },
  stale: { label: 'Gone quiet', color: 'var(--info)', icon: Hourglass },
  crowded: { label: 'Contested', color: 'var(--warning)', icon: Users },
  gone: { label: 'Closed', color: 'var(--danger)', icon: XCircle },
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}
const rowVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
}

// Half-circle meter: how hot the race for this issue is, 0 (nobody) to 100 (taken).
function RaceMeter({ heat, color }) {
  const radius = 34
  const length = Math.PI * radius
  return (
    <div className="race-meter" title={`Race heat ${heat} of 100`}>
      <svg viewBox="0 0 84 48" width="84" height="48" aria-hidden="true">
        <path d="M 8 42 A 34 34 0 0 1 76 42" fill="none" stroke="var(--border)" strokeWidth="6" strokeLinecap="round" />
        <motion.path
          d="M 8 42 A 34 34 0 0 1 76 42"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={length}
          initial={{ strokeDashoffset: length }}
          animate={{ strokeDashoffset: length * (1 - heat / 100) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="race-value">{heat}</span>
      <span className="race-label">Race heat</span>
    </div>
  )
}

export default function SavedIssues() {
  const { data, isLoading, isError } = useSavedIssues()
  const toggle = useToggleSave()
  const saved = data?.saved ?? []

  const counts = saved.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {})

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h2>Claim Radar</h2>
          <p>Your saved issues, sorted by which to grab first. Open ones with your best odds are at the top.</p>
        </motion.header>

        {saved.length > 0 && (
          <div className="radar-summary">
            {Object.entries(STATUS).map(([key, { label, color, icon: Icon }]) => (
              <div key={key} className="radar-chip">
                <Icon size={14} style={{ color }} />
                <span className="radar-chip-count">{counts[key] || 0}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {isLoading && <p className="text-muted">Loading saved issues...</p>}
        {isError && <p className="text-muted">Couldn't load saved issues.</p>}
        {!isLoading && !isError && saved.length === 0 && (
          <div className="card empty-state">
            <Bookmark size={28} className="text-primary" />
            <h3>Nothing saved yet</h3>
            <p>Hit <strong>Save</strong> on any issue. The radar then watches it and warns you when others start crowding in.</p>
            <Link to="/issues" className="button button-primary" style={{ marginTop: 16, textDecoration: 'none' }}>Explore issues</Link>
          </div>
        )}

        <motion.div className="radar-list" variants={listVariants} initial="hidden" animate="visible">
          <AnimatePresence>
            {saved.map(item => {
              const status = STATUS[item.status]
              const StatusIcon = status.icon
              return (
                <motion.article key={item.issue_id} className="card radar-row" variants={rowVariants} exit="exit" layout>
                  <RaceMeter heat={item.heat} color={status.color} />

                  <div className="radar-body">
                    <span className="radar-repo">{item.repo}</span>
                    <Link to={`/issues/${item.issue_id}`} className="radar-title">{item.title}</Link>
                    <div className="radar-status">
                      <span className="status-tag" style={{ borderColor: status.color }}>
                        <StatusIcon size={12} style={{ color: status.color }} /> {status.label}
                      </span>
                      <span className="text-muted">{item.reason}</span>
                    </div>
                    <div className="radar-meta">
                      <span>{difficultyLabel(item.difficulty) ?? '—'}</span>
                      {item.language && <span>{item.language}</span>}
                      <span>{item.comments_count} comments{item.new_comments > 0 ? ` (+${item.new_comments} since saved)` : ''}</span>
                      <span>Saved {timeAgo(item.saved_at)}</span>
                    </div>
                  </div>

                  <div className="radar-side">
                    <div className="odds">
                      <span className="odds-value">
                        {item.success_prob != null ? `${Math.round(item.success_prob * 100)}%` : '—'}
                      </span>
                      <span className="odds-label">Your odds</span>
                    </div>
                    <div className="radar-actions">
                      <Link to={`/issues/${item.issue_id}`} className="button button-ghost" title="View & predict">
                        <Zap size={16} />
                      </Link>
                      <button
                        type="button"
                        className="button button-ghost"
                        title="Remove from saved"
                        onClick={() => toggle.mutate({ issueId: item.issue_id, saved: true })}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {saved.length > 0 && (
          <p className="text-muted text-small">
            Comment counts update with each issue refresh, so the radar is only as fresh as the last ingest.
          </p>
        )}
      </main>

      <style>{`
        .dashboard-main { flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 0; }
        .radar-summary { display: flex; gap: 12px; flex-wrap: wrap; }
        .radar-chip {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 12px; border-radius: 99px;
          background: var(--elevated); border: 1px solid var(--border);
          font-size: 13px; color: var(--text-secondary);
        }
        .radar-chip-count { font-weight: 700; color: var(--text); }
        .empty-state { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 32px; }
        .radar-list { display: flex; flex-direction: column; gap: 16px; }
        .radar-row { display: grid; grid-template-columns: 96px 1fr auto; gap: 20px; align-items: center; }
        .race-meter { position: relative; display: flex; flex-direction: column; align-items: center; }
        .race-value { position: absolute; top: 20px; font-size: 18px; font-weight: 800; color: var(--text); }
        .race-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-top: 2px; }
        .radar-body { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .radar-repo { font-size: 13px; color: var(--text-secondary); }
        .radar-title { font-size: 17px; font-weight: 600; color: var(--text); text-decoration: none; line-height: 1.4; }
        .radar-title:hover { color: var(--primary); }
        .radar-status { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-size: 13px; }
        .status-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 2px 8px; border-radius: 99px; border: 1px solid;
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text);
        }
        .radar-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: var(--muted); }
        .radar-side { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
        .odds { display: flex; flex-direction: column; align-items: flex-end; }
        .odds-value { font-size: 22px; font-weight: 800; color: var(--text); }
        .odds-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
        .radar-actions { display: flex; gap: 4px; }
        @media (max-width: 768px) {
          .radar-row { grid-template-columns: 1fr; }
          .radar-side { flex-direction: row; justify-content: space-between; align-items: center; }
        }
      `}</style>
    </div>
  )
}
