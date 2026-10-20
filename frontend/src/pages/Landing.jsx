import { Link } from 'react-router-dom'
import { Github, ArrowRight, Star, Plane, Sparkles, Search, Zap, BarChart3 } from 'lucide-react'
import { motion, MotionConfig } from 'framer-motion'
import { signInWithGitHub } from '../lib/api'

// Static sample data for the product preview; the real dashboard reads from /recommend.
const FLIGHT = {
  id: 'IP-0842',
  from: { code: 'YOU', sub: 'Python · TypeScript' },
  to: { code: 'TYPER', sub: 'tiangolo/typer' },
  title: 'Show default values for Enum options in --help',
  fields: [
    { label: 'Difficulty', value: 'Beginner' },
    { label: 'Effort', value: '~3 hrs' },
    { label: 'Skill match', value: '92%' },
  ],
  success: 78,
}
const DEPARTURES = [
  { repo: 'vitejs/vite', issue: 'Clarify config promise error', match: 88, status: 'Boarding' },
  { repo: 'rust-lang/rustlings', issue: 'Hint for iterators3', match: 81, status: 'On time' },
  { repo: 'astral-sh/ruff', issue: 'Document E501 settings', match: 76, status: 'On time' },
]
const WEEKLY_MATCHES = [
  { day: 'Mon', value: 6 },
  { day: 'Tue', value: 9 },
  { day: 'Wed', value: 7 },
  { day: 'Thu', value: 12 },
  { day: 'Fri', value: 10 },
  { day: 'Sat', value: 14 },
  { day: 'Sun', value: 11 },
]
// Bar widths for the decorative barcode on the pass stub.
const BARCODE = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1]
const FEATURES = [
  { icon: Search, title: 'Skill-matched discovery', text: 'Issues ranked against the languages in your GitHub repos.' },
  { icon: Zap, title: 'Success predictions', text: 'An AI read on how likely you are to land a fix.' },
  { icon: BarChart3, title: 'Progress you can see', text: 'Track the issues you check and the PRs you merge.' },
]

const ease = [0.22, 1, 0.36, 1]
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease },
})

function WeeklySpark() {
  const max = Math.max(...WEEKLY_MATCHES.map(d => d.value))
  return (
    <div className="lp-spark" role="img" aria-label="Issues matched per day this week">
      {WEEKLY_MATCHES.map((d, i) => (
        <motion.span
          key={d.day}
          className="lp-spark-bar"
          title={`${d.day}: ${d.value} matches`}
          initial={{ height: 0 }}
          animate={{ height: `${(d.value / max) * 100}%` }}
          transition={{ duration: 0.6, delay: 0.8 + i * 0.04, ease }}
        />
      ))}
    </div>
  )
}

function BoardingPass() {
  return (
    <div className="lp-pass">
      <div className="lp-pass-main">
        <div className="lp-pass-head">
          <span className="lp-pass-tag"><Sparkles size={12} /> Recommended for you</span>
          <span className="lp-mono lp-pass-id">{FLIGHT.id}</span>
        </div>

        <div className="lp-route">
          <div className="lp-route-end">
            <span className="lp-mono lp-route-code">{FLIGHT.from.code}</span>
            <span className="lp-route-sub">{FLIGHT.from.sub}</span>
          </div>
          <div className="lp-route-line" aria-hidden="true">
            <motion.span
              className="lp-route-trail"
              initial={{ width: '0%' }}
              animate={{ width: '64%' }}
              transition={{ duration: 1.4, delay: 0.5, ease }}
            />
            <motion.span
              className="lp-route-plane"
              initial={{ left: '0%' }}
              animate={{ left: '64%' }}
              transition={{ duration: 1.4, delay: 0.5, ease }}
            >
              <Plane size={14} />
            </motion.span>
          </div>
          <div className="lp-route-end lp-route-end-to">
            <span className="lp-mono lp-route-code">{FLIGHT.to.code}</span>
            <span className="lp-route-sub">{FLIGHT.to.sub}</span>
          </div>
        </div>

        <p className="lp-pass-title">{FLIGHT.title}</p>

        <dl className="lp-pass-fields">
          {FLIGHT.fields.map(f => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="lp-perf" aria-hidden="true" />

      <div className="lp-pass-stub">
        <span className="lp-stub-label">Success</span>
        <span className="lp-stub-value">{FLIGHT.success}%</span>
        <span className="lp-stub-note">Likely to merge</span>
        <div className="lp-barcode" aria-hidden="true">
          {BARCODE.map((w, i) => <span key={i} style={{ width: w }} />)}
        </div>
      </div>
    </div>
  )
}

function DepartureBoard() {
  return (
    <div className="lp-board">
      <div className="lp-board-head">
        <span className="lp-board-title">Next departures</span>
        <div className="lp-board-week">
          <span>This week</span>
          <WeeklySpark />
        </div>
      </div>
      <ul className="lp-board-rows">
        {DEPARTURES.map((d, i) => (
          <motion.li
            key={d.repo}
            className="lp-board-row"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.7 + i * 0.08, ease }}
          >
            <div className="lp-board-issue">
              <span className="lp-board-repo">{d.repo}</span>
              <span className="lp-board-name">{d.issue}</span>
            </div>
            <span className="lp-mono lp-board-match">{d.match}%</span>
            <span className={`lp-board-status ${d.status === 'Boarding' ? 'is-boarding' : ''}`}>{d.status}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function ProductPreview() {
  return (
    <div className="lp-preview" aria-label="IssuePilot dashboard preview">
      <BoardingPass />
      <DepartureBoard />
    </div>
  )
}

export default function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="lp">
        <section className="lp-shell">
          <div className="lp-glow" aria-hidden="true" />

          <div className="lp-hero">
            <div className="lp-copy">
              <motion.span className="lp-eyebrow" {...fadeUp(0)}>
                <Sparkles size={13} /> AI-matched open source issues
              </motion.span>
              <motion.h1 {...fadeUp(0.05)}>
                Find the open source issue <span className="lp-accent">you can actually ship.</span>
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
                  Explore issues
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
              <motion.p className="lp-fineprint" {...fadeUp(0.2)}>
                <Star size={13} /> Free for contributors. Read-only access to your public profile.
              </motion.p>
            </div>

            <motion.div
              className="lp-visual"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease }}
            >
              <ProductPreview />
            </motion.div>
          </div>

          <div className="lp-features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="lp-feature">
                <span className="lp-feature-icon"><Icon size={16} /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <style>{`
          .lp {
            --lp-bg: #050B08;
            --lp-shell: #0B1210;
            --lp-card: #101A16;
            --lp-elevated: #16231D;
            --lp-mint: #5EE0B5;
            --lp-emerald: #10B981;
            --lp-text: #F3F7F4;
            --lp-text-2: #A0ADA5;
            --lp-border: #24352C;

            flex: 1;
            width: 100%;
            background: var(--lp-bg);
            padding: 24px 32px 48px;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: var(--lp-text);
          }
          .lp-shell {
            position: relative;
            max-width: var(--container-max);
            margin: 0 auto;
            background: var(--lp-shell);
            border: 1px solid var(--lp-border);
            border-radius: 28px;
            overflow: hidden;
            isolation: isolate;
          }
          .lp-glow {
            position: absolute;
            inset: 0;
            z-index: -1;
            pointer-events: none;
            background:
              radial-gradient(600px circle at 12% 0%, rgba(16, 185, 129, 0.14), transparent 60%),
              radial-gradient(520px circle at 92% 70%, rgba(45, 212, 191, 0.07), transparent 60%);
          }
          .lp-hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
            gap: 56px;
            align-items: center;
            padding: 72px 64px 56px;
          }
          .lp-copy { display: flex; flex-direction: column; align-items: flex-start; }
          .lp-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border: 1px solid var(--lp-border);
            border-radius: 99px;
            background: rgba(16, 185, 129, 0.06);
            color: var(--lp-mint);
            font-size: 12.5px;
            font-weight: 500;
            letter-spacing: 0.01em;
          }
          .lp h1 {
            margin-top: 24px;
            font-size: clamp(36px, 4.6vw, 58px);
            font-weight: 700;
            line-height: 1.05;
            letter-spacing: -0.035em;
            color: var(--lp-text);
            max-width: 13ch;
          }
          .lp-accent { color: var(--lp-mint); }
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
            height: 46px;
            padding: 0 20px;
            border-radius: 12px;
            font: inherit;
            font-size: 14.5px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
          }
          .lp-btn-primary {
            background: var(--lp-mint);
            color: #04130D;
            border: 1px solid var(--lp-mint);
          }
          .lp-btn-primary:hover { background: #7AE8C4; transform: translateY(-1px); }
          .lp-btn-secondary {
            background: transparent;
            color: var(--lp-text);
            border: 1px solid var(--lp-border);
          }
          .lp-btn-secondary:hover { border-color: var(--lp-emerald); background: rgba(16, 185, 129, 0.06); }
          .lp-btn-secondary svg { transition: transform 0.2s ease; }
          .lp-btn-secondary:hover svg { transform: translateX(2px); }
          .lp-btn:focus-visible { outline: 2px solid var(--lp-mint); outline-offset: 3px; }
          .lp-fineprint {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 20px;
            font-size: 13px;
            color: var(--lp-text-2);
          }
          .lp-fineprint svg { color: var(--lp-emerald); }

          .lp-visual { min-width: 0; }
          .lp-mono { font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace; }
          .lp-preview {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 14px;
            background: var(--lp-card);
            border: 1px solid var(--lp-border);
            border-radius: 22px;
            box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.6);
          }

          /* Boarding pass: the top recommendation, routed from your stack to the issue */
          .lp-pass {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 0 132px;
            background: var(--lp-elevated);
            border: 1px solid var(--lp-border);
            border-radius: 16px;
            /* Clips the perforation circles into half-moon notches. */
            overflow: hidden;
          }
          .lp-pass-main { padding: 18px 20px; min-width: 0; }
          .lp-pass-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
          .lp-pass-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--lp-mint);
          }
          .lp-pass-id { font-size: 11px; color: var(--lp-text-2); letter-spacing: 0.06em; }
          .lp-route {
            display: grid;
            grid-template-columns: auto minmax(40px, 1fr) auto;
            align-items: center;
            gap: 14px;
            margin-top: 18px;
          }
          .lp-route-end { display: flex; flex-direction: column; min-width: 0; }
          .lp-route-end-to { align-items: flex-end; text-align: right; }
          .lp-route-code { font-size: 26px; font-weight: 700; letter-spacing: 0.02em; color: var(--lp-text); line-height: 1.1; }
          .lp-route-sub { font-size: 11.5px; color: var(--lp-text-2); white-space: nowrap; }
          .lp-route-line {
            position: relative;
            height: 2px;
            background-image: linear-gradient(to right, var(--lp-border) 50%, transparent 50%);
            background-size: 8px 2px;
          }
          .lp-route-line::after {
            content: '';
            position: absolute;
            right: -3px;
            top: -3px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            border: 2px solid var(--lp-emerald);
            background: var(--lp-elevated);
          }
          .lp-route-trail {
            position: absolute;
            left: 0;
            top: 0;
            height: 2px;
            background: var(--lp-emerald);
            border-radius: 2px;
          }
          .lp-route-plane {
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            display: flex;
            color: var(--lp-mint);
          }
          .lp-pass-title {
            margin-top: 16px;
            font-size: 15px;
            font-weight: 500;
            line-height: 1.45;
            color: var(--lp-text);
          }
          .lp-pass-fields {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid var(--lp-border);
          }
          .lp-pass-fields dt {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--lp-text-2);
          }
          .lp-pass-fields dd { margin-top: 2px; font-size: 13.5px; font-weight: 600; color: var(--lp-text); }

          /* Perforated tear line with notches cut into the pass edge */
          .lp-perf { position: relative; border-left: 2px dashed var(--lp-border); }
          .lp-perf::before, .lp-perf::after {
            content: '';
            position: absolute;
            left: -11px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--lp-card);
            border: 1px solid var(--lp-border);
          }
          .lp-perf::before { top: -11px; }
          .lp-perf::after { bottom: -11px; }

          .lp-pass-stub {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 18px 16px;
            min-width: 0;
          }
          .lp-stub-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--lp-text-2);
          }
          .lp-stub-value { font-size: 34px; font-weight: 700; letter-spacing: -0.03em; color: var(--lp-mint); line-height: 1.1; }
          .lp-stub-note { font-size: 11.5px; color: var(--lp-text-2); }
          .lp-barcode { display: flex; gap: 2px; height: 30px; margin-top: 14px; opacity: 0.55; }
          .lp-barcode span { display: block; height: 100%; background: var(--lp-text-2); border-radius: 1px; }

          /* Departure board: the rest of the recommendations */
          .lp-board {
            padding: 14px 16px 6px;
            border: 1px solid var(--lp-border);
            border-radius: 16px;
          }
          .lp-board-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-bottom: 10px; }
          .lp-board-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--lp-text-2);
          }
          .lp-board-week { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--lp-text-2); }
          .lp-spark { display: flex; align-items: flex-end; gap: 3px; height: 20px; }
          .lp-spark-bar { display: block; width: 5px; border-radius: 2px 2px 0 0; background: var(--lp-emerald); }
          .lp-spark-bar:last-child, .lp-spark-bar:hover { background: var(--lp-mint); }
          .lp-board-rows { list-style: none; }
          .lp-board-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto 76px;
            align-items: center;
            gap: 14px;
            padding: 11px 0;
            border-top: 1px solid var(--lp-border);
          }
          .lp-board-issue { display: flex; flex-direction: column; min-width: 0; }
          .lp-board-repo { font-size: 11.5px; color: var(--lp-text-2); }
          .lp-board-name {
            font-size: 13.5px;
            font-weight: 500;
            color: var(--lp-text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .lp-board-match { font-size: 14px; font-weight: 600; color: var(--lp-text); }
          .lp-board-status {
            justify-self: end;
            font-size: 10.5px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 3px 8px;
            border-radius: 6px;
            color: var(--lp-text-2);
            border: 1px solid var(--lp-border);
          }
          .lp-board-status.is-boarding {
            color: var(--lp-mint);
            border-color: rgba(94, 224, 181, 0.35);
            background: rgba(94, 224, 181, 0.08);
          }

          .lp-features {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border-top: 1px solid var(--lp-border);
          }
          .lp-feature { display: flex; gap: 14px; padding: 28px 32px; }
          .lp-feature + .lp-feature { border-left: 1px solid var(--lp-border); }
          .lp-feature-icon {
            flex-shrink: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9px;
            background: rgba(16, 185, 129, 0.1);
            color: var(--lp-mint);
          }
          .lp-feature h3 { font-size: 14.5px; font-weight: 600; color: var(--lp-text); }
          .lp-feature p { font-size: 13.5px; line-height: 1.55; color: var(--lp-text-2); margin-top: 4px; }

          @media (max-width: 1024px) {
            .lp-hero { grid-template-columns: 1fr; gap: 48px; padding: 56px 40px 40px; }
            .lp h1 { max-width: 16ch; }
            .lp-feature { padding: 24px; }
          }
          @media (max-width: 768px) {
            .lp { padding: 12px 16px 32px; }
            .lp-shell { border-radius: 20px; }
            .lp-hero { padding: 40px 20px 28px; gap: 36px; }
            .lp-lede { font-size: 16px; }
            .lp-actions { width: 100%; flex-direction: column; }
            .lp-btn { width: 100%; }
            .lp-features { grid-template-columns: 1fr; }
            .lp-feature { padding: 20px; }
            .lp-feature + .lp-feature { border-left: none; border-top: 1px solid var(--lp-border); }
          }
          @media (max-width: 560px) {
            .lp-preview { padding: 10px; border-radius: 18px; }
            .lp-pass { grid-template-columns: 1fr; }
            .lp-pass-main { padding: 16px; }
            .lp-route { gap: 10px; }
            .lp-route-code { font-size: 22px; }
            .lp-route-sub { white-space: normal; max-width: 9ch; }
            .lp-perf { border-left: none; border-top: 2px dashed var(--lp-border); height: 0; }
            .lp-perf::before, .lp-perf::after { top: -11px; bottom: auto; }
            .lp-perf::before { left: -11px; }
            .lp-perf::after { left: auto; right: -11px; }
            .lp-pass-stub { flex-direction: row; flex-wrap: wrap; justify-content: flex-start; align-items: baseline; column-gap: 10px; padding: 14px 16px; }
            .lp-stub-label { width: 100%; }
            .lp-stub-value { font-size: 28px; }
            .lp-barcode { margin: 0 0 0 auto; height: 24px; align-self: center; }
            .lp-board-row { grid-template-columns: minmax(0, 1fr) auto; }
            .lp-board-status { display: none; }
            .lp-board-week span { display: none; }
          }
        `}</style>
      </main>
    </MotionConfig>
  )
}
