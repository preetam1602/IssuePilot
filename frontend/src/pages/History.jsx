import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, GitMerge, Eye, Mountain } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useHistory } from '../hooks/useInsights'
import { difficultyLabel, timeAgo } from '../lib/format'

const LANES = ['easy', 'medium', 'hard']
const KINDS = {
  merged: { label: 'PR merged', color: '#26A06A', icon: GitMerge },
  checked: { label: 'Issue checked', color: '#4A97CC', icon: Eye },
}

const CHART = { width: 640, height: 200, left: 96, right: 16, top: 20, bottom: 28 }

// Each point sits in its difficulty lane at its date, so the climb reads left to right.
function GrowthChart({ timeline }) {
  const [hovered, setHovered] = useState(null)
  const points = timeline.filter(item => LANES.includes(item.difficulty))
  if (points.length === 0) return null

  const times = points.map(item => new Date(item.date).getTime())
  const min = Math.min(...times)
  const max = Math.max(...times)
  const span = Math.max(max - min, 1)
  const plotWidth = CHART.width - CHART.left - CHART.right
  const laneHeight = (CHART.height - CHART.top - CHART.bottom) / LANES.length
  const x = time => CHART.left + (max === min ? plotWidth / 2 : ((time - min) / span) * plotWidth)
  const y = difficulty => CHART.top + (LANES.length - 1 - LANES.indexOf(difficulty) + 0.5) * laneHeight

  const active = hovered != null ? points[hovered] : null

  return (
    <div className="growth-chart">
      <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} width="100%" role="img" aria-label="Checked issues and merged PRs by difficulty over time">
        {LANES.map(lane => (
          <g key={lane}>
            <line
              x1={CHART.left} x2={CHART.width - CHART.right} y1={y(lane)} y2={y(lane)}
              stroke="var(--border)" strokeWidth="1"
            />
            <text x={CHART.left - 12} y={y(lane) + 4} textAnchor="end" fontSize="12" fill="var(--muted)">
              {difficultyLabel(lane)}
            </text>
          </g>
        ))}
        <text x={CHART.left} y={CHART.height - 6} fontSize="11" fill="var(--muted)">
          {new Date(min).toLocaleDateString()}
        </text>
        <text x={CHART.width - CHART.right} y={CHART.height - 6} fontSize="11" fill="var(--muted)" textAnchor="end">
          {new Date(max).toLocaleDateString()}
        </text>

        {points.map((item, i) => {
          const cx = x(new Date(item.date).getTime())
          const cy = y(item.difficulty)
          const color = KINDS[item.kind].color
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'default' }}>
              {/* Bigger invisible target than the mark. */}
              <circle cx={cx} cy={cy} r="12" fill="transparent" />
              <motion.circle
                cx={cx}
                cy={cy}
                r={hovered === i ? 7 : 5}
                fill={item.kind === 'merged' ? color : 'var(--card)'}
                stroke={item.kind === 'merged' ? 'var(--card)' : color}
                strokeWidth="2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.03 }}
              />
            </g>
          )
        })}
      </svg>

      <div className="chart-footer">
        <div className="growth-legend">
          {Object.entries(KINDS).map(([kind, { label, color }]) => (
            <span key={kind} className="legend-entry">
              <span
                className="legend-dot"
                style={kind === 'merged' ? { background: color } : { border: `2px solid ${color}` }}
              />
              {label}
            </span>
          ))}
        </div>
        <div className="chart-tooltip">
          {active ? (
            <>
              <strong>{active.title}</strong> · {active.repo} · {timeAgo(active.date)}
              {active.success_prob != null && ` · ${Math.round(active.success_prob * 100)}% odds`}
            </>
          ) : (
            'Hover a point for details'
          )}
        </div>
      </div>
    </div>
  )
}

export default function History() {
  const { data, isLoading, isError } = useHistory()

  if (isLoading) {
    return <div className="dashboard-layout"><Sidebar /><main className="dashboard-main"><p className="text-muted">Loading your path...</p></main></div>
  }
  if (isError || !data) {
    return <div className="dashboard-layout"><Sidebar /><main className="dashboard-main"><p className="text-muted">Couldn't load your history.</p></main></div>
  }

  const { level, target_level, next_step, counts, timeline } = data
  const levelIndex = LANES.indexOf(level)

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h2>Growth Path</h2>
          <p>Every issue you've sized up and every PR you've landed, plotted by difficulty, so you can see the climb.</p>
        </motion.header>

        <section className="growth-top">
          <motion.div className="card ladder-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h4 className="widget-title">Your level</h4>
            <div className="ladder">
              {[...LANES].reverse().map(lane => {
                const index = LANES.indexOf(lane)
                const reached = levelIndex >= index
                const isTarget = lane === target_level && lane !== level
                return (
                  <div key={lane} className={`rung ${reached ? 'reached' : ''} ${isTarget ? 'target' : ''}`}>
                    <span className="rung-marker">{reached ? <Mountain size={14} /> : index + 1}</span>
                    <span className="rung-label">{difficultyLabel(lane)}</span>
                    {lane === level && <span className="rung-note">You are here</span>}
                    {isTarget && <span className="rung-note">Next</span>}
                  </div>
                )
              })}
            </div>
            <div className="growth-counts">
              <span><strong>{counts.merged}</strong> {counts.merged === 1 ? 'PR' : 'PRs'} merged</span>
              <span><strong>{counts.checked}</strong> {counts.checked === 1 ? 'issue' : 'issues'} checked</span>
            </div>
          </motion.div>

          <motion.div
            className="card next-step-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <h4 className="widget-title">Your next step · {difficultyLabel(target_level)}</h4>
            {next_step ? (
              <>
                <span className="next-repo">{next_step.repo}</span>
                <h3 className="next-title">{next_step.title}</h3>
                <p className="text-small">
                  {level
                    ? `One level up from where you've proven yourself.`
                    : `A good first rung while you build a track record.`}
                  {next_step.score != null && ` ${next_step.score}% match with your skills.`}
                </p>
                <Link to={`/issues/${next_step.issue_id}`} className="button button-primary" style={{ marginTop: 16, alignSelf: 'flex-start', textDecoration: 'none' }}>
                  Take it on <ArrowUpRight size={16} />
                </Link>
              </>
            ) : (
              <p className="text-small">No open {difficultyLabel(target_level)?.toLowerCase()} issues right now. Check back after the next refresh.</p>
            )}
          </motion.div>
        </section>

        <section className="card">
          <h4 className="widget-title">The climb</h4>
          {timeline.length === 0 ? (
            <p className="text-muted text-small">
              Nothing yet. Run "Can I solve this?" on an issue and it shows up here.
            </p>
          ) : (
            <GrowthChart timeline={timeline} />
          )}
        </section>

        {timeline.length > 0 && (
          <section className="card">
            <h4 className="widget-title">Timeline</h4>
            <div className="history-list">
              {timeline.map((item, i) => {
                const { icon: Icon, color, label } = KINDS[item.kind]
                const content = (
                  <>
                    <span className="history-icon" style={{ color }}><Icon size={14} /></span>
                    <div className="history-body">
                      <span className="history-title">{item.title}</span>
                      <span className="history-meta">
                        {label} · {item.repo}
                        {item.difficulty && ` · ${difficultyLabel(item.difficulty)}`}
                        {item.success_prob != null && ` · ${Math.round(item.success_prob * 100)}% odds`}
                      </span>
                    </div>
                    <span className="history-date">{timeAgo(item.date)}</span>
                  </>
                )
                return item.issue_id ? (
                  <Link key={i} to={`/issues/${item.issue_id}`} className="history-row">{content}</Link>
                ) : (
                  <div key={i} className="history-row">{content}</div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      <style>{`
        .dashboard-main { flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 0; }
        .widget-title {
          font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--muted); margin-bottom: 16px;
        }
        .growth-top { display: grid; grid-template-columns: 280px 1fr; gap: 20px; }
        .ladder { display: flex; flex-direction: column; gap: 8px; }
        .rung {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border);
          color: var(--muted); font-size: 14px;
        }
        .rung.reached { color: var(--text); border-color: var(--primary); background: var(--border-light); }
        .rung.target { border-style: dashed; border-color: var(--primary); color: var(--text-secondary); }
        .rung-marker {
          width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--elevated); font-size: 12px; font-weight: 700;
        }
        .rung.reached .rung-marker { color: var(--primary); }
        .rung-label { font-weight: 600; }
        .rung-note { margin-left: auto; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); font-weight: 700; }
        .growth-counts { display: flex; gap: 16px; margin-top: 16px; font-size: 13px; color: var(--text-secondary); }
        .growth-counts strong { color: var(--text); }
        .next-step-card { display: flex; flex-direction: column; border-color: var(--primary); }
        .next-repo { font-size: 13px; color: var(--text-secondary); }
        .next-title { margin: 4px 0 8px; line-height: 1.4; }
        .growth-chart svg { display: block; overflow: visible; }
        .chart-footer { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 12px; font-size: 12px; color: var(--muted); }
        .growth-legend { display: flex; gap: 16px; }
        .legend-entry { display: flex; align-items: center; gap: 6px; color: var(--text-secondary); }
        .legend-dot { width: 10px; height: 10px; border-radius: 50%; box-sizing: border-box; }
        .chart-tooltip strong { color: var(--text); }
        .history-list { display: flex; flex-direction: column; }
        .history-row {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 8px; border-bottom: 1px solid var(--border);
          text-decoration: none; color: inherit; border-radius: 8px;
        }
        .history-row:last-child { border-bottom: none; }
        a.history-row:hover { background: var(--hover); }
        .history-icon {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--elevated); border: 1px solid var(--border);
        }
        .history-body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .history-title { font-size: 14px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .history-meta { font-size: 12px; color: var(--muted); }
        .history-date { font-size: 12px; color: var(--muted); white-space: nowrap; }
        @media (max-width: 900px) {
          .growth-top { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
