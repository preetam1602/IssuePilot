import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, User, Settings, Bookmark, History, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 },
}

export default function Sidebar() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Issue Explorer', path: '/issues', icon: Search },
    { label: 'Saved Issues', path: '/saved', icon: Bookmark },
    { label: 'History', path: '/history', icon: History },
    { label: 'Trending', path: '/trending', icon: TrendingUp },
  ]

  const userItems = [
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ]

  const renderItem = (item) => (
    <motion.div key={item.path} variants={itemVariants}>
      <Link to={item.path} className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}>
        {isActive(item.path) && (
          <motion.div
            layoutId="sidebar-active-pill"
            className="sidebar-active-pill"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        <item.icon size={18} style={{ position: 'relative', zIndex: 1 }} />
        <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
      </Link>
    </motion.div>
  )

  return (
    <aside className="sidebar hide-mobile">
      <motion.div className="sidebar-section" variants={listVariants} initial="hidden" animate="visible">
        <div className="sidebar-label">Main Navigation</div>
        <nav className="sidebar-nav">{navItems.map(renderItem)}</nav>
      </motion.div>

      <motion.div className="sidebar-section" variants={listVariants} initial="hidden" animate="visible">
        <div className="sidebar-label">User</div>
        <nav className="sidebar-nav">{userItems.map(renderItem)}</nav>
      </motion.div>

      <motion.div
        className="sidebar-footer"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="card sidebar-promo">
          <h4>Pro Insights</h4>
          <p>Get advanced predictions with Pro.</p>
          <motion.button
            className="button button-primary"
            style={{ width: '100%', marginTop: 12 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Upgrade
          </motion.button>
        </div>
      </motion.div>

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
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .sidebar-link:hover {
          color: var(--text);
          background: var(--hover);
        }
        .sidebar-link.active {
          color: var(--primary);
        }
        .sidebar-active-pill {
          position: absolute;
          inset: 0;
          background: var(--border-light);
          border-radius: 8px;
          z-index: 0;
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
