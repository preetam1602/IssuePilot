import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import IssueCard from '../components/IssueCard'
import { useRecommendations } from '../hooks/useRecommendation'
import { useProfile } from '../hooks/useProfile'
import { Star, TrendingUp, ChevronRight } from 'lucide-react'

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
        <header className="dashboard-header">
          <div>
            <h2>Welcome back{profile?.username ? `, ${profile.username}` : ''}</h2>
            <p>Here are the best issues for you today based on your skills.</p>
          </div>
          <div className="dashboard-stats hide-mobile">
            <div className="stat-pill">
              <Star size={14} className="text-warning" />
              <span>{profile?.saved_count ?? 0} Saved</span>
            </div>
            <div className="stat-pill">
              <TrendingUp size={14} className="text-primary" />
              <span>{profile?.success_rate != null ? `${profile.success_rate}%` : '—'} Success Rate</span>
            </div>
          </div>
        </header>

        <section className="dashboard-grid">
          <div className="content-area">
            <div className="section-title">
              <h3>Top Recommendations</h3>
              <Link to="/issues" className="button button-ghost text-small">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="issues-feed">
              {isLoading && <p className="text-muted">Loading recommendations...</p>}
              {isError && <p className="text-muted">Couldn't load recommendations.</p>}
              {!isLoading && !isError && topRecommendations.length === 0 && (
                <p className="text-muted">No recommendations yet — add some skills to your profile.</p>
              )}
              {topRecommendations.map(issue => (
                <IssueCard key={issue.issue_id} issue={issue} />
              ))}
            </div>
          </div>

          <aside className="widgets-area">
            <div className="card widget">
              <h4>Your Skills</h4>
              <div className="skills-list">
                {(profile?.skills ?? []).map(skill => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
                <button className="add-skill">+ Add</button>
              </div>
            </div>

            <div className="card widget">
              <h4>Trending Repositories</h4>
              <div className="trending-list">
                {trending.length === 0 && <p className="text-muted text-small">No data yet.</p>}
                {trending.map(({ repo, count }) => (
                  <div className="trending-item" key={repo}>
                    <div className="repo-icon">{repo?.[0]?.toUpperCase()}</div>
                    <div className="repo-details">
                      <span className="repo-title">{repo}</span>
                      <span className="repo-meta">{count} issues</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
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
