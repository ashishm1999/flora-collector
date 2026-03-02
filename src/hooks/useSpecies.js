import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSpeciesList({ search = '', family = '', conservationStatus = '', lifeForm = '', sortBy = 'scientific_name', sortOrder = 'asc', page = 1, pageSize = 20 } = {}) {
  const [species, setSpecies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchSpecies = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('species')
        .select('*, species_images!species_images_species_id_fkey(id, public_url, is_primary, organ)', { count: 'exact' })

      if (search) {
        query = query.or(`scientific_name.ilike.%${search}%,family.ilike.%${search}%,genus.ilike.%${search}%,common_names.cs.["${search}"]`)
      }

      if (family) {
        query = query.eq('family', family)
      }

      if (lifeForm) {
        query = query.ilike('life_form', `%${lifeForm}%`)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to)

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      setSpecies(data ?? [])
      setTotalCount(count ?? 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, family, conservationStatus, lifeForm, sortBy, sortOrder, page, pageSize])

  useEffect(() => {
    fetchSpecies()
  }, [fetchSpecies])

  return { species, loading, error, totalCount, refetch: fetchSpecies }
}

export function useSpeciesDetail(id) {
  const [species, setSpecies] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    async function fetchDetail() {
      setLoading(true)
      try {
        const [speciesRes, imagesRes] = await Promise.all([
          supabase.from('species').select('*').eq('id', id).single(),
          supabase.from('species_images').select('*').eq('species_id', id).order('is_primary', { ascending: false }),
        ])

        if (speciesRes.error) throw speciesRes.error
        setSpecies(speciesRes.data)
        setImages(imagesRes.data ?? [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id])

  return { species, images, loading, error }
}

export function useSpeciesMutations() {
  const [loading, setLoading] = useState(false)

  const createSpecies = async (data) => {
    setLoading(true)
    try {
      // Always compute api_verified from actual API keys
      const hasApiData = !!(data.gbif_key || data.ala_guid || data.inaturalist_id || data.powo_id || data.vicflora_uuid)
      const insertData = { ...data, api_verified: hasApiData }
      console.log('[Flora] Creating species, api_verified:', hasApiData, insertData)

      const { data: created, error } = await supabase
        .from('species')
        .insert(insertData)
        .select()
        .single()
      if (error) throw error
      return created
    } finally {
      setLoading(false)
    }
  }

  const updateSpecies = async (id, data) => {
    setLoading(true)
    try {
      // Always compute api_verified from actual API keys
      const hasApiData = !!(data.gbif_key || data.ala_guid || data.inaturalist_id || data.powo_id || data.vicflora_uuid)
      const updateData = { ...data, api_verified: hasApiData, updated_at: new Date().toISOString() }

      const { data: updated, error } = await supabase
        .from('species')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated
    } finally {
      setLoading(false)
    }
  }

  const deleteSpecies = async (id) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('species').delete().eq('id', id)
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  const uploadImage = async (speciesId, file, metadata) => {
    const timestamp = Date.now()
    const filePath = `${speciesId}/${timestamp}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(filePath, file)
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('plant-images')
      .getPublicUrl(filePath)

    const record = {
      species_id: speciesId,
      storage_path: filePath,
      public_url: publicUrl,
      license: metadata.license,
      creator: metadata.creator,
      organ: metadata.organ,
      caption: metadata.caption,
      is_primary: metadata.is_primary,
      latitude: metadata.latitude || null,
      longitude: metadata.longitude || null,
      location_label: metadata.location_label || null,
    }

    const { data: imageRecord, error: insertError } = await supabase
      .from('species_images')
      .insert(record)
      .select()
      .single()
    if (insertError) throw insertError

    return imageRecord
  }

  const deleteImage = async (imageId, storagePath) => {
    await supabase.storage.from('plant-images').remove([storagePath])
    const { error } = await supabase.from('species_images').delete().eq('id', imageId)
    if (error) throw error
  }

  return { createSpecies, updateSpecies, deleteSpecies, uploadImage, deleteImage, loading }
}

export function useDashboardStats() {
  const [stats, setStats] = useState({ total: 0, recent: [], incomplete: [], unverified: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [countRes, recentRes, noImageRes, noDescRes, unverifiedRes] = await Promise.all([
          supabase.from('species').select('*', { count: 'exact', head: true }),
          supabase
            .from('species')
            .select('id, scientific_name, common_names, family, created_at')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('species')
            .select('id, scientific_name')
            .is('description', null)
            .limit(10),
          supabase
            .from('species')
            .select('id, scientific_name')
            .eq('conservation_status', '{}')
            .limit(10),
          supabase
            .from('species')
            .select('id, scientific_name, family, created_at')
            .or('api_verified.eq.false,api_verified.is.null')
            .order('created_at', { ascending: false })
            .limit(20),
        ])

        // Debug: log unverified query result
        console.log('[Flora] Unverified query result:', unverifiedRes)
        if (unverifiedRes.error) {
          console.error('[Flora] Unverified query error:', unverifiedRes.error)
        }

        setStats({
          total: countRes.count ?? 0,
          recent: recentRes.data ?? [],
          incomplete: [...(noImageRes.data ?? []), ...(noDescRes.data ?? [])].reduce(
            (acc, item) => {
              if (!acc.find((i) => i.id === item.id)) acc.push(item)
              return acc
            },
            []
          ),
          unverified: unverifiedRes.data ?? [],
        })
      } catch (err) {
        console.error('[Flora] Dashboard stats error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading }
}
