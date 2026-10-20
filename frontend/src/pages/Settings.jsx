import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, ArrowDown, Minus, Rocket, VolumeX, Sparkles, Check } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useMatcher, useMatcherPreview, useSaveMatcher } from '../hooks/useInsights'

const DIFFICULTIES = [
  { value: 'any', label: 'Any' },
  { value: 'easy', label: 'Beginner' },
  { value: 'medium', label: 'Intermediate' },
  { value: 'hard', label: 'Hard' },
]

// Clicking a language chip cycles it: neutral, then boosted, then muted.
function cycleLanguage(prefs, language) {
  const boosted = prefs.boosted_languages.includes(language)
  const muted = prefs.muted_languages.includes(language)
  const without = list => list.filter(l => l !== language)
  if (!boosted && !muted) return { ...prefs, boosted_languages: [...prefs.boosted_languages, language] }
  if (boosted) return { ...prefs, boosted_languages: without(prefs.boosted_languages), muted_languages: [...prefs.muted_languages, language] }
  return { ...prefs, muted_languages: without(prefs.muted_languages) }
}

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function RankShift({ from, to }) {
  const moved = from - to
  if (moved > 0) return <span className="shift up" title={`Up ${moved} from #${from}`}><ArrowUp size={12} />{moved}</span>
  if (moved < 0) return <span className="shift down" title={`Down ${-moved} from #${from}`}><ArrowDown size={12} />{-moved}</span>
  return <span className="shift same" title="Same rank"><Minus size={12} /></span>
}

function MatcherForm({ initial, languages }) {
  const [prefs, setPrefs] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const debouncedPrefs = useDebounced(prefs, 300)
  const preview = useMatcherPreview(debouncedPrefs)
  const save = useSaveMatcher()

  const dirty = JSON.stringify(prefs) !== JSON.stringify(saved)
  const items = preview.data?.preview ?? []

  const submit = () =>
    save.mutate(prefs, { onSuccess: res => setSaved(res.prefs) })

  return (
    <div className="matcher-grid">
      <section className="card matcher-controls">
        <div className="control-group">
          <h4 className="widget-title">Languages</h4>
          <p className="text-small control-hint">
            Click once to <strong>boost</strong>, twice to <strong>mute</strong>, three times to reset.
          </p>
          <div className="lang-chips">
            {languages.map(language => {
              const state = prefs.boosted_languages.includes(language)
                ? 'boosted'
                : prefs.muted_languages.includes(language) ? 'muted' : 'neutral'
              return (
                <motion.button
                  key={language}
                  type="button"
                  className={`lang-chip ${state}`}
                  onClick={() => setPrefs(cycleLanguage(prefs, language))}
                  whileTap={{ scale: 0.92 }}
                  layout
                >
                  {state === 'boosted' && <Rocket size={12} />}
                  {state === 'muted' && <VolumeX size={12} />}
                  {language}
                </motion.button>
              )
            })}
            {languages.length === 0 && <span className="text-muted text-small">No languages yet.</span>}
          </div>
        </div>

        <div className="control-group">
          <h4 className="widget-title">Comfort zone</h4>
          <div className="segmented" role="radiogroup" aria-label="Comfort difficulty">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                type="button"
                role="radio"
                aria-checked={prefs.comfort_difficulty === d.value}
                className={`segment ${prefs.comfort_difficulty === d.value ? 'active' : ''}`}
                onClick={() => setPrefs({ ...prefs, comfort_difficulty: d.value })}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-small control-hint">Issues further from this level sink down the list.</p>
        </div>

        <div className="control-group">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={prefs.prefer_fresh}
              onChange={e => setPrefs({ ...prefs, prefer_fresh: e.target.checked })}
            />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span>
              <strong>Prefer fresh issues</strong>
              <span className="text-small control-hint block">Lift issues from the last month, sink ones over a year old.</span>
            </span>
          </label>
        </div>

        <div className="save-row">
          <motion.button
            type="button"
            className="button button-primary"
            onClick={submit}
            disabled={!dirty || save.isPending}
            whileTap={{ scale: 0.97 }}
          >
            {save.isPending ? 'Saving...' : dirty ? 'Save preferences' : <><Check size={16} /> Saved</>}
          </motion.button>
          {dirty && (
            <button type="button" className="button button-ghost" onClick={() => setPrefs(saved)}>
              Discard
            </button>
          )}
          {save.isError && <span className="text-muted text-small">Couldn't save. Try again.</span>}
        </div>
      </section>

      <section className="card matcher-preview">
        <div className="preview-header">
          <h4 className="widget-title"><Sparkles size={14} /> Live preview: your top 5</h4>
          {preview.isFetching && <span className="text-muted text-small">Updating...</span>}
        </div>
        {preview.isError && <p className="text-muted text-small">Couldn't load the preview.</p>}
        {!preview.isLoading && items.length === 0 && (
          <p className="text-muted text-small">No recommendations to rank yet.</p>
        )}
        <ol className="preview-list">
          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <motion.li
                key={item.issue_id}
                layout
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                className="preview-item"
              >
                <span className="preview-rank">{i + 1}</span>
                <div className="preview-body">
                  <Link to={`/issues/${item.issue_id}`} className="preview-title">{item.title}</Link>
                  <span className="preview-meta">{item.repo}{item.language ? ` · ${item.language}` : ''}</span>
                </div>
                <RankShift from={item.base_rank} to={i + 1} />
                <span className="preview-score">{item.score}%</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
        <p className="text-small control-hint">Arrows show how far each issue moved from its rank without your preferences.</p>
      </section>
    </div>
  )
}

export default function Settings() {
  const { data, isLoading, isError } = useMatcher()

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h2>Tune Your Matcher</h2>
          <p>Steer what IssuePilot recommends. The preview re-ranks as you change things, before you commit.</p>
        </motion.header>

        {isLoading && <p className="text-muted">Loading your preferences...</p>}
        {isError && <p className="text-muted">Couldn't load your preferences.</p>}
        {data && <MatcherForm initial={data.prefs} languages={data.languages} />}
      </main>

      <style>{`
        .dashboard-main { flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 0; }
        .widget-title {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--muted); margin-bottom: 12px;
        }
        .matcher-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
        .matcher-controls { display: flex; flex-direction: column; gap: 28px; }
        .matcher-controls:hover, .matcher-preview:hover { transform: none; }
        .control-hint { color: var(--muted); margin-top: 8px; }
        .control-hint.block, .block { display: block; }
        .lang-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .lang-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 99px; cursor: pointer;
          border: 1px solid var(--border); background: var(--elevated);
          color: var(--text-secondary); font-size: 13px; font-weight: 500;
        }
        .lang-chip.boosted { border-color: var(--primary); background: var(--border-light); color: var(--primary); }
        .lang-chip.muted { color: var(--muted); text-decoration: line-through; border-style: dashed; }
        .segmented {
          display: flex; padding: 3px; gap: 2px; width: fit-content; flex-wrap: wrap;
          background: var(--elevated); border: 1px solid var(--border); border-radius: 10px;
        }
        .segment {
          padding: 6px 14px; border: none; border-radius: 8px; cursor: pointer;
          background: transparent; color: var(--text-secondary); font-size: 13px; font-weight: 600;
        }
        .segment.active { background: var(--border-light); color: var(--primary); }
        .toggle-row { display: flex; gap: 12px; align-items: flex-start; cursor: pointer; color: var(--text); font-size: 14px; }
        .toggle-row input { position: absolute; opacity: 0; pointer-events: none; }
        .toggle-track {
          width: 36px; height: 20px; border-radius: 99px; flex-shrink: 0; margin-top: 2px;
          background: var(--border); position: relative; transition: background 0.2s;
        }
        .toggle-thumb {
          position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%;
          background: var(--text); transition: transform 0.2s;
        }
        .toggle-row input:checked + .toggle-track { background: var(--primary); }
        .toggle-row input:checked + .toggle-track .toggle-thumb { transform: translateX(16px); }
        .toggle-row input:focus-visible + .toggle-track { outline: 2px solid var(--primary); outline-offset: 2px; }
        .save-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .preview-header { display: flex; justify-content: space-between; align-items: baseline; }
        .preview-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .preview-item {
          display: grid; grid-template-columns: 24px minmax(0, 1fr) auto 44px; gap: 12px; align-items: center;
          padding: 10px 12px; border-radius: 10px; background: var(--elevated); border: 1px solid var(--border);
        }
        .preview-rank { font-weight: 800; color: var(--muted); text-align: center; }
        .preview-body { display: flex; flex-direction: column; min-width: 0; }
        .preview-title {
          font-size: 14px; color: var(--text); text-decoration: none;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .preview-title:hover { color: var(--primary); }
        .preview-meta { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .shift { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; font-weight: 700; }
        .shift.up { color: var(--success); }
        .shift.down { color: var(--danger); }
        .shift.same { color: var(--muted); }
        .preview-score { font-weight: 700; text-align: right; color: var(--text); }
        @media (max-width: 1100px) {
          .matcher-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
