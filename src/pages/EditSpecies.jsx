import { useParams, useNavigate } from 'react-router-dom'
import { useSpeciesDetail, useSpeciesMutations } from '../hooks/useSpecies'
import SpeciesForm from '../components/SpeciesForm'
import { toast } from 'sonner'

export default function EditSpecies() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { species, images, loading: detailLoading } = useSpeciesDetail(id)
  const { updateSpecies, uploadImage, deleteImage, loading } = useSpeciesMutations()

  const handleSubmit = async (formData, newImages) => {
    try {
      await updateSpecies(id, formData)

      if (newImages?.length > 0) {
        for (const img of newImages) {
          await uploadImage(id, img.file, {
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

      toast.success('Species updated successfully!')
      navigate(`/species/${id}`)
    } catch (err) {
      toast.error('Failed to update species: ' + err.message)
    }
  }

  const handleDeleteImage = async (imageId, storagePath) => {
    try {
      await deleteImage(imageId, storagePath)
      toast.success('Image deleted')
    } catch (err) {
      toast.error('Failed to delete image: ' + err.message)
    }
  }

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  if (!species) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-medium text-gray-600">Species not found</h2>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Edit <em>{species.scientific_name}</em>
      </h1>
      <SpeciesForm
        defaultValues={species}
        onSubmit={handleSubmit}
        isSubmitting={loading}
        existingImages={images}
        onDeleteImage={handleDeleteImage}
        mode="edit"
      />
    </div>
  )
}
