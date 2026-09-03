import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, User, Settings, Bookmark, History, TrendingUp } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Issue Explorer', path: '/issues', icon: Search },
    { label: 'Saved Issues', path: '/saved', icon: Bookmark, soon: true },
    { label: 'History', path: '/history', icon: History, soon: true },
    { label: 'Trending', path: '/trending', icon: TrendingUp, soon: true },
  ]

  const userItems = [
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings, soon: true },
  ]

  return (
    <aside className="sidebar hide-mobile">
      <div className="sidebar-section">
        <div className="sidebar-label">Main Navigation</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            item.soon ? (
              <div key={item.path} className="sidebar-link disabled">
                <item.icon size={18} />
                <span>{item.label}</span>
                <span className="soon-badge">Soon</span>
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          ))}
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">User</div>
        <nav className="sidebar-nav">
          {userItems.map((item) => (
            item.soon ? (
              <div key={item.path} className="sidebar-link disabled">
                <item.icon size={18} />
                <span>{item.label}</span>
                <span className="soon-badge">Soon</span>
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="card sidebar-promo">
          <h4>Pro Insights</h4>
          <p>Get advanced predictions with Pro.</p>
          <button className="button button-primary" style={{ width: '100%', marginTop: 12 }}>Upgrade</button>
        </div>
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding: 32px 0;
          height: calc(100vh - var(--nav-height));
          position: sticky;
          top: var(--nav-height);
        }
        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sidebar-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          font-weight: 700;
          padding: 0 12px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .sidebar-link:hover {
          color: var(--text);
          background: var(--hover);
        }
        .sidebar-link.active {
          color: var(--primary);
          background: var(--border-light);
        }
        .sidebar-link.disabled {
          color: var(--muted);
          cursor: not-allowed;
          opacity: 0.55;
        }
        .soon-badge {
          margin-left: auto;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 99px;
          border: 1px solid var(--border);
          color: var(--muted);
        }
        .sidebar-footer {
          margin-top: auto;
        }
        .sidebar-promo {
          padding: 16px;
          background: linear-gradient(to bottom right, var(--elevated), var(--card));
        }
        .sidebar-promo h4 { font-size: 14px; margin-bottom: 4px; }
        .sidebar-promo p { font-size: 12px; color: var(--muted); }
      `}</style>
    </aside>
  )
}
