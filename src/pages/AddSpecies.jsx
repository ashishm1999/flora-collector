import { useNavigate } from 'react-router-dom'
import { useSpeciesMutations } from '../hooks/useSpecies'
import SpeciesForm from '../components/SpeciesForm'
import { toast } from 'sonner'

export default function AddSpecies() {
  const navigate = useNavigate()
  const { createSpecies, uploadImage, loading } = useSpeciesMutations()

  const handleSubmit = async (formData, newImages) => {
    try {
      const created = await createSpecies(formData)

      if (newImages?.length > 0) {
        for (const img of newImages) {
          await uploadImage(created.id, img.file, {
            license: img.license,
            creator: img.creator,
            organ: img.organ,
            caption: img.caption,
            is_primary: img.is_primary,
            latitude: img.latitude,
            longitude: img.longitude,
            location_label: img.location_label,
          })
        }
      }

      toast.success('Species created successfully!')
      navigate(`/species/${created.id}`)
    } catch (err) {
      toast.error('Failed to create species: ' + err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Species</h1>
      <SpeciesForm onSubmit={handleSubmit} isSubmitting={loading} mode="create" />
    </div>
  )
}
