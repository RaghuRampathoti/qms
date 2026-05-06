import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import InterviewerDashboard from './pages/InterviewerDashboard'
import ManageCabins from './pages/ManageCabins'
import ManageCandidates from './pages/ManageCandidates'
import ManageFeedback from './pages/ManageFeedback'
import ManageUsers from './pages/ManageUsers'
import InterviewerFeedback from './pages/InterviewerFeedback'
import CandidateRegisterPage from './pages/CandidateRegisterPage'

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (!token) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />

  return children
}

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<CandidateRegisterPage />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="ADMIN">
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cabins"
          element={
            <ProtectedRoute role="ADMIN">
              <ManageCabins />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/candidates"
          element={
            <ProtectedRoute role="ADMIN">
              <ManageCandidates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <ProtectedRoute role="ADMIN">
              <ManageFeedback />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interviewer/dashboard"
          element={
            <ProtectedRoute role="INTERVIEWER">
              <InterviewerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviewer/feedback"
          element={
            <ProtectedRoute role="INTERVIEWER">
              <InterviewerFeedback />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App