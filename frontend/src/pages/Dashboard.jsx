import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import IssueCard from '../components/IssueCard'
import AnimatedNumber from '../components/AnimatedNumber'
import { useRecommendations } from '../hooks/useRecommendation'
import { useProfile } from '../hooks/useProfile'
import { Star, TrendingUp, ChevronRight } from 'lucide-react'

const feedVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

function trendingRepos(recommendations) {
  const counts = new Map()
  for (const issue of recommendations) {
    counts.set(issue.repo, (counts.get(issue.repo) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([repo, count]) => ({ repo, count }))
}

export default function Dashboard() {
  const { data: profile } = useProfile()
  const { data: recommendationsData, isLoading, isError } = useRecommendations(20)

  const recommendations = recommendationsData?.recommendations ?? []
  const topRecommendations = recommendations.slice(0, 3)
  const trending = trendingRepos(recommendations)

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <motion.header
          className="dashboard-header"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h2>Welcome back{profile?.username ? `, ${profile.username}` : ''}</h2>
            <p>Here are the best issues for you today based on your skills.</p>
          </div>
          <div className="dashboard-stats hide-mobile">
            <motion.div className="stat-pill" whileHover={{ scale: 1.05, y: -2 }}>
              <Star size={14} className="text-warning" />
              <span><AnimatedNumber value={profile?.saved_count ?? 0} /> Saved</span>
            </motion.div>
            <motion.div className="stat-pill" whileHover={{ scale: 1.05, y: -2 }}>
              <TrendingUp size={14} className="text-primary" />
              <span>
                {profile?.success_rate != null ? <AnimatedNumber value={profile.success_rate} suffix="%" /> : '—'} Success Rate
              </span>
            </motion.div>
          </div>
        </motion.header>

        <section className="dashboard-grid">
          <div className="content-area">
            <div className="section-title">
              <h3>Top Recommendations</h3>
              <Link to="/issues" className="button button-ghost text-small">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <motion.div className="issues-feed" variants={feedVariants} initial="hidden" animate="visible">
              {isLoading && <p className="text-muted">Loading recommendations...</p>}
              {isError && <p className="text-muted">Couldn't load recommendations.</p>}
              {!isLoading && !isError && topRecommendations.length === 0 && (
                <p className="text-muted">No recommendations yet — add some skills to your profile.</p>
              )}
              {topRecommendations.map(issue => (
                <IssueCard key={issue.issue_id} issue={issue} />
              ))}
            </motion.div>
          </div>

          <motion.aside
            className="widgets-area"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="card widget">
              <h4>Your Skills</h4>
              <div className="skills-list">
                {(profile?.skills ?? []).map((skill, i) => (
                  <motion.span
                    key={skill}
                    className="skill-tag"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    whileHover={{ scale: 1.08 }}
                  >
                    {skill}
                  </motion.span>
                ))}
                <button className="add-skill">+ Add</button>
              </div>
            </div>

            <div className="card widget">
              <h4>Trending Repositories</h4>
              <div className="trending-list">
                {trending.length === 0 && <p className="text-muted text-small">No data yet.</p>}
                {trending.map(({ repo, count }, i) => (
                  <motion.div
                    className="trending-item"
                    key={repo}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                  >
                    <div className="repo-icon">{repo?.[0]?.toUpperCase()}</div>
                    <div className="repo-details">
                      <span className="repo-title">{repo}</span>
                      <span className="repo-meta">{count} issues</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.aside>
        </section>
      </main>

      <style>{`
        .dashboard-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .dashboard-stats {
          display: flex;
          gap: 12px;
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 99px;
          font-size: 13px;
          font-weight: 500;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 32px;
        }
        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .issues-feed {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .widgets-area {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .widget h4 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-bottom: 16px;
        }
        .skills-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .skill-tag {
          padding: 4px 10px;
          background: var(--border-light);
          color: var(--primary);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .add-skill {
          padding: 4px 10px;
          border: 1px dashed var(--border);
          background: transparent;
          color: var(--muted);
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }
        .trending-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .trending-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .repo-icon {
          width: 32px;
          height: 32px;
          background: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
        }
        .repo-title { font-size: 14px; font-weight: 600; display: block; }
        .repo-meta { font-size: 12px; color: var(--muted); }

        @media (max-width: 1200px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
