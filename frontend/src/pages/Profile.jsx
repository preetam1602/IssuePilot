import { Github, MapPin, Link as LinkIcon, Twitter, Mail, Award, Clock, Star, User as UserIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useProfile } from '../hooks/useProfile'
import AnimatedNumber from '../components/AnimatedNumber'
import { timeAgo } from '../lib/format'

const statVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export default function Profile() {
  const { data: profile, isLoading, isError } = useProfile()

  if (isLoading) {
    return <div className="main-content"><p className="text-muted">Loading profile...</p></div>
  }

  if (isError || !profile) {
    return <div className="main-content"><p className="text-muted">Couldn't load your profile.</p></div>
  }

  const {
    username,
    bio,
    avatar_url,
    location,
    website,
    twitter,
    email,
    stats = {},
    languages = [],
    recent_activity = [],
  } = profile

  return (
    <div className="main-content">
      <div className="profile-layout">
        <motion.aside
          className="profile-sidebar"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="card profile-main-card">
            <motion.div
              className="profile-avatar-large"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              {avatar_url ? (
                <img src={avatar_url} alt={username} />
              ) : (
                <div className="avatar-fallback"><UserIcon size={48} /></div>
              )}
            </motion.div>
            <div className="profile-info">
              <h1>{username}</h1>
              {username && <p className="username">@{username}</p>}
              {bio && <p className="bio">{bio}</p>}
            </div>
            <div className="profile-details">
              {location && <div className="detail-row"><MapPin size={16} /> <span>{location}</span></div>}
              {website && <div className="detail-row"><LinkIcon size={16} /> <a href={website} target="_blank" rel="noreferrer">{website}</a></div>}
              {twitter && <div className="detail-row"><Twitter size={16} /> <span>{twitter}</span></div>}
              {email && <div className="detail-row"><Mail size={16} /> <span>{email}</span></div>}
            </div>
            <motion.button
              className="button button-secondary"
              style={{ width: '100%', marginTop: 24 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Edit Profile
            </motion.button>
          </div>
        </motion.aside>

        <main className="profile-main">
          <motion.section
            className="profile-stats-grid"
            variants={statVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="card stat-card" variants={cardVariants} whileHover={{ y: -4 }}>
              <div className="stat-icon"><Award size={24} className="text-primary" /></div>
              <div className="stat-content">
                <span className="stat-value"><AnimatedNumber value={stats.contributions ?? 0} /></span>
                <span className="stat-label">Contributions</span>
              </div>
            </motion.div>
            <motion.div className="card stat-card" variants={cardVariants} whileHover={{ y: -4 }}>
              <div className="stat-icon"><Star size={24} className="text-warning" /></div>
              <div className="stat-content">
                <span className="stat-value"><AnimatedNumber value={stats.total_stars ?? 0} /></span>
                <span className="stat-label">Total Stars</span>
              </div>
            </motion.div>
            <motion.div className="card stat-card" variants={cardVariants} whileHover={{ y: -4 }}>
              <div className="stat-icon"><Clock size={24} className="text-info" /></div>
              <div className="stat-content">
                <span className="stat-value">
                  {stats.avg_resolution_hours != null ? <AnimatedNumber value={stats.avg_resolution_hours} suffix="h" /> : '—'}
                </span>
                <span className="stat-label">Avg. Resolution</span>
              </div>
            </motion.div>
          </motion.section>

          <motion.section
            className="card profile-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h3>Top Languages</h3>
            {languages.length === 0 ? (
              <p className="text-muted text-small">No language data yet.</p>
            ) : (
              <>
                <div className="language-bar">
                  {languages.map((lang, i) => (
                    <motion.div
                      key={lang.name}
                      initial={{ width: 0 }}
                      animate={{ width: `${lang.percent}%` }}
                      transition={{ duration: 0.8, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: lang.color }}
                      className="bar-segment"
                    />
                  ))}
                </div>
                <div className="language-legend">
                  {languages.map(lang => (
                    <div key={lang.name} className="legend-item">
                      <span className="dot" style={{ background: lang.color }} />
                      <span className="name">{lang.name}</span>
                      <span className="percent">{lang.percent}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.section>

          <motion.section
            className="card profile-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <h3>Recent Activity</h3>
            {recent_activity.length === 0 ? (
              <p className="text-muted text-small">No recent activity.</p>
            ) : (
              <div className="activity-timeline">
                {recent_activity.map((activity, i) => (
                  <motion.div
                    className="activity-item"
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                  >
                    <div className="activity-icon"><Github size={14} /></div>
                    <div className="activity-details">
                      <p>{activity.description}</p>
                      <span>{timeAgo(activity.date)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        </main>
      </div>

      <style>{`
        .profile-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 40px;
        }
        .profile-main-card { padding: 32px; text-align: center; }
        .profile-avatar-large {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          overflow: hidden;
          margin: 0 auto 24px;
          border: 4px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--elevated);
        }
        .profile-avatar-large img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-fallback { color: var(--muted); display: flex; }
        .profile-info h1 { font-size: 24px; margin-bottom: 4px; }
        .username { color: var(--primary); font-weight: 600; margin-bottom: 16px; }
        .bio { font-size: 14px; margin-bottom: 24px; }
        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        .detail-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .detail-row a { color: var(--text-secondary); text-decoration: none; }
        .detail-row a:hover { color: var(--primary); }

        .profile-main { display: flex; flex-direction: column; gap: 32px; }
        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          background: var(--elevated);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-value { font-size: 24px; font-weight: 800; display: block; }
        .stat-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }

        .profile-section { padding: 32px; }
        .profile-section h3 { margin-bottom: 24px; font-size: 18px; }

        .language-bar {
          height: 12px;
          border-radius: 6px;
          display: flex;
          overflow: hidden;
          margin-bottom: 24px;
          background: var(--border);
        }
        .language-legend {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
        }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .legend-item .dot { width: 8px; height: 8px; border-radius: 50%; }
        .legend-item .percent { color: var(--muted); margin-left: auto; }

        .activity-timeline { display: flex; flex-direction: column; gap: 24px; }
        .activity-item { display: flex; gap: 16px; }
        .activity-icon {
          width: 28px;
          height: 28px;
          background: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          flex-shrink: 0;
        }
        .activity-details p { font-size: 14px; margin-bottom: 4px; color: var(--text); }
        .activity-details span { font-size: 12px; color: var(--muted); }

        @media (max-width: 1024px) {
          .profile-layout { grid-template-columns: 1fr; }
          .profile-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
