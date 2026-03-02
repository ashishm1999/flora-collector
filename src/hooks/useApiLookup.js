import { useState } from 'react'
import { lookupSpecies } from '../lib/apiServices'

export function useApiLookup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const lookup = async (speciesName) => {
    if (!speciesName.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const merged = await lookupSpecies(speciesName.trim())
      setResult(merged)
      return merged
    } catch (err) {
      setError(err.message || 'API lookup failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  const clearResult = () => {
    setResult(null)
    setError(null)
  }

  return { lookup, loading, error, result, clearResult }
}
