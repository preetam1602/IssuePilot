import { Link } from 'react-router-dom'
import { Github, Zap, Search, BarChart3, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { signInWithGitHub } from '../lib/api'

export default function Landing() {
  return (
    <main className="landing-page">
      <section className="hero">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-content"
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'inline-flex' }}
            >
              <Zap size={14} className="text-primary" />
            </motion.span>
            <span>Powered by AI Predictions</span>
          </motion.div>
          <h1>Find the Right <span className="text-gradient">Open Source</span> Issue.</h1>
          <p className="hero-subtitle">
            AI-powered issue recommendations and contribution predictions for developers.
            Stop searching, start contributing.
          </p>
          <div className="hero-actions">
            <motion.button
              className="button button-primary"
              onClick={signInWithGitHub}
              whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(62, 207, 142, 0.35)' }}
              whileTap={{ scale: 0.96 }}
            >
              <Github size={18} />
              <span>Continue with GitHub</span>
            </motion.button>
            <Link to="/issues">
              <motion.button
                className="button button-ghost"
                whileHover={{ scale: 1.04, x: 2 }}
                whileTap={{ scale: 0.96 }}
              >
                <span>Explore Issues</span>
                <ArrowRight size={18} />
              </motion.button>
            </Link>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { duration: 0.8, delay: 0.2 },
            scale: { duration: 0.8, delay: 0.2 },
            y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
          }}
          whileHover={{ scale: 1.03, rotate: -1 }}
          className="hero-visual"
        >
          <div className="visual-card">
            <div className="visual-header">
              <div className="dot red"></div>
              <div className="dot yellow"></div>
              <div className="dot green"></div>
            </div>
            <div className="visual-body">
               <div className="line long"></div>
               <div className="line medium"></div>
               <div className="line short"></div>
               <div className="prediction-demo">
                 <div className="demo-label">Contribution Probability</div>
                 <div className="demo-bar">
                   <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '84%' }}
                    transition={{ duration: 1.5, delay: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="demo-progress"
                   ></motion.div>
                 </div>
                 <motion.div
                   className="demo-value"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 2 }}
                 >84%</motion.div>
               </div>
            </div>
          </div>
          <motion.div
            className="visual-glow"
            animate={{ opacity: [0.1, 0.22, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          ></motion.div>
        </motion.div>
      </section>

      <motion.section
        className="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div
          className="section-header"
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5 }}
        >
          <h2>Everything you need to contribute</h2>
          <p>Streamlined workflow from discovery to pull request.</p>
        </motion.div>
        <motion.div
          className="features-grid"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div
            className="feature-card"
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8 }}
          >
            <div className="feature-icon"><Search /></div>
            <h3>Smart Discovery</h3>
            <p>Filter by difficulty, language, and labels to find issues that match your skill level.</p>
          </motion.div>
          <motion.div
            className="feature-card"
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8 }}
          >
            <div className="feature-icon"><Zap /></div>
            <h3>AI Predictions</h3>
            <p>Get instant feedback on your likelihood of successfully solving an issue.</p>
          </motion.div>
          <motion.div
            className="feature-card"
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8 }}
          >
            <div className="feature-icon"><BarChart3 /></div>
            <h3>Skill Analysis</h3>
            <p>Visualize your progress and see how your skills align with project requirements.</p>
          </motion.div>
        </motion.div>
      </motion.section>

      <style>{`
        .landing-page {
          display: flex;
          flex-direction: column;
          gap: 120px;
          padding: 80px 32px 120px;
          max-width: var(--container-max);
          margin: 0 auto;
          width: 100%;
        }
        .hero {
          display: flex;
          align-items: center;
          gap: 64px;
          min-height: 500px;
        }
        .hero-content {
          flex: 1.2;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--border-light);
          border: 1px solid var(--border);
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          width: fit-content;
          color: var(--primary);
        }
        .text-gradient {
          background: linear-gradient(135deg, var(--primary), #5DADE2, var(--primary));
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientMove 4s ease infinite;
        }
        .hero-subtitle {
          font-size: 20px;
          max-width: 500px;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          margin-top: 12px;
        }
        .hero-visual {
          flex: 1;
          position: relative;
          display: flex;
          justify-content: center;
        }
        .visual-card {
          width: 100%;
          max-width: 400px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
          position: relative;
          z-index: 2;
        }
        .visual-header {
          background: var(--elevated);
          padding: 12px;
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--border);
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .red { background: #ff5f56; }
        .yellow { background: #ffbd2e; }
        .green { background: #27c93f; }
        .visual-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .line { height: 8px; background: var(--border); border-radius: 4px; }
        .line.long { width: 80%; }
        .line.medium { width: 60%; }
        .line.short { width: 40%; }
        .prediction-demo {
          margin-top: 24px;
          padding: 16px;
          background: rgba(62, 207, 142, 0.05);
          border: 1px solid var(--border-light);
          border-radius: 12px;
        }
        .demo-label { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; }
        .demo-bar { height: 12px; background: var(--border); border-radius: 6px; overflow: hidden; margin-bottom: 8px; }
        .demo-progress { height: 100%; background: var(--primary); }
        .demo-value { font-size: 24px; font-weight: 800; color: var(--primary); }
        .visual-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          background: var(--primary);
          filter: blur(100px);
          opacity: 0.15;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
        }
        .section-header { text-align: center; margin-bottom: 64px; }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .feature-card {
          padding: 32px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 24px;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          border-color: var(--primary);
          background: var(--elevated);
        }
        .feature-icon {
          width: 48px;
          height: 48px;
          background: var(--border-light);
          color: var(--primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .feature-card h3 { margin-bottom: 12px; }
        @media (max-width: 1024px) {
          .hero { flex-direction: column; text-align: center; }
          .hero-content { align-items: center; }
          .hero-subtitle { max-width: 100%; }
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  )
}
