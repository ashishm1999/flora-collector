import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import SpeciesDetailPage from './pages/SpeciesDetailPage'
import AddSpecies from './pages/AddSpecies'
import EditSpecies from './pages/EditSpecies'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/species/:id" element={<SpeciesDetailPage />} />
                <Route path="/species/new" element={<AddSpecies />} />
                <Route path="/species/:id/edit" element={<EditSpecies />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/flora-collector">
      <AuthProvider>
        <AppRoutes />
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  )
}
