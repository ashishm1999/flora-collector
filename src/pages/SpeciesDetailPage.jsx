import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSpeciesDetail, useSpeciesMutations } from '../hooks/useSpecies'
import ConservationBadge from '../components/ConservationBadge'
import { toast } from 'sonner'
import {
  ArrowLeft, Edit, Trash2, ExternalLink, Leaf, Star, MapPin, BookOpen, FlaskConical,
} from 'lucide-react'

function InfoRow({ label, value, italic }) {
  if (!value) return null
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className={`mt-0.5 text-sm text-gray-900 ${italic ? 'italic' : ''}`}>{value}</dd>
    </div>
  )
}

function ExternalLink_({ href, label, icon }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
    >
      {icon}
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  )
}

export default function SpeciesDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { species, images, loading, error } = useSpeciesDetail(id)
  const { deleteSpecies } = useSpeciesMutations()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this species? This action cannot be undone.')) return

    try {
      await deleteSpecies(id)
      toast.success('Species deleted')
      navigate('/')
    } catch (err) {
      toast.error('Failed to delete: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  if (error || !species) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-medium text-gray-600">Species not found</h2>
        <Link to="/" className="text-emerald-600 hover:underline text-sm mt-2 inline-block">Back to list</Link>
      </div>
    )
  }

  const primaryImage = images.find((img) => img.is_primary) || images[0]

  return (
    <div>
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to species list
      </Link>

      {/* Hero */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        {primaryImage ? (
          <div className="h-64 md:h-80 bg-gray-100 relative">
            <img src={primaryImage.public_url} alt={species.scientific_name} className="w-full h-full object-cover" />
            {primaryImage.latitude && primaryImage.longitude && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {Number(primaryImage.latitude).toFixed(5)}, {Number(primaryImage.longitude).toFixed(5)}
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 bg-gray-100 flex items-center justify-center">
            <Leaf className="w-16 h-16 text-gray-300" />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 italic">{species.scientific_name}</h1>
              {species.common_names?.length > 0 && (
                <p className="text-lg text-gray-600 mt-1">{species.common_names.join(', ')}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {species.family && <span className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-600">{species.family}</span>}
                <ConservationBadge status={species.conservation_status} />
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/species/${id}/edit`}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-1"
              >
                <Edit className="w-4 h-4" /> Edit
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {species.description && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Description
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">{species.description}</p>
            </div>
          )}

          {/* Taxonomy */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Taxonomy</h2>
            <dl>
              <InfoRow label="Kingdom" value={species.kingdom} />
              <InfoRow label="Phylum" value={species.phylum} />
              <InfoRow label="Class" value={species.class} />
              <InfoRow label="Order" value={species.order} />
              <InfoRow label="Family" value={species.family} />
              <InfoRow label="Genus" value={species.genus} italic />
              <InfoRow label="Specific Epithet" value={species.specific_epithet} italic />
              <InfoRow label="Rank" value={species.rank} />
              <InfoRow label="Taxonomic Status" value={species.taxonomic_status} />
              <InfoRow label="Authorship" value={species.scientific_name_authorship} />
            </dl>
          </div>

          {/* Traits */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-600" /> Traits
            </h2>
            <dl>
              <InfoRow label="Life Form" value={species.life_form} />
              <InfoRow label="Height" value={species.height} />
              <InfoRow label="Flowering Season" value={species.flowering_season} />
              <InfoRow label="Habitat" value={species.habitat_notes} />
            </dl>
          </div>

          {/* Synonyms */}
          {species.synonyms?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Synonyms</h2>
              <ul className="space-y-1">
                {species.synonyms.map((syn, i) => (
                  <li key={i} className="text-sm text-gray-700 italic">{syn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Publication */}
          {species.first_published && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Publication</h2>
              <p className="text-sm text-gray-700">{species.first_published}</p>
            </div>
          )}

          {/* Notes */}
          {species.notes && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{species.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Distribution */}
          {(species.distribution_native?.length > 0 || species.distribution_introduced?.length > 0) && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" /> Distribution
              </h2>
              {species.distribution_native?.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Native</h4>
                  <div className="flex flex-wrap gap-1">
                    {species.distribution_native.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {species.distribution_introduced?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Introduced</h4>
                  <div className="flex flex-wrap gap-1">
                    {species.distribution_introduced.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conservation */}
          {species.conservation_status?.iucnCategory && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Conservation</h2>
              <ConservationBadge status={species.conservation_status} />
              {species.conservation_status.authority && (
                <p className="text-xs text-gray-500 mt-2">Authority: {species.conservation_status.authority}</p>
              )}
            </div>
          )}

          {/* External Links */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">External Databases</h2>
            <div className="flex flex-col gap-2">
              {species.gbif_key && (
                <ExternalLink_ href={`https://www.gbif.org/species/${species.gbif_key}`} label="GBIF" />
              )}
              {species.powo_id && (
                <ExternalLink_ href={`https://powo.science.kew.org/taxon/${species.powo_id}`} label="POWO (Kew)" />
              )}
              {species.ala_guid && (
                <ExternalLink_ href={`https://bie.ala.org.au/species/${species.ala_guid}`} label="ALA" />
              )}
              {species.inaturalist_id && (
                <ExternalLink_ href={`https://www.inaturalist.org/taxa/${species.inaturalist_id}`} label="iNaturalist" />
              )}
              {species.vicflora_uuid && (
                <ExternalLink_ href={`https://vicflora.rbg.vic.gov.au/flora/taxon/${species.vicflora_uuid}`} label="VicFlora" />
              )}
              {!species.gbif_key && !species.powo_id && !species.ala_guid && !species.inaturalist_id && !species.vicflora_uuid && (
                <p className="text-sm text-gray-400 italic">No external database links available.</p>
              )}
            </div>
          </div>

          {/* Image Gallery */}
          {images.length > 1 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Image Gallery</h2>
              <div className="grid grid-cols-2 gap-2">
                {images.map((img) => (
                  <div key={img.id} className="relative rounded overflow-hidden">
                    <img src={img.public_url} alt={img.caption || 'Plant image'} className="w-full h-24 object-cover" />
                    {img.is_primary && (
                      <Star className="absolute top-1 right-1 w-4 h-4 text-yellow-500 fill-yellow-500 drop-shadow" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white capitalize">{img.organ || ''}</span>
                        {img.latitude && img.longitude && (
                          <span className="text-[9px] text-emerald-300 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {Number(img.latitude).toFixed(4)}, {Number(img.longitude).toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
