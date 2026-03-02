import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import Home from './pages/Home'
import SpeciesDetailPage from './pages/SpeciesDetailPage'
import AddSpecies from './pages/AddSpecies'
import EditSpecies from './pages/EditSpecies'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter basename="/flora-collector">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/species/:id" element={<SpeciesDetailPage />} />
          <Route path="/species/new" element={<AddSpecies />} />
          <Route path="/species/:id/edit" element={<EditSpecies />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
      <Toaster position="bottom-right" richColors />
    </BrowserRouter>
  )
}
