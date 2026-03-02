import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useApiLookup } from '../hooks/useApiLookup'

export default function ApiLookup({ onResult }) {
  const [searchName, setSearchName] = useState('')
  const { lookup, loading, error } = useApiLookup()

  const handleSearch = async () => {
    if (!searchName.trim()) return

    const result = await lookup(searchName)
    if (result && onResult) {
      onResult(result)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-emerald-800 mb-2">
        Auto-populate from Biodiversity Databases
      </h3>
      <p className="text-xs text-emerald-600 mb-3">
        Enter a scientific name to search GBIF, POWO, ALA, iNaturalist, and VicFlora.
        Results will pre-fill the form fields below.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Banksia marginata"
          className="flex-1 px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 italic"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !searchName.trim()}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" /> Search APIs
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
