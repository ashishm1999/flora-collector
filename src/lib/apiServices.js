const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── GBIF ────────────────────────────────────────────────────────────────────

async function fetchGBIF(speciesName) {
  try {
    const matchRes = await fetch(
      `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(speciesName)}`
    )
    if (!matchRes.ok) return null
    const match = await matchRes.json()
    if (match.matchType === 'NONE') return null

    const result = {
      source: 'GBIF',
      gbif_key: match.usageKey ?? null,
      scientific_name: match.scientificName ?? null,
      scientific_name_without_author: match.canonicalName ?? null,
      scientific_name_authorship: match.authorship ?? null,
      kingdom: match.kingdom ?? null,
      phylum: match.phylum ?? null,
      class: match.class ?? null,
      order: match.order ?? null,
      family: match.family ?? null,
      genus: match.genus ?? null,
      specific_epithet: match.species?.split(' ').pop() ?? null,
      rank: match.rank ?? null,
      taxonomic_status: match.status
        ? match.status.charAt(0).toUpperCase() + match.status.slice(1).toLowerCase()
        : null,
      synonyms: [],
      distribution_native: [],
    }

    // Fetch synonyms
    if (match.usageKey) {
      try {
        const synRes = await fetch(
          `https://api.gbif.org/v1/species/${match.usageKey}/synonyms?limit=20`
        )
        if (synRes.ok) {
          const synData = await synRes.json()
          result.synonyms = (synData.results ?? [])
            .map((s) => s.scientificName)
            .filter(Boolean)
        }
      } catch { /* ignore */ }

      // Fetch distributions
      try {
        const distRes = await fetch(
          `https://api.gbif.org/v1/species/${match.usageKey}/distributions?limit=50`
        )
        if (distRes.ok) {
          const distData = await distRes.json()
          result.distribution_native = (distData.results ?? [])
            .filter((d) => d.status === 'NATIVE' || !d.status)
            .map((d) => d.locality || d.area)
            .filter(Boolean)
        }
      } catch { /* ignore */ }
    }

    return result
  } catch (err) {
    console.error('GBIF fetch error:', err)
    return null
  }
}

// ─── ALA ─────────────────────────────────────────────────────────────────────

async function fetchALA(speciesName) {
  try {
    const searchRes = await fetch(
      `https://bie.ala.org.au/ws/search?q=${encodeURIComponent(speciesName)}&fq=rank:species&pageSize=1`
    )
    if (!searchRes.ok) return null
    const searchData = await searchRes.json()
    const results = searchData.searchResults?.results ?? []
    if (results.length === 0) return null

    const species = results[0]
    const result = {
      source: 'ALA',
      ala_guid: species.guid ?? null,
      common_names: [],
      conservation_status: {},
    }

    if (species.commonName) {
      result.common_names = species.commonName
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
    }

    // Fetch detailed info
    if (species.guid) {
      try {
        const detailRes = await fetch(
          `https://bie.ala.org.au/ws/species/${encodeURIComponent(species.guid)}`
        )
        if (detailRes.ok) {
          const detail = await detailRes.json()
          if (detail.conservationStatuses && detail.conservationStatuses.length > 0) {
            const cs = detail.conservationStatuses[0]
            result.conservation_status = {
              iucnCategory: cs.status ?? null,
              authority: cs.system ?? null,
              nationalStatus: null,
            }
          }
        }
      } catch { /* ignore */ }
    }

    return result
  } catch (err) {
    console.error('ALA fetch error:', err)
    return null
  }
}

// ─── iNaturalist ─────────────────────────────────────────────────────────────

async function fetchINaturalist(speciesName) {
  try {
    const res = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(speciesName)}&rank=species&per_page=1`
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.results || data.results.length === 0) return null

    const taxon = data.results[0]
    const result = {
      source: 'iNaturalist',
      inaturalist_id: taxon.id ?? null,
      common_names: [],
      conservation_status: {},
    }

    if (taxon.preferred_common_name) {
      result.common_names = [taxon.preferred_common_name]
    }

    if (taxon.conservation_statuses && taxon.conservation_statuses.length > 0) {
      const cs = taxon.conservation_statuses[0]
      result.conservation_status = {
        iucnCategory: cs.iucn ?? cs.status ?? null,
        authority: cs.authority ?? null,
      }
    }

    return result
  } catch (err) {
    console.error('iNaturalist fetch error:', err)
    return null
  }
}

// ─── POWO (Kew) ─────────────────────────────────────────────────────────────
// Note: POWO may have CORS issues in the browser. We attempt a direct call,
// and fall back gracefully if blocked.

async function fetchPOWO(speciesName) {
  try {
    const searchRes = await fetch(
      `https://powo.science.kew.org/api/2/search?q=${encodeURIComponent(speciesName)}&page.size=1`
    )
    if (!searchRes.ok) return null
    const searchData = await searchRes.json()
    const results = searchData.results ?? []
    if (results.length === 0) return null

    const fqId = results[0].fqId
    if (!fqId) return null

    await delay(500) // Rate limit respect

    const detailRes = await fetch(
      `https://powo.science.kew.org/api/2/taxon/${encodeURIComponent(fqId)}?fields=all`
    )
    if (!detailRes.ok) return null
    const detail = await detailRes.json()

    const result = {
      source: 'POWO',
      powo_id: fqId,
      synonyms: [],
      distribution_native: [],
      distribution_introduced: [],
      life_form: null,
    }

    if (detail.synonyms) {
      result.synonyms = detail.synonyms.map((s) => s.name).filter(Boolean)
    }

    if (detail.distribution) {
      if (detail.distribution.natives) {
        result.distribution_native = detail.distribution.natives.map((d) => d.name).filter(Boolean)
      }
      if (detail.distribution.introduced) {
        result.distribution_introduced = detail.distribution.introduced.map((d) => d.name).filter(Boolean)
      }
    }

    if (detail.lifeform?.freeformValue) {
      result.life_form = detail.lifeform.freeformValue
    }

    return result
  } catch (err) {
    console.error('POWO fetch error:', err)
    return null
  }
}

// ─── VicFlora ────────────────────────────────────────────────────────────────

async function fetchVicFlora(speciesName) {
  try {
    const query = `{
      taxonConcepts(filter: {taxonName: {scientificName: {eq: "${speciesName}"}}}) {
        data {
          id
          taxonName { scientificName authorship }
          currentProfile { description habitat }
        }
      }
    }`

    const res = await fetch('https://vicflora.rbg.vic.gov.au/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const concepts = data?.data?.taxonConcepts?.data ?? []
    if (concepts.length === 0) return null

    const taxon = concepts[0]
    return {
      source: 'VicFlora',
      vicflora_uuid: taxon.id ?? null,
      description: taxon.currentProfile?.description ?? null,
      habitat_notes: taxon.currentProfile?.habitat ?? null,
    }
  } catch (err) {
    console.error('VicFlora fetch error:', err)
    return null
  }
}

// ─── Merge Results ───────────────────────────────────────────────────────────

function mergeApiResults(results) {
  const merged = {
    data: {},
    sources: {}, // Track which API provided each field
  }

  // Priority order: GBIF for taxonomy, POWO for distribution/synonyms, ALA for common names, iNat for common names
  const sources = results.filter(Boolean)

  for (const result of sources) {
    const { source, ...fields } = result

    for (const [key, value] of Object.entries(fields)) {
      if (value === null || value === undefined) continue

      // For arrays, merge instead of overwrite
      if (Array.isArray(value)) {
        if (!merged.data[key]) {
          merged.data[key] = []
          merged.sources[key] = []
        }
        const existing = new Set(merged.data[key])
        for (const item of value) {
          if (!existing.has(item)) {
            merged.data[key].push(item)
            existing.add(item)
          }
        }
        if (value.length > 0 && !merged.sources[key].includes(source)) {
          merged.sources[key].push(source)
        }
        continue
      }

      // For objects (conservation_status), deep merge
      if (typeof value === 'object' && !Array.isArray(value)) {
        if (!merged.data[key]) {
          merged.data[key] = {}
          merged.sources[key] = []
        }
        Object.assign(merged.data[key], value)
        if (Object.keys(value).length > 0 && !merged.sources[key].includes(source)) {
          merged.sources[key].push(source)
        }
        continue
      }

      // For scalars, first non-null wins
      if (!merged.data[key]) {
        merged.data[key] = value
        merged.sources[key] = [source]
      }
    }
  }

  return merged
}

// ─── Main Lookup ─────────────────────────────────────────────────────────────

export async function lookupSpecies(speciesName) {
  const results = await Promise.allSettled([
    fetchGBIF(speciesName),
    fetchALA(speciesName),
    fetchINaturalist(speciesName),
    fetchPOWO(speciesName),
    fetchVicFlora(speciesName),
  ])

  const settled = results.map((r) => (r.status === 'fulfilled' ? r.value : null))
  return mergeApiResults(settled)
}

export { fetchGBIF, fetchALA, fetchINaturalist, fetchPOWO, fetchVicFlora }
