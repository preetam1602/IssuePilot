import { Link } from 'react-router-dom'
import { Github, ArrowRight, Sparkles, Target, Gauge, BarChart3, Users, Sprout, Flame } from 'lucide-react'
import { motion, MotionConfig } from 'framer-motion'
import { signInWithGitHub } from '../lib/api'

// Static sample data for the hero illustration; the real dashboard reads from /recommend.
const SUCCESS_SPARK = 'M0,30 C12,28 18,22 30,22 S48,14 60,15 S78,8 90,9 S108,3 120,2'
const TRENDING = [
  { repo: 'vitejs/vite', value: 86 },
  { repo: 'astral-sh/ruff', value: 64 },
  { repo: 'rust-lang/rustlings', value: 48 },
]
const STATS = [
  { value: '10K+', label: 'Developers' },
  { value: '50K+', label: 'Issues Analyzed' },
  { value: '500+', label: 'Repositories' },
  { value: '85%', label: 'Success Rate' },
]
const FEATURES = [
  { icon: Target, title: 'AI-Powered Matching', text: 'Issues ranked against the languages and skills in your GitHub repos.' },
  { icon: Gauge, title: 'Success Prediction', text: 'An AI read on how likely your contribution is to land before you start.' },
  { icon: BarChart3, title: 'Track Progress', text: 'Keep tabs on the issues you check, save, and the PRs you merge.' },
  { icon: Users, title: 'Explore Communities', text: 'Discover trending repositories that welcome new contributors.' },
]
const CUBE_FACES = ['front', 'back', 'right', 'left', 'top', 'bottom']

const ease = [0.22, 1, 0.36, 1]
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease },
})

function Panel({ className = '', delay = 0, children }) {
  return (
    <motion.div
      className={`lp-panel ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

function Ring({ value }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <svg className="lp-ring" viewBox="0 0 56 56" aria-hidden="true">
      <defs>
        <linearGradient id="lp-ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r={r} className="lp-ring-track" />
      <circle
        cx="28" cy="28" r={r}
        className="lp-ring-value"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
      />
    </svg>
  )
}

function AICube() {
  return (
    <div className="lp-cube-scene" aria-hidden="true">
      <div className="lp-cube-halo" />
      <div className="lp-cube">
        {CUBE_FACES.map(face => (
          <span key={face} className={`lp-cube-face is-${face}`}>
            {(face === 'front' || face === 'back') && <b>AI</b>}
          </span>
        ))}
        <span className="lp-cube-core" />
      </div>
      <div className="lp-cube-base" />
    </div>
  )
}

function HeroVisual() {
  return (
    <div className="lp-visual" role="img" aria-label="Illustration of IssuePilot insights: skill match, success chance, good first issue and trending repositories">
      <AICube />

      <Panel className="is-skill" delay={0.35}>
        <span className="lp-panel-label">Skill Match</span>
        <div className="lp-panel-row">
          <Ring value={92} />
          <strong className="lp-panel-value">92%</strong>
        </div>
      </Panel>

      <Panel className="is-success" delay={0.45}>
        <span className="lp-panel-label">Success Chance</span>
        <strong className="lp-panel-value">78%</strong>
        <svg className="lp-spark" viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true">
          <path d={SUCCESS_SPARK} vectorEffect="non-scaling-stroke" />
        </svg>
      </Panel>

      <Panel className="is-gfi" delay={0.55}>
        <span className="lp-chip"><Sprout size={12} /> Good First Issue</span>
        <span className="lp-gfi-repo">vitejs/vite</span>
        <span className="lp-gfi-title">Clarify config promise error</span>
      </Panel>

      <Panel className="is-trending" delay={0.65}>
        <span className="lp-panel-label"><Flame size={12} /> Trending Repos</span>
        <ul className="lp-bars">
          {TRENDING.map(t => (
            <li key={t.repo}>
              <span>{t.repo}</span>
              <i style={{ '--w': `${t.value}%` }} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

export default function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="lp">
        <div className="lp-glow" aria-hidden="true" />

        <section className="lp-hero">
          <div className="lp-copy">
            <motion.span className="lp-eyebrow" {...fadeUp(0)}>
              <Sparkles size={13} /> AI-matched open source issues
            </motion.span>
            <motion.h1 {...fadeUp(0.05)}>
              Open Source Opportunities, Personalized <span className="lp-accent">for You.</span>
            </motion.h1>
            <motion.p className="lp-lede" {...fadeUp(0.1)}>
              IssuePilot reads your GitHub skills, recommends issues that fit, and predicts how likely
              your contribution is to land, before you spend a weekend on it.
            </motion.p>
            <motion.div className="lp-actions" {...fadeUp(0.15)}>
              <button type="button" className="lp-btn lp-btn-primary" onClick={signInWithGitHub}>
                <Github size={18} />
                Continue with GitHub
              </button>
              <Link to="/issues" className="lp-btn lp-btn-secondary">
                Explore Issues
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="lp-visual-wrap"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease }}
          >
            <HeroVisual />
          </motion.div>
        </section>

        <motion.section className="lp-stats" aria-label="IssuePilot in numbers" {...fadeUp(0.25)}>
          {STATS.map(s => (
            <div key={s.label} className="lp-stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </motion.section>

        <section className="lp-features">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="lp-feature">
              <span className="lp-feature-icon"><Icon size={18} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </section>

        <style>{`
          .lp {
            --lp-bg: #05060F;
            --lp-card: rgba(17, 20, 40, 0.55);
            --lp-purple: #A855F7;
            --lp-violet: #7C3AED;
            --lp-blue: #3B82F6;
            --lp-cyan: #22D3EE;
            --lp-text: #F4F5FB;
            --lp-text-2: #9CA3C4;
            --lp-border: rgba(96, 130, 255, 0.18);
            --lp-border-strong: rgba(96, 130, 255, 0.32);

            position: relative;
            width: 100%;
            min-height: calc(100dvh - var(--nav-height));
            background: var(--lp-bg);
            color: var(--lp-text);
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            padding: 0 32px 96px;
            overflow: hidden;
            isolation: isolate;
          }
          .lp-glow {
            position: absolute;
            inset: 0;
            z-index: -1;
            pointer-events: none;
            background:
              radial-gradient(700px circle at 8% 0%, rgba(124, 58, 237, 0.18), transparent 60%),
              radial-gradient(640px circle at 85% 18%, rgba(59, 130, 246, 0.16), transparent 60%),
              radial-gradient(520px circle at 60% 90%, rgba(34, 211, 238, 0.06), transparent 60%);
          }
          .lp-hero, .lp-stats, .lp-features { max-width: var(--container-max); margin: 0 auto; }

          /* Hero */
          .lp-hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 48px;
            align-items: center;
            padding: 72px 0 56px;
          }
          .lp-copy { display: flex; flex-direction: column; align-items: flex-start; }
          .lp-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border: 1px solid var(--lp-border);
            border-radius: 99px;
            background: rgba(124, 58, 237, 0.08);
            color: #C4B5FD;
            font-size: 12.5px;
            font-weight: 500;
          }
          .lp h1 {
            margin-top: 22px;
            font-size: clamp(36px, 4.6vw, 60px);
            font-weight: 700;
            line-height: 1.06;
            letter-spacing: -0.035em;
            color: var(--lp-text);
            max-width: 14ch;
          }
          .lp-accent {
            background: linear-gradient(90deg, #C084FC 0%, #A855F7 45%, #6366F1 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            white-space: nowrap;
          }
          .lp-lede {
            margin-top: 20px;
            max-width: 46ch;
            font-size: 17px;
            line-height: 1.65;
            color: var(--lp-text-2);
          }
          .lp-actions { display: flex; gap: 12px; margin-top: 32px; flex-wrap: wrap; }
          .lp-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            height: 48px;
            padding: 0 22px;
            border-radius: 12px;
            font: inherit;
            font-size: 14.5px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
          }
          .lp-btn-primary {
            color: #fff;
            border: 1px solid rgba(168, 85, 247, 0.6);
            background: linear-gradient(135deg, var(--lp-violet), var(--lp-blue));
            box-shadow: 0 0 24px -6px rgba(124, 58, 237, 0.7);
          }
          .lp-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 32px -4px rgba(124, 58, 237, 0.85); }
          .lp-btn-secondary {
            color: var(--lp-text);
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--lp-border-strong);
          }
          .lp-btn-secondary:hover { border-color: var(--lp-blue); background: rgba(59, 130, 246, 0.08); }
          .lp-btn-secondary svg { transition: transform 0.2s ease; }
          .lp-btn-secondary:hover svg { transform: translateX(2px); }
          .lp-btn:focus-visible { outline: 2px solid var(--lp-purple); outline-offset: 3px; }

          /* Hero visual: CSS 3D cube with glass panels around it */
          .lp-visual-wrap { min-width: 0; }
          .lp-visual {
            position: relative;
            height: 460px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .lp-cube-scene {
            position: relative;
            width: 150px;
            height: 150px;
            perspective: 900px;
          }
          .lp-cube-halo {
            position: absolute;
            inset: -90px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(124, 58, 237, 0.35), rgba(59, 130, 246, 0.12) 45%, transparent 70%);
            filter: blur(10px);
          }
          .lp-cube {
            --s: 150px;
            position: relative;
            width: var(--s);
            height: var(--s);
            transform-style: preserve-3d;
            transform: rotateX(-22deg) rotateY(38deg);
            animation: lp-spin 24s linear infinite;
          }
          .lp-cube-face {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(147, 197, 253, 0.55);
            border-radius: 14px;
            transform-style: preserve-3d;
            background:
              linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(59, 130, 246, 0.22) 60%, rgba(34, 211, 238, 0.18));
            box-shadow: inset 0 0 30px rgba(168, 85, 247, 0.35), 0 0 22px rgba(99, 102, 241, 0.35);
          }
          .lp-cube-face b {
            font-size: 40px;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #fff;
            text-shadow: 0 0 18px rgba(168, 85, 247, 0.9);
            backface-visibility: hidden;
          }
          .lp-cube-face.is-front  { transform: translateZ(calc(var(--s) / 2)); }
          .lp-cube-face.is-back   { transform: rotateY(180deg) translateZ(calc(var(--s) / 2)); }
          .lp-cube-face.is-right  { transform: rotateY(90deg) translateZ(calc(var(--s) / 2)); }
          .lp-cube-face.is-left   { transform: rotateY(-90deg) translateZ(calc(var(--s) / 2)); }
          .lp-cube-face.is-top    { transform: rotateX(90deg) translateZ(calc(var(--s) / 2)); }
          .lp-cube-face.is-bottom { transform: rotateX(-90deg) translateZ(calc(var(--s) / 2)); }
          .lp-cube-core {
            position: absolute;
            inset: 40px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(168, 85, 247, 0.6) 40%, transparent 70%);
            filter: blur(6px);
          }
          .lp-cube-base {
            position: absolute;
            left: 50%;
            bottom: -80px;
            width: 220px;
            height: 40px;
            transform: translateX(-50%);
            border-radius: 50%;
            border: 1px solid rgba(96, 165, 250, 0.35);
            background: radial-gradient(ellipse, rgba(59, 130, 246, 0.28), transparent 70%);
          }
          @keyframes lp-spin {
            from { transform: rotateX(-22deg) rotateY(38deg); }
            to   { transform: rotateX(-22deg) rotateY(398deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            .lp-cube { animation: none; }
          }

          .lp-panel {
            position: absolute;
            z-index: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 14px 16px;
            min-width: 168px;
            background: var(--lp-card);
            border: 1px solid var(--lp-border-strong);
            border-radius: 16px;
            backdrop-filter: blur(14px) saturate(140%);
            -webkit-backdrop-filter: blur(14px) saturate(140%);
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.02) inset, 0 18px 40px -20px rgba(0, 0, 0, 0.8), 0 0 24px -12px rgba(59, 130, 246, 0.6);
          }
          .lp-panel.is-skill    { top: 6%;  left: 0; }
          .lp-panel.is-success  { top: 10%; right: 0; }
          .lp-panel.is-gfi      { bottom: 6%; left: 2%; max-width: 220px; }
          .lp-panel.is-trending { bottom: 4%; right: 0; min-width: 200px; }
          .lp-panel-label {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--lp-text-2);
          }
          .lp-panel-row { display: flex; align-items: center; gap: 12px; }
          .lp-panel-value { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: var(--lp-text); }
          .lp-ring { width: 44px; height: 44px; transform: rotate(-90deg); }
          .lp-ring-track { fill: none; stroke: rgba(96, 130, 255, 0.15); stroke-width: 5; }
          .lp-ring-value { fill: none; stroke: url(#lp-ring-grad); stroke-width: 5; stroke-linecap: round; }
          .lp-spark { width: 100%; height: 28px; overflow: visible; }
          .lp-spark path { fill: none; stroke: var(--lp-cyan); stroke-width: 2; stroke-linecap: round; filter: drop-shadow(0 0 4px rgba(34, 211, 238, 0.6)); }
          .lp-chip {
            align-self: flex-start;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 3px 9px;
            border-radius: 99px;
            font-size: 11px;
            font-weight: 600;
            color: #86EFAC;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
          }
          .lp-gfi-repo { font-size: 11.5px; color: var(--lp-text-2); }
          .lp-gfi-title { font-size: 13.5px; font-weight: 500; color: var(--lp-text); line-height: 1.35; }
          .lp-bars { list-style: none; display: flex; flex-direction: column; gap: 8px; }
          .lp-bars li { display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: var(--lp-text-2); }
          .lp-bars i {
            display: block;
            height: 4px;
            width: var(--w);
            border-radius: 2px;
            background: linear-gradient(90deg, var(--lp-violet), var(--lp-cyan));
          }

          /* Stats bar */
          .lp-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            border: 1px solid var(--lp-border);
            border-radius: 20px;
            background: linear-gradient(180deg, rgba(17, 20, 40, 0.6), rgba(10, 12, 26, 0.6));
          }
          .lp-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 28px 16px; text-align: center; }
          .lp-stat + .lp-stat { border-left: 1px solid var(--lp-border); }
          .lp-stat strong {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.02em;
            background: linear-gradient(90deg, #E9D5FF, #93C5FD);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          .lp-stat span { font-size: 13.5px; color: var(--lp-text-2); }

          /* Features */
          .lp-features {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-top: 48px;
          }
          .lp-feature {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 26px 24px;
            border: 1px solid var(--lp-border);
            border-radius: 20px;
            background: var(--lp-card);
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }
          .lp-feature:hover { border-color: var(--lp-border-strong); box-shadow: 0 0 28px -12px rgba(124, 58, 237, 0.6); }
          .lp-feature-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 6px;
            border-radius: 12px;
            color: #C4B5FD;
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.22), rgba(59, 130, 246, 0.16));
            border: 1px solid rgba(168, 85, 247, 0.3);
          }
          .lp-feature h3 { font-size: 16px; font-weight: 600; color: var(--lp-text); }
          .lp-feature p { font-size: 14px; line-height: 1.6; color: var(--lp-text-2); }

          /* Tablet */
          @media (max-width: 1024px) {
            .lp-hero { grid-template-columns: 1fr; gap: 40px; padding: 56px 0 48px; }
            .lp h1 { max-width: 18ch; }
            .lp-visual { max-width: 560px; margin: 0 auto; }
            .lp-features { grid-template-columns: repeat(2, 1fr); }
          }
          /* Mobile: panels drop out of orbit into a grid under the cube */
          @media (max-width: 640px) {
            .lp { padding: 0 16px 64px; }
            .lp-hero { padding: 40px 0 40px; }
            .lp-lede { font-size: 16px; }
            .lp-actions { width: 100%; flex-direction: column; }
            .lp-btn { width: 100%; }
            .lp-visual {
              height: auto;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            .lp-cube-scene { grid-column: 1 / -1; justify-self: center; margin: 70px 0 100px; transform: scale(0.85); }
            .lp-panel { position: static; min-width: 0; max-width: none !important; }
            .lp-stats { grid-template-columns: repeat(2, 1fr); }
            .lp-stat:nth-child(3) { border-left: none; }
            .lp-stat:nth-child(n + 3) { border-top: 1px solid var(--lp-border); }
            .lp-stat strong { font-size: 26px; }
            .lp-features { grid-template-columns: 1fr; margin-top: 32px; }
          }
        `}</style>
      </main>
    </MotionConfig>
  )
}
