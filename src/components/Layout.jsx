import { Link } from 'react-router-dom'
import { Leaf, LayoutDashboard, Plus, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800">
              <Leaf className="w-6 h-6" />
              <span className="text-xl font-semibold">Flora Collector</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Species
              </Link>
              <Link to="/species/new" className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Species
              </Link>
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100">
              <nav className="flex flex-col gap-2 pt-3">
                <Link to="/" className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded" onClick={() => setMobileMenuOpen(false)}>
                  Species
                </Link>
                <Link to="/species/new" className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded" onClick={() => setMobileMenuOpen(false)}>
                  Add Species
                </Link>
                <Link to="/dashboard" className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-400">
            Flora Collector — Australian Native Plant Species Database
          </p>
        </div>
      </footer>
    </div>
  )
}
