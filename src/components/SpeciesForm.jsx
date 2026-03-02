import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { speciesSchema } from '../lib/validation'
import ApiLookup from './ApiLookup'
import ImageUploader from './ImageUploader'
import SourceBadge from './SourceBadge'
import { useState } from 'react'
import { Loader2, Plus, Trash2, X } from 'lucide-react'

const RANKS = ['SPECIES', 'SUBSPECIES', 'VARIETY']
const TAXONOMIC_STATUSES = ['Accepted', 'Synonym', 'Doubtful', 'Misapplied']
const IUCN_CATEGORIES = ['NE', 'DD', 'LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX']
const LIFE_FORMS = ['tree', 'shrub', 'herb', 'climber', 'fern', 'grass', 'sedge', 'rush', 'aquatic']
const AU_STATES = ['QLD', 'NSW', 'ACT', 'VIC', 'TAS', 'SA', 'WA', 'NT']

function FormField({ label, error, sources, children, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        <SourceBadge sources={sources} />
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  )
}

// Controlled input that reads from watch() so setValue() updates are visible
function ControlledInput({ name, watch, setValue, className, ...props }) {
  return (
    <input
      value={watch(name) ?? ''}
      onChange={(e) => setValue(name, e.target.value, { shouldValidate: true })}
      className={className}
      {...props}
    />
  )
}

function ControlledTextarea({ name, watch, setValue, className, ...props }) {
  return (
    <textarea
      value={watch(name) ?? ''}
      onChange={(e) => setValue(name, e.target.value, { shouldValidate: true })}
      className={className}
      {...props}
    />
  )
}

function ControlledSelect({ name, watch, setValue, className, children, ...props }) {
  return (
    <select
      value={watch(name) ?? ''}
      onChange={(e) => setValue(name, e.target.value, { shouldValidate: true })}
      className={className}
      {...props}
    >
      {children}
    </select>
  )
}

function ControlledNumberInput({ name, watch, setValue, className, ...props }) {
  return (
    <input
      type="number"
      value={watch(name) ?? ''}
      onChange={(e) => {
        const val = e.target.value
        setValue(name, val === '' ? null : Number(val), { shouldValidate: true })
      }}
      className={className}
      {...props}
    />
  )
}

export default function SpeciesForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  existingImages = [],
  onDeleteImage,
  mode = 'create',
}) {
  const [sources, setSources] = useState({})
  const [newImages, setNewImages] = useState([])

  const {
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(speciesSchema),
    defaultValues: defaultValues || {
      scientific_name: '',
      scientific_name_without_author: '',
      scientific_name_authorship: '',
      kingdom: 'Plantae',
      phylum: '',
      class: '',
      order: '',
      family: '',
      genus: '',
      specific_epithet: '',
      rank: 'SPECIES',
      taxonomic_status: '',
      common_names: [],
      distribution_native: [],
      distribution_introduced: [],
      synonyms: [],
      conservation_status: {},
      gbif_key: null,
      powo_id: '',
      inaturalist_id: null,
      ala_guid: '',
      vicflora_uuid: '',
      life_form: '',
      height: '',
      flowering_season: '',
      habitat_notes: '',
      description: '',
      first_published: '',
      notes: '',
      api_verified: false,
    },
  })

  // Watch arrays for dynamic lists
  const commonNames = watch('common_names') || []
  const synonyms = watch('synonyms') || []
  const distributionNative = watch('distribution_native') || []
  const distributionIntroduced = watch('distribution_introduced') || []

  const handleApiResult = (result) => {
    setSources(result.sources)
    const data = result.data

    // Map all API results to form fields
    const fieldMap = {
      scientific_name: data.scientific_name,
      scientific_name_without_author: data.scientific_name_without_author,
      scientific_name_authorship: data.scientific_name_authorship,
      kingdom: data.kingdom,
      phylum: data.phylum,
      class: data.class,
      order: data.order,
      family: data.family,
      genus: data.genus,
      specific_epithet: data.specific_epithet,
      rank: data.rank,
      taxonomic_status: data.taxonomic_status,
      gbif_key: data.gbif_key,
      powo_id: data.powo_id,
      inaturalist_id: data.inaturalist_id,
      ala_guid: data.ala_guid,
      vicflora_uuid: data.vicflora_uuid,
      life_form: data.life_form,
      description: data.description,
      habitat_notes: data.habitat_notes,
    }

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== null && value !== undefined) {
        setValue(key, value, { shouldValidate: true })
      }
    }

    // Set arrays
    if (data.common_names?.length) setValue('common_names', data.common_names)
    if (data.synonyms?.length) setValue('synonyms', data.synonyms)
    if (data.distribution_native?.length) setValue('distribution_native', data.distribution_native)
    if (data.distribution_introduced?.length) setValue('distribution_introduced', data.distribution_introduced)
    if (data.conservation_status && Object.keys(data.conservation_status).length > 0) {
      setValue('conservation_status', data.conservation_status)
    }

    // Mark as verified if any API returned data
    const hasApiData = data.gbif_key || data.ala_guid || data.inaturalist_id || data.powo_id || data.vicflora_uuid
    setValue('api_verified', !!hasApiData)
  }

  const handleFormSubmit = (formData) => {
    onSubmit(formData, newImages)
  }

  // Dynamic list helpers
  const addToList = (field) => {
    const current = getValues(field) || []
    setValue(field, [...current, ''])
  }

  const removeFromList = (field, index) => {
    const current = getValues(field) || []
    setValue(field, current.filter((_, i) => i !== index))
  }

  const updateListItem = (field, index, value) => {
    const current = [...(getValues(field) || [])]
    current[index] = value
    setValue(field, current)
  }

  const toggleDistribution = (field, state) => {
    const current = getValues(field) || []
    if (current.includes(state)) {
      setValue(field, current.filter((s) => s !== state))
    } else {
      setValue(field, [...current, state])
    }
  }

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
  const sectionClass = 'bg-white border border-gray-200 rounded-lg p-6 space-y-4'

  // Shared props for controlled components
  const ctrl = { watch, setValue }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Section 1: Images (upload first — field researchers capture photos first) */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Images</h3>
        <ImageUploader
          images={newImages}
          onChange={setNewImages}
          existingImages={existingImages}
          onDeleteExisting={onDeleteImage}
        />
      </div>

      {/* Section 2: API Lookup */}
      <ApiLookup onResult={handleApiResult} />

      {/* Section 3: Taxonomy */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Taxonomy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Scientific Name" error={errors.scientific_name} sources={sources.scientific_name} required>
            <ControlledInput name="scientific_name" {...ctrl} className={`${inputClass} italic`} placeholder="e.g. Banksia marginata Cav." />
          </FormField>
          <FormField label="Scientific Name (without author)" error={errors.scientific_name_without_author} sources={sources.scientific_name_without_author} required>
            <ControlledInput name="scientific_name_without_author" {...ctrl} className={`${inputClass} italic`} placeholder="e.g. Banksia marginata" />
          </FormField>
          <FormField label="Authorship" error={errors.scientific_name_authorship} sources={sources.scientific_name_authorship}>
            <ControlledInput name="scientific_name_authorship" {...ctrl} className={inputClass} placeholder="e.g. Cav." />
          </FormField>
          <FormField label="Kingdom" error={errors.kingdom} sources={sources.kingdom}>
            <ControlledInput name="kingdom" {...ctrl} className={inputClass} />
          </FormField>
          <FormField label="Phylum" error={errors.phylum} sources={sources.phylum}>
            <ControlledInput name="phylum" {...ctrl} className={inputClass} placeholder="e.g. Tracheophyta" />
          </FormField>
          <FormField label="Class" error={errors.class} sources={sources.class}>
            <ControlledInput name="class" {...ctrl} className={inputClass} placeholder="e.g. Magnoliopsida" />
          </FormField>
          <FormField label="Order" error={errors.order} sources={sources.order}>
            <ControlledInput name="order" {...ctrl} className={inputClass} placeholder="e.g. Proteales" />
          </FormField>
          <FormField label="Family" error={errors.family} sources={sources.family}>
            <ControlledInput name="family" {...ctrl} className={inputClass} placeholder="e.g. Proteaceae" />
          </FormField>
          <FormField label="Genus" error={errors.genus} sources={sources.genus}>
            <ControlledInput name="genus" {...ctrl} className={inputClass} placeholder="e.g. Banksia" />
          </FormField>
          <FormField label="Specific Epithet" error={errors.specific_epithet} sources={sources.specific_epithet}>
            <ControlledInput name="specific_epithet" {...ctrl} className={inputClass} placeholder="e.g. marginata" />
          </FormField>
          <FormField label="Rank" error={errors.rank} sources={sources.rank}>
            <ControlledSelect name="rank" {...ctrl} className={inputClass}>
              {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
            </ControlledSelect>
          </FormField>
          <FormField label="Taxonomic Status" error={errors.taxonomic_status} sources={sources.taxonomic_status}>
            <ControlledSelect name="taxonomic_status" {...ctrl} className={inputClass}>
              <option value="">Select...</option>
              {TAXONOMIC_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </ControlledSelect>
          </FormField>
        </div>
      </div>

      {/* Section 3: Common Names */}
      <div className={sectionClass}>
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Common Names
            <SourceBadge sources={sources.common_names} />
          </h3>
          <button type="button" onClick={() => addToList('common_names')} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {commonNames.length === 0 && (
          <p className="text-sm text-gray-400 italic">No common names added yet.</p>
        )}
        {commonNames.map((name, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={name}
              onChange={(e) => updateListItem('common_names', index, e.target.value)}
              className={`${inputClass} flex-1`}
              placeholder="e.g. Silver Banksia"
            />
            <button type="button" onClick={() => removeFromList('common_names', index)} className="text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Section 4: Distribution */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Distribution</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Native Distribution
            <SourceBadge sources={sources.distribution_native} />
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {AU_STATES.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => toggleDistribution('distribution_native', state)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  distributionNative.includes(state)
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
          {distributionNative.filter((d) => !AU_STATES.includes(d)).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {distributionNative.filter((d) => !AU_STATES.includes(d)).map((region, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                  {region}
                  <button type="button" onClick={() => toggleDistribution('distribution_native', region)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Introduced Distribution
            <SourceBadge sources={sources.distribution_introduced} />
          </label>
          <div className="flex flex-wrap gap-2">
            {AU_STATES.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => toggleDistribution('distribution_introduced', state)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  distributionIntroduced.includes(state)
                    ? 'bg-orange-100 border-orange-400 text-orange-800'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 5: Database Identifiers */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Database Identifiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="GBIF Key" error={errors.gbif_key} sources={sources.gbif_key}>
            <ControlledNumberInput name="gbif_key" {...ctrl} className={inputClass} />
          </FormField>
          <FormField label="POWO ID" error={errors.powo_id} sources={sources.powo_id}>
            <ControlledInput name="powo_id" {...ctrl} className={inputClass} placeholder="urn:lsid:ipni.org:names/..." />
          </FormField>
          <FormField label="iNaturalist ID" error={errors.inaturalist_id} sources={sources.inaturalist_id}>
            <ControlledNumberInput name="inaturalist_id" {...ctrl} className={inputClass} />
          </FormField>
          <FormField label="ALA GUID" error={errors.ala_guid} sources={sources.ala_guid}>
            <ControlledInput name="ala_guid" {...ctrl} className={inputClass} />
          </FormField>
          <FormField label="VicFlora UUID" error={errors.vicflora_uuid} sources={sources.vicflora_uuid}>
            <ControlledInput name="vicflora_uuid" {...ctrl} className={inputClass} />
          </FormField>
        </div>
      </div>

      {/* Section 6: Conservation Status */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
          Conservation Status
          <SourceBadge sources={sources.conservation_status} />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="IUCN Category">
            <select
              value={watch('conservation_status')?.iucnCategory || ''}
              onChange={(e) => setValue('conservation_status', { ...getValues('conservation_status'), iucnCategory: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Select...</option>
              {IUCN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Authority">
            <input
              value={watch('conservation_status')?.authority || ''}
              onChange={(e) => setValue('conservation_status', { ...getValues('conservation_status'), authority: e.target.value || null })}
              className={inputClass}
              placeholder="e.g. IUCN, EPBC Act"
            />
          </FormField>
          <FormField label="National Status">
            <input
              value={watch('conservation_status')?.nationalStatus || ''}
              onChange={(e) => setValue('conservation_status', { ...getValues('conservation_status'), nationalStatus: e.target.value || null })}
              className={inputClass}
            />
          </FormField>
          <FormField label="State Status">
            <input
              value={watch('conservation_status')?.stateStatus || ''}
              onChange={(e) => setValue('conservation_status', { ...getValues('conservation_status'), stateStatus: e.target.value || null })}
              className={inputClass}
            />
          </FormField>
        </div>
      </div>

      {/* Section 7: Description & Traits */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Description & Traits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Life Form" error={errors.life_form} sources={sources.life_form}>
            <ControlledSelect name="life_form" {...ctrl} className={inputClass}>
              <option value="">Select...</option>
              {LIFE_FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
            </ControlledSelect>
          </FormField>
          <FormField label="Height" error={errors.height}>
            <ControlledInput name="height" {...ctrl} className={inputClass} placeholder="e.g. 1-12 meters" />
          </FormField>
          <FormField label="Flowering Season" error={errors.flowering_season}>
            <ControlledInput name="flowering_season" {...ctrl} className={inputClass} placeholder="e.g. December-May (summer-autumn)" />
          </FormField>
        </div>
        <FormField label="Description" error={errors.description} sources={sources.description}>
          <ControlledTextarea name="description" {...ctrl} rows={4} className={inputClass} placeholder="Morphological description..." />
        </FormField>
        <FormField label="Habitat Notes" error={errors.habitat_notes} sources={sources.habitat_notes}>
          <ControlledTextarea name="habitat_notes" {...ctrl} rows={3} className={inputClass} placeholder="Habitat information..." />
        </FormField>
      </div>

      {/* Section 8: Synonyms */}
      <div className={sectionClass}>
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Synonyms
            <SourceBadge sources={sources.synonyms} />
          </h3>
          <button type="button" onClick={() => addToList('synonyms')} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {synonyms.length === 0 && (
          <p className="text-sm text-gray-400 italic">No synonyms added yet.</p>
        )}
        {synonyms.map((syn, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={syn}
              onChange={(e) => updateListItem('synonyms', index, e.target.value)}
              className={`${inputClass} flex-1 italic`}
              placeholder="e.g. Banksia australis R.Br."
            />
            <button type="button" onClick={() => removeFromList('synonyms', index)} className="text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Section 9: Publication */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Publication</h3>
        <FormField label="First Published" error={errors.first_published}>
          <ControlledInput name="first_published" {...ctrl} className={inputClass} placeholder="e.g. Anales Hist. Nat. 1: 227 (1799)" />
        </FormField>
      </div>

      {/* Section 10: Notes */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Notes</h3>
        <FormField label="Additional Notes" error={errors.notes}>
          <ControlledTextarea name="notes" {...ctrl} rows={3} className={inputClass} placeholder="Any additional context or observations..." />
        </FormField>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            mode === 'create' ? 'Create Species' : 'Update Species'
          )}
        </button>
      </div>
    </form>
  )
}
