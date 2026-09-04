import { Link, useLocation } from 'react-router-dom'
import { Github, LayoutDashboard, Search, User, Terminal, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { signInWithGitHub, signOut } from '../lib/api'
import { useProfile } from '../hooks/useProfile'

export default function Navbar() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path
  const { data: profile } = useProfile()

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/issues', label: 'Explorer', icon: Search },
  ]

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <motion.div
              className="logo-icon"
              whileHover={{ rotate: -12, scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <Terminal size={20} />
            </motion.div>
            <span>IssuePilot</span>
          </Link>

          <div className="navbar-links">
            {links.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {isActive(item.path) && (
                  <motion.div
                    layoutId="nav-active-pill"
                    className="nav-active-pill"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <item.icon size={18} style={{ position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="navbar-right">
          {!profile && (
            <motion.button
              className="button button-secondary hide-mobile"
              onClick={signInWithGitHub}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Github size={18} />
              <span>Sign in with GitHub</span>
            </motion.button>
          )}

          {profile && (
            <motion.button
              className="button button-ghost hide-mobile"
              onClick={signOut}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </motion.button>
          )}

          <div className="navbar-actions">
            <Link to="/profile" className="avatar-link">
              <motion.div
                className="avatar"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} />
                ) : (
                  <User size={20} />
                )}
              </motion.div>
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
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .nav-link:hover {
          color: var(--text);
        }
        .nav-link.active {
          color: var(--primary);
        }
        .nav-active-pill {
          position: absolute;
          inset: 0;
          background: var(--border-light);
          border-radius: 8px;
          z-index: 0;
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
          overflow: hidden;
        }
        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-link:hover .avatar {
          border-color: var(--primary);
          color: var(--primary);
        }
        @media (max-width: 768px) {
          .navbar-container { padding: 0 16px; }
          .navbar-links { display: none; }
        }
      `}</style>
    </motion.nav>
  )
}
