import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Star } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useTrending } from '../hooks/useInsights'
import { difficultyLabel } from '../lib/format'

const WINDOWS = [7, 30, 90]

// Fixed order, one hue per signal (validated for CVD separation on the card surface).
const SIGNALS = [
  { key: 'fresh_issues', label: 'New issues', unit: 'new issues', color: '#26A06A' },
  { key: 'merges', label: 'PRs merged', unit: 'PRs merged', color: '#4A97CC' },
  { key: 'newcomers', label: 'First-time contributors', unit: 'first-timers', color: '#C4842A' },
]

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}
const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

function HeatBar({ repo, top }) {
  const [hovered, setHovered] = useState(null)
  const total = SIGNALS.reduce((sum, s) => sum + repo.points[s.key], 0)
  const hoveredSignal = SIGNALS.find(s => s.key === hovered)

  return (
    <div className="heat-bar-wrap">
      <div className="heat-bar" role="img" aria-label={SIGNALS.map(s => `${s.label} ${repo[s.key]}`).join(', ')}>
        {SIGNALS.filter(s => repo.points[s.key] > 0).map(s => (
          <motion.div
            key={s.key}
            className="heat-segment"
            style={{ background: s.color, opacity: hovered && hovered !== s.key ? 0.4 : 1 }}
            initial={{ width: 0 }}
            animate={{ width: `${(repo.points[s.key] / top) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => setHovered(s.key)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>
      <div className="heat-caption">
        {hoveredSignal ? (
          <span>
            <span className="swatch" style={{ background: hoveredSignal.color }} />
            {hoveredSignal.label}: <strong>{repo[hoveredSignal.key]}</strong>
            {hoveredSignal.key === 'fresh_issues' && repo.beginner_issues > 0 && ` (${repo.beginner_issues} beginner-labelled)`}
            {' '}· {repo.points[hoveredSignal.key]} of {total} pts
          </span>
        ) : (
          <span>{SIGNALS.map(s => `${repo[s.key]} ${s.unit}`).join(' · ')}</span>
        )}
      </div>
    </div>
  )
}

export default function Trending() {
  const [days, setDays] = useState(7)
  const { data, isLoading, isError, isPlaceholderData } = useTrending(days)
  const repos = data?.repos ?? []
  const top = Math.max(1, ...repos.map(r => SIGNALS.reduce((sum, s) => sum + r.points[s.key], 0)))

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <motion.header
          className="trending-header"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h2>Newcomer Heat</h2>
            <p>Repos ranked by momentum, not stars: where new work is landing and outsiders are getting merged.</p>
          </div>
          <div className="window-toggle" role="group" aria-label="Time window">
            {WINDOWS.map(w => (
              <button
                key={w}
                type="button"
                className={`window-option ${days === w ? 'active' : ''}`}
                onClick={() => setDays(w)}
                aria-pressed={days === w}
              >
                {w}d
              </button>
            ))}
          </div>
        </motion.header>

        <div className="heat-legend">
          {SIGNALS.map(s => (
            <span key={s.key} className="legend-entry">
              <span className="swatch" style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </div>

        {isLoading && <p className="text-muted">Loading trending repos...</p>}
        {isError && <p className="text-muted">Couldn't load trending repos.</p>}
        {!isLoading && !isError && repos.length === 0 && (
          <p className="text-muted">No activity in the last {days} days. Try a wider window.</p>
        )}

        <motion.ol
          className="heat-list"
          variants={listVariants}
          initial="hidden"
          animate="visible"
          key={days}
          style={{ opacity: isPlaceholderData ? 0.6 : 1 }}
        >
          {repos.map((repo, i) => (
            <motion.li key={repo.repo} className="card heat-row" variants={rowVariants}>
              <span className="heat-rank">{i + 1}</span>
              <div className="heat-main">
                <div className="heat-top">
                  <Link to={`/issues?search=${encodeURIComponent(repo.repo)}`} className="heat-repo">{repo.repo}</Link>
                  {repo.reason && (
                    <span className="reason-tag"><Flame size={12} /> {repo.reason}</span>
                  )}
                </div>
                <div className="heat-meta">
                  {repo.language && <span>{repo.language}</span>}
                  <span><Star size={11} /> {repo.stars.toLocaleString()}</span>
                  {repo.difficulty && <span>{difficultyLabel(repo.difficulty)}</span>}
                </div>
                <HeatBar repo={repo} top={top} />
              </div>
              <div className="heat-score">
                <span className="heat-score-value">{repo.heat}</span>
                <span className="heat-score-label">Heat</span>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </main>

      <style>{`
        .dashboard-main { flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 0; }
        .trending-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
        .window-toggle {
          display: flex; padding: 3px; gap: 2px;
          background: var(--elevated); border: 1px solid var(--border); border-radius: 10px;
        }
        .window-option {
          padding: 6px 14px; border: none; border-radius: 8px; cursor: pointer;
          background: transparent; color: var(--text-secondary); font-size: 13px; font-weight: 600;
        }
        .window-option.active { background: var(--border-light); color: var(--primary); }
        .heat-legend { display: flex; gap: 20px; flex-wrap: wrap; font-size: 13px; color: var(--text-secondary); }
        .legend-entry { display: flex; align-items: center; gap: 8px; }
        .swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: middle; }
        .legend-entry .swatch { margin-right: 0; }
        .heat-list { list-style: none; display: flex; flex-direction: column; gap: 12px; transition: opacity 0.2s; }
        .heat-row { display: grid; grid-template-columns: 32px 1fr 64px; gap: 16px; align-items: center; padding: 18px 24px; }
        .heat-rank { font-size: 18px; font-weight: 800; color: var(--muted); text-align: center; }
        .heat-main { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .heat-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .heat-repo { font-size: 16px; font-weight: 600; color: var(--text); text-decoration: none; }
        .heat-repo:hover { color: var(--primary); }
        .reason-tag {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 99px; border: 1px solid var(--border);
          font-size: 11px; font-weight: 600; color: var(--text-secondary);
        }
        .heat-meta { display: flex; gap: 14px; font-size: 12px; color: var(--muted); }
        .heat-meta span { display: inline-flex; align-items: center; gap: 4px; }
        .heat-bar-wrap { margin-top: 6px; }
        .heat-bar { display: flex; gap: 2px; height: 10px; }
        .heat-segment { height: 100%; min-width: 4px; transition: opacity 0.15s; cursor: default; }
        .heat-segment:first-child { border-radius: 4px 0 0 4px; }
        .heat-segment:last-child { border-radius: 0 4px 4px 0; }
        .heat-segment:only-child { border-radius: 4px; }
        .heat-caption { font-size: 12px; color: var(--muted); margin-top: 6px; min-height: 18px; }
        .heat-caption strong { color: var(--text); }
        .heat-score { display: flex; flex-direction: column; align-items: flex-end; }
        .heat-score-value { font-size: 24px; font-weight: 800; color: var(--text); }
        .heat-score-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
      `}</style>
    </div>
  )
}
