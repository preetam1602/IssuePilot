import { Bookmark } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSavedIssues, useToggleSave } from '../hooks/useSaved'
import { isSignedIn } from '../lib/api'

export default function SaveButton({ issueId, wide = false }) {
  const { data } = useSavedIssues()
  const toggle = useToggleSave()

  if (!isSignedIn()) return null

  const saved = (data?.saved ?? []).some(item => item.issue_id === issueId)

  return (
    <motion.button
      type="button"
      className={`button button-ghost save-button ${saved ? 'is-saved' : ''}`}
      style={wide ? { width: '100%', marginTop: 8 } : undefined}
      onClick={() => toggle.mutate({ issueId, saved })}
      disabled={toggle.isPending}
      aria-pressed={saved}
      whileTap={{ scale: 0.92 }}
    >
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
      <span>{saved ? 'Saved' : 'Save'}</span>

      <style>{`
        .save-button.is-saved { color: var(--primary); }
      `}</style>
    </motion.button>
  )
}
