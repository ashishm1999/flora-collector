import { Link } from 'react-router-dom'
import { useDashboardStats } from '../hooks/useSpecies'
import { Leaf, Plus, AlertCircle, Clock, ShieldAlert } from 'lucide-react'

export default function Dashboard() {
  const { stats, loading } = useDashboardStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/species/new"
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Quick Add
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Species</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.recent.length}</p>
              <p className="text-sm text-gray-500">Recently Added</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.incomplete.length}</p>
              <p className="text-sm text-gray-500">Incomplete Records</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.unverified.length}</p>
              <p className="text-sm text-red-500">Not Found in APIs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unverified Species - Not found in APIs */}
      {stats.unverified.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" /> Species Not Found in APIs
          </h2>
          <p className="text-xs text-red-500 mb-3">These species could not be verified against any external biodiversity database (GBIF, ALA, POWO, iNaturalist, VicFlora)</p>
          <ul className="divide-y divide-red-100">
            {stats.unverified.map((sp) => (
              <li key={sp.id} className="py-2">
                <Link to={`/species/${sp.id}/edit`} className="flex justify-between items-center hover:bg-red-100 -mx-2 px-2 py-1 rounded">
                  <div>
                    <span className="text-sm font-medium text-red-900 italic">{sp.scientific_name}</span>
                    {sp.family && <span className="text-xs text-red-500 ml-2">{sp.family}</span>}
                  </div>
                  <span className="text-xs text-red-600 font-medium">Verify</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" /> Recently Added
          </h2>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No species added yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.recent.map((sp) => (
                <li key={sp.id} className="py-2">
                  <Link to={`/species/${sp.id}`} className="flex justify-between items-center hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
                    <div>
                      <span className="text-sm font-medium text-gray-900 italic">{sp.scientific_name}</span>
                      {sp.family && <span className="text-xs text-gray-500 ml-2">{sp.family}</span>}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(sp.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Incomplete Records */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" /> Incomplete Records
          </h2>
          <p className="text-xs text-gray-500 mb-3">Species missing descriptions or conservation status</p>
          {stats.incomplete.length === 0 ? (
            <p className="text-sm text-gray-400 italic">All records are complete!</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.incomplete.map((sp) => (
                <li key={sp.id} className="py-2">
                  <Link to={`/species/${sp.id}/edit`} className="flex justify-between items-center hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
                    <span className="text-sm font-medium text-gray-900 italic">{sp.scientific_name}</span>
                    <span className="text-xs text-orange-600">Edit</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
