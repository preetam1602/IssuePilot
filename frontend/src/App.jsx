import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import AnimatedBackground from './components/AnimatedBackground'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import IssueExplorer from './pages/IssueExplorer'
import IssueDetail from './pages/IssueDetail'
import Profile from './pages/Profile'
import { isSignedIn } from './lib/api'

function RequireAuth({ children }) {
  return isSignedIn() ? children : <Navigate to="/landing" replace />
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <div>
      <AnimatedBackground />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to={isSignedIn() ? '/dashboard' : '/landing'} replace />} />
          <Route path="/landing" element={<PageTransition><Landing /></PageTransition>} />
          <Route path="/dashboard" element={<RequireAuth><PageTransition><Dashboard /></PageTransition></RequireAuth>} />
          <Route path="/issues" element={<PageTransition><IssueExplorer /></PageTransition>} />
          <Route path="/issues/:id" element={<PageTransition><IssueDetail /></PageTransition>} />
          <Route path="/profile" element={<RequireAuth><PageTransition><Profile /></PageTransition></RequireAuth>} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
