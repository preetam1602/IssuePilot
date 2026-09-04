import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import IssueCard from '../components/IssueCard'
import { useIssues } from '../hooks/useIssues'
import { Search } from 'lucide-react'

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export default function IssueExplorer() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('best_match')
  const [difficulty, setDifficulty] = useState('')

  const { data, isLoading, isError } = useIssues({ search, sort, difficulty })
  const issues = data?.issues ?? []
  const total = data?.total ?? issues.length

  const submitSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="explorer-main">
        <header className="explorer-header">
          <h2>Issue Explorer</h2>
          <p>Browse and search for issues across thousands of repositories.</p>
        </header>

        <section className="search-section">
          <motion.form
            className="search-bar-container"
            onSubmit={submitSearch}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search issues by title, repository, or labels..."
              className="search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <motion.button
              type="submit"
              className="button button-primary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Search
            </motion.button>
          </motion.form>

          <div className="filters-bar">
            <div className="filter-group">
              <select
                className="filter-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">Difficulty: All</option>
                <option value="easy">Beginner</option>
                <option value="medium">Intermediate</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </section>

        <section className="explorer-results">
          <div className="results-header">
            <span>{isLoading ? 'Loading issues...' : `Showing ${total} issues`}</span>
            <div className="sort-by">
              <span className="text-muted">Sort by:</span>
              <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="best_match">Best Match</option>
                <option value="newest">Newest</option>
                <option value="difficulty_asc">Difficulty (Low to High)</option>
                <option value="score_desc">Score (High to Low)</option>
              </select>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              className="issues-grid"
              key={`${search}-${sort}-${difficulty}`}
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
            >
              {isError && <p className="text-muted">Couldn't load issues.</p>}
              {!isLoading && !isError && issues.length === 0 && (
                <p className="text-muted">No issues match your search.</p>
              )}
              {issues.map(issue => (
                <IssueCard key={issue.issue_id} issue={issue} />
              ))}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <style>{`
        .explorer-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .search-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .search-bar-container {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 8px 12px;
          transition: all 0.2s ease;
        }
        .search-bar-container:focus-within {
          border-color: var(--primary);
          box-shadow: var(--shadow-glow);
        }
        .search-icon { color: var(--muted); margin-left: 8px; }
        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text);
          font-size: 16px;
          padding: 8px 4px;
          outline: none;
        }
        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .filter-group {
          display: flex;
          gap: 8px;
        }
        .filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 99px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-button:hover {
          color: var(--text);
          border-color: var(--muted);
        }
        .filter-button.secondary {
          background: transparent;
        }
        .filter-select {
          padding: 6px 16px;
          background: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 99px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          outline: none;
        }
        .filter-select:hover {
          color: var(--text);
          border-color: var(--muted);
        }
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .sort-by {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sort-select {
          background: transparent;
          border: none;
          color: var(--text);
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }
        .issues-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .issues-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
