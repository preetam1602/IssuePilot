import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import IssueExplorer from './pages/IssueExplorer'
import IssueDetail from './pages/IssueDetail'
import Profile from './pages/Profile'
import { isSignedIn } from './lib/api'

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to={isSignedIn() ? '/dashboard' : '/landing'} replace />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/issues" element={<IssueExplorer />} />
        <Route path="/issues/:id" element={<IssueDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  )
}
