import { Link, useLocation } from 'react-router-dom'
import { Github, LayoutDashboard, Search, User, Terminal, LogOut } from 'lucide-react'
import { signInWithGitHub, signOut } from '../lib/api'
import { useProfile } from '../hooks/useProfile'

export default function Navbar() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path
  const { data: profile } = useProfile()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
              <Terminal size={20} />
            </div>
            <span>IssuePilot</span>
          </Link>
          
          <div className="navbar-links">
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/issues" 
              className={`nav-link ${isActive('/issues') ? 'active' : ''}`}
            >
              <Search size={18} />
              <span>Explorer</span>
            </Link>
          </div>
        </div>

        <div className="navbar-right">
          {!profile && (
            <button className="button button-secondary hide-mobile" onClick={signInWithGitHub}>
              <Github size={18} />
              <span>Sign in with GitHub</span>
            </button>
          )}

          {profile && (
            <button className="button button-ghost hide-mobile" onClick={signOut}>
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          )}

          <div className="navbar-actions">
            <Link to="/profile" className="avatar-link">
              <div className="avatar">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} />
                ) : (
                  <User size={20} />
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>
      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          height: var(--nav-height);
          background: var(--navbar-bg);
          backdrop-filter: var(--glass);
          border-bottom: 1px solid var(--border);
        }
        .navbar-container {
          max-width: var(--container-max);
          margin: 0 auto;
          height: 100%;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-left, .navbar-right {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--text);
          font-weight: 700;
          font-size: 18px;
        }
        .logo-icon {
          width: 32px;
          height: 32px;
          background: var(--primary);
          color: #062014;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .navbar-links {
          display: flex;
          gap: 8px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .nav-link:hover {
          color: var(--text);
          background: var(--hover);
        }
        .nav-link.active {
          color: var(--primary);
          background: var(--border-light);
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--elevated);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          overflow: hidden;
        }
        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        @media (max-width: 768px) {
          .navbar-container { padding: 0 16px; }
          .navbar-links { display: none; }
        }
      `}</style>
    </nav>
  )
}
