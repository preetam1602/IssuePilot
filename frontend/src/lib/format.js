export function timeAgo(dateString) {
  if (!dateString) return null

  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays} days ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`

  const diffYears = Math.floor(diffMonths / 12)
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
}

export function scoreTier(score) {
  if (score == null) return null
  if (score >= 0.66) return 'High'
  if (score >= 0.33) return 'Medium'
  return 'Low'
}

const DIFFICULTY_LABELS = {
  easy: 'Beginner',
  medium: 'Intermediate',
  hard: 'Hard',
}

export function difficultyLabel(difficulty) {
  return DIFFICULTY_LABELS[difficulty] ?? null
}
