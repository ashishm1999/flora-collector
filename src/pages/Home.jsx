import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpeciesList } from '../hooks/useSpecies'
import ConservationBadge from '../components/ConservationBadge'
import { Search, Plus, ChevronLeft, ChevronRight, Leaf, Filter } from 'lucide-react'

export default function Home() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [family, setFamily] = useState('')
  const [sortBy, setSortBy] = useState('scientific_name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const pageSize = 20

  const { species, loading, error, totalCount } = useSpeciesList({
    search: debouncedSearch,
    family,
    sortBy,
    sortOrder,
    page,
    pageSize,
  })

  const totalPages = Math.ceil(totalCount / pageSize)

  let debounceTimer
  const handleSearch = (value) => {
    setSearch(value)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 400)
  }

  const getPrimaryImage = (sp) => {
    const images = sp.species_images || []
    const primary = images.find((img) => img.is_primary)
    return primary?.public_url || images[0]?.public_url || null
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Species Database</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount} species recorded
          </p>
        </div>
        <Link
          to="/species/new"
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Species
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by scientific name, common name, family, or genus..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-1 transition-colors ${
              showFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Family</label>
              <input
                type="text"
                value={family}
                onChange={(e) => { setFamily(e.target.value); setPage(1) }}
                placeholder="e.g. Proteaceae"
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="scientific_name">Scientific Name</option>
                <option value="family">Family</option>
                <option value="created_at">Date Added</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="asc">A-Z</option>
                <option value="desc">Z-A</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12 text-red-600">
          <p>Error loading species: {error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && species.length === 0 && (
        <div className="text-center py-20">
          <Leaf className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">No species found</h3>
          <p className="text-sm text-gray-400">
            {search ? 'Try a different search term.' : 'Add your first species to get started!'}
          </p>
          {!search && (
            <Link
              to="/species/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> Add New Species
            </Link>
          )}
        </div>
      )}

      {/* Species Grid */}
      {!loading && species.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {species.map((sp) => {
            const img = getPrimaryImage(sp)
            return (
              <Link
                key={sp.id}
                to={`/species/${sp.id}`}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="h-40 bg-gray-100 overflow-hidden">
                  {img ? (
                    <img src={img} alt={sp.scientific_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 italic">{sp.scientific_name}</h3>
                  {sp.common_names?.length > 0 && (
                    <p className="text-sm text-gray-500 mt-0.5">{sp.common_names[0]}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {sp.family && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{sp.family}</span>
                    )}
                    <ConservationBadge status={sp.conservation_status} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
