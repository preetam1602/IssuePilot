import { useParams } from 'react-router-dom'
import PredictionBadge from '../components/PredictionBadge'
import { useIssue } from '../hooks/useIssue'
import { usePrediction } from '../hooks/usePrediction'
import { timeAgo, scoreTier, difficultyLabel } from '../lib/format'
import { isSignedIn, signInWithGitHub } from '../lib/api'
import { Github, ExternalLink, MessageSquare, Clock, Code, BookOpen, CheckCircle2, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function IssueDetail() {
  const { id } = useParams()
  const { data: issue, isLoading, isError } = useIssue(id)
  const prediction = usePrediction()
  const signedIn = isSignedIn()

  if (isLoading) {
    return <div className="main-content"><p className="text-muted">Loading issue...</p></div>
  }

  if (isError || !issue) {
    return <div className="main-content"><p className="text-muted">Couldn't load this issue.</p></div>
  }

  const {
    title,
    repo_full_name,
    body,
    labels = [],
    language,
    comments_count,
    created_at,
    complexity_score,
    popularity_score,
    url,
  } = issue

  const [owner, repoName] = (repo_full_name ?? '').split('/')
  const isGoodFirstIssue = labels.some(l => /good first issue/i.test(l))
  const opened = timeAgo(created_at)

  return (
    <div className="main-content">
      <motion.header
        className="detail-header"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="breadcrumb">
          <Github size={14} />
          <span>{owner}</span>
          <span>/</span>
          <span className="repo-highlight">{repoName}</span>
        </div>
        <h1>{title}</h1>
        <div className="detail-meta">
          <span className="meta-item"><MessageSquare size={14} /> {comments_count ?? 0} Comments</span>
          {opened && <span className="meta-item"><Clock size={14} /> Opened {opened}</span>}
          {isGoodFirstIssue && (
            <span className="meta-item"><CheckCircle2 size={14} className="text-success" /> Beginner Friendly</span>
          )}
        </div>
      </motion.header>

      <div className="detail-grid">
        <motion.div
          className="detail-left"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <section className="card detail-card">
            <div className="card-section-header">
              <BookOpen size={18} />
              <h3>Description</h3>
            </div>
            <div className="issue-body">
              <p>{body || 'No description provided.'}</p>
            </div>
          </section>

          <section className="card detail-card">
            <div className="card-section-header">
              <Code size={18} />
              <h3>Labels</h3>
            </div>
            <div className="skills-row">
              {labels.length === 0 && <span className="text-muted text-small">No labels.</span>}
              {labels.map((label, i) => (
                <motion.span
                  key={label}
                  className="skill-badge"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  whileHover={{ scale: 1.06 }}
                >
                  {label}
                </motion.span>
              ))}
              {language && <span className="skill-badge">{language}</span>}
            </div>
          </section>
        </motion.div>

        <motion.aside
          className="detail-right"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="card prediction-card">
            <div className="card-section-header">
              <h3>AI Analysis</h3>
              {prediction.data && <PredictionBadge probability={prediction.data.success_probability} />}
            </div>

            <div className="prediction-stats">
              <div className="prediction-item">
                <span className="label">Complexity</span>
                <span className="value">{scoreTier(complexity_score) ?? '—'}</span>
              </div>
              <div className="prediction-item">
                <span className="label">Popularity</span>
                <span className="value">{scoreTier(popularity_score) ?? '—'}</span>
              </div>
              <div className="prediction-item">
                <span className="label">Predicted Difficulty</span>
                <span className="value">{difficultyLabel(prediction.data?.difficulty) ?? '—'}</span>
              </div>
            </div>

            <AnimatePresence>
              {prediction.data && (
                <motion.div
                  className="prediction-graph"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="graph-label">Success Probability</div>
                  <div className="graph-bar">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(prediction.data.success_probability * 100)}%` }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      className="graph-fill"
                    ></motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              className="button button-primary"
              style={{ width: '100%', marginTop: 24 }}
              onClick={() => (signedIn ? prediction.mutate(id) : signInWithGitHub())}
              disabled={prediction.isPending}
              whileHover={{ scale: prediction.isPending ? 1 : 1.02 }}
              whileTap={{ scale: prediction.isPending ? 1 : 0.98 }}
              animate={prediction.isPending ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
              transition={prediction.isPending ? { repeat: Infinity, duration: 1.2 } : {}}
            >
              <Zap size={18} />
              <span>
                {!signedIn ? 'Sign in to predict' : prediction.isPending ? 'Analyzing...' : 'Can I solve this?'}
              </span>
            </motion.button>
            {prediction.isError && <p className="text-muted text-small">Prediction failed. Try again.</p>}

            {url ? (
              <a href={url} target="_blank" rel="noreferrer" className="button button-ghost" style={{ width: '100%', marginTop: 8 }}>
                <ExternalLink size={16} />
                <span>View Original Issue</span>
              </a>
            ) : (
              <button className="button button-ghost" style={{ width: '100%', marginTop: 8 }} disabled>
                <ExternalLink size={16} />
                <span>View Original Issue</span>
              </button>
            )}
          </div>
        </motion.aside>
      </div>

      <style>{`
        .detail-header { margin-bottom: 40px; }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 12px;
        }
        .repo-highlight { color: var(--text); font-weight: 600; }
        .detail-meta {
          display: flex;
          gap: 24px;
          margin-top: 16px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .meta-item { display: flex; align-items: center; gap: 6px; }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
        }
        .detail-left { display: flex; flex-direction: column; gap: 32px; }
        .detail-card { padding: 32px; }
        .card-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          justify-content: space-between;
        }
        .issue-body { display: flex; flex-direction: column; gap: 16px; white-space: pre-wrap; }
        .skills-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .skill-badge {
          padding: 6px 14px;
          background: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 99px;
          font-size: 13px;
          font-weight: 500;
        }
        .prediction-card { padding: 24px; border-color: var(--primary); }
        .prediction-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .prediction-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }
        .prediction-item .label { color: var(--muted); }
        .prediction-item .value { font-weight: 600; }
        .prediction-graph { margin-top: 16px; }
        .graph-label { font-size: 11px; color: var(--muted); margin-bottom: 8px; text-transform: uppercase; }
        .graph-bar { height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
        .graph-fill { height: 100%; background: var(--primary); }
        @media (max-width: 1024px) {
          .detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
