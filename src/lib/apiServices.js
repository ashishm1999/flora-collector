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
// Authority for Victoria. Two-step: autocomplete → taxonConcept. If the matched
// concept is a synonym, follow acceptedConcept and re-fetch so we always end up
// with the accepted name. VicFlora-sourced scalars win in the merge order.

const VICFLORA_GRAPHQL = 'https://vicflora.rbg.vic.gov.au/graphql'

const VICFLORA_MONTH_TO_SHORT = {
  JANUARY: 'Jan', FEBRUARY: 'Feb', MARCH: 'Mar', APRIL: 'Apr',
  MAY: 'May', JUNE: 'Jun', JULY: 'Jul', AUGUST: 'Aug',
  SEPTEMBER: 'Sep', OCTOBER: 'Oct', NOVEMBER: 'Nov', DECEMBER: 'Dec',
}

// Threshold filters phenology noise (single stray records). Tune if too strict.
const PHENOLOGY_THRESHOLD = 5

// VicFlora's IUCN-style enum → human label used by ConservationBadge
const VICFLORA_THREAT_LABEL = {
  EX: 'Extinct', EW: 'Extinct in the Wild', RE: 'Regionally Extinct',
  CR: 'Critically Endangered', EN: 'Endangered', VU: 'Vulnerable',
  NT: 'Near Threatened', LC: 'Least Concern', DD: 'Data Deficient',
  NA: 'Not Applicable', NE: 'Not Evaluated', TH: 'Threatened',
}

function vicfloraOriginFrom({ establishmentMeans, endemic }) {
  if (establishmentMeans === 'INTRODUCED') return 'exotic'
  if (establishmentMeans === 'NATIVE' || establishmentMeans === 'NATIVE_REINTRODUCED') {
    return endemic === true ? 'indigenous' : 'native'
  }
  if (establishmentMeans === 'UNCERTAIN') return 'unknown'
  return null
}

function parseVicfloraProfileHtml(html) {
  if (!html) return { description: null, habitat_notes: null, notes: null }
  // Extract by div class. Server-side string parse (no DOMParser in Node, but
  // this runs in-browser via fetch from a React app — still, regex is fine and
  // avoids dragging in a parser).
  const pickBlock = (cls) => {
    const re = new RegExp(`<div[^>]*class="${cls}"[^>]*>([\\s\\S]*?)<\\/div>`, 'i')
    const m = html.match(re)
    return m ? stripHtml(m[1]).trim() : null
  }
  return {
    description: pickBlock('description'),
    habitat_notes: pickBlock('distribution-habitat'),
    notes: pickBlock('notes'),
  }
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function fetchVicFlora(speciesName) {
  try {
    // Step 1 — autocomplete to find the concept ID
    const acRes = await fetch(VICFLORA_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($q:String!){ taxonConceptAutocomplete(q:$q) { id taxonomicStatus taxonName { fullName } } }`,
        variables: { q: speciesName },
      }),
    })
    if (!acRes.ok) return null
    const acData = await acRes.json()
    const matches = acData?.data?.taxonConceptAutocomplete ?? []
    if (matches.length === 0) return null

    // Prefer an exact name match if available, else first result
    const exact = matches.find((m) => m.taxonName?.fullName?.toLowerCase() === speciesName.toLowerCase())
    let conceptId = (exact ?? matches[0]).id

    // Step 2 — fetch full taxon concept
    const fetchConcept = async (id) => {
      const res = await fetch(VICFLORA_GRAPHQL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($id:ID!){ taxonConcept(id:$id) {
            id
            taxonomicStatus
            establishmentMeans
            endemic
            epbc
            ffg
            taxonName { fullName fullNameWithAuthorship namePart authorship }
            acceptedConcept { id }
            preferredVernacularName { name }
            vernacularNames { name isPreferred }
            synonyms { fullNameWithAuthorship fullName }
            currentProfile { profile }
            phenology { month buds flowers fruit }
          } }`,
          variables: { id },
        }),
      })
      if (!res.ok) return null
      const j = await res.json()
      return j?.data?.taxonConcept ?? null
    }

    let concept = await fetchConcept(conceptId)
    if (!concept) return null

    // If the matched concept is a synonym, follow acceptedConcept and re-fetch
    if (concept.taxonomicStatus !== 'ACCEPTED' && concept.acceptedConcept?.id && concept.acceptedConcept.id !== conceptId) {
      const accepted = await fetchConcept(concept.acceptedConcept.id)
      if (accepted) concept = accepted
    }

    // Build the merged result. VicFlora is authoritative for Victoria → scalars
    // here win in the merge order (we put VicFlora first in the parallel fetch).
    const profile = parseVicfloraProfileHtml(concept.currentProfile?.profile)

    // Phenology → flowering_months / fruiting_months (3-letter codes)
    const flowering_months = []
    const fruiting_months = []
    for (const p of concept.phenology ?? []) {
      const short = VICFLORA_MONTH_TO_SHORT[p.month]
      if (!short) continue
      if ((p.flowers ?? 0) >= PHENOLOGY_THRESHOLD) flowering_months.push(short)
      if ((p.fruit ?? 0) >= PHENOLOGY_THRESHOLD) fruiting_months.push(short)
    }

    // Synonyms — VicFlora's own synonym list + the user's query name if it
    // differs from VicFlora's accepted name (e.g. user typed Isotoma but VicFlora
    // calls it Lobelia → record Isotoma as a synonym)
    const acceptedFull = concept.taxonName?.fullName ?? null
    const synonyms = (concept.synonyms ?? [])
      .map((s) => s.fullNameWithAuthorship || s.fullName)
      .filter(Boolean)
    if (acceptedFull && speciesName.toLowerCase() !== acceptedFull.toLowerCase()) {
      synonyms.unshift(speciesName)
    }

    // Common names
    const common_names = (concept.vernacularNames ?? [])
      .map((v) => v.name)
      .filter(Boolean)

    // Conservation — VicFlora gives EPBC + FFG codes. Map to labels for badge.
    const conservation_status = {}
    if (concept.epbc) {
      conservation_status.epbcStatus = VICFLORA_THREAT_LABEL[concept.epbc] ?? concept.epbc
      conservation_status.authority = 'EPBC Act'
    }
    if (concept.ffg) {
      conservation_status.ffgStatus = VICFLORA_THREAT_LABEL[concept.ffg] ?? concept.ffg
      if (!conservation_status.authority) conservation_status.authority = 'FFG Act 1988'
    }

    return {
      source: 'VicFlora',
      vicflora_uuid: concept.id,
      scientific_name: concept.taxonName?.fullNameWithAuthorship ?? null,
      scientific_name_without_author: concept.taxonName?.fullName ?? null,
      scientific_name_authorship: concept.taxonName?.authorship ?? null,
      specific_epithet: concept.taxonName?.namePart ?? null,
      taxonomic_status: concept.taxonomicStatus
        ? concept.taxonomicStatus.charAt(0) + concept.taxonomicStatus.slice(1).toLowerCase()
        : null,
      plant_origin: vicfloraOriginFrom(concept),
      common_names,
      synonyms,
      conservation_status,
      description: profile.description,
      habitat_notes: profile.habitat_notes,
      notes: profile.notes,
      flowering_months,
      fruiting_months,
      distribution_native: concept.establishmentMeans === 'NATIVE' || concept.establishmentMeans === 'NATIVE_REINTRODUCED' ? ['VIC'] : [],
      distribution_introduced: concept.establishmentMeans === 'INTRODUCED' ? ['VIC'] : [],
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

      // For objects (conservation_status), fill missing keys only — first
      // source wins per-key so VicFlora's epbc/ffg aren't clobbered by later APIs.
      if (typeof value === 'object' && !Array.isArray(value)) {
        if (!merged.data[key]) {
          merged.data[key] = {}
          merged.sources[key] = []
        }
        let touched = false
        for (const [k, v] of Object.entries(value)) {
          if (v !== null && v !== undefined && (merged.data[key][k] === undefined || merged.data[key][k] === null)) {
            merged.data[key][k] = v
            touched = true
          }
        }
        if (touched && !merged.sources[key].includes(source)) {
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
  // VicFlora is FIRST → its scalars (scientific_name, plant_origin, conservation,
  // description, habitat) win the "first non-null wins" rule in mergeApiResults.
  // Other sources fill gaps (taxonomy chain from GBIF, common names from ALA/iNat,
  // POWO synonyms/distribution).
  const results = await Promise.allSettled([
    fetchVicFlora(speciesName),
    fetchGBIF(speciesName),
    fetchALA(speciesName),
    fetchINaturalist(speciesName),
    fetchPOWO(speciesName),
  ])

  const settled = results.map((r) => (r.status === 'fulfilled' ? r.value : null))
  return mergeApiResults(settled)
}

export { fetchGBIF, fetchALA, fetchINaturalist, fetchPOWO, fetchVicFlora }
