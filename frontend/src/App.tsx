import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { UploadPage } from './pages/UploadPage'
import { VerificationPage } from './pages/VerificationPage'
import { DashboardPage } from './pages/DashboardPage'
import { TrustedDashboard } from './pages/TrustedDashboard'
import { ConflictDetailPage } from './pages/ConflictDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<UploadPage />} />
          <Route path="verification" element={<VerificationPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trusted-view" element={<TrustedDashboard />} />
          <Route path="conflicts/:id" element={<ConflictDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
