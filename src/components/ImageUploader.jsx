import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Star, MapPin, Loader2 } from 'lucide-react'

const LICENSES = [
  'CC BY 4.0',
  'CC BY-SA 4.0',
  'CC BY-NC 4.0',
  'CC BY-NC-SA 4.0',
  'CC0',
  'All Rights Reserved',
]

const ORGANS = ['habit', 'flower', 'leaf', 'fruit', 'bark', 'seed', 'other']

export default function ImageUploader({ images = [], onChange, existingImages = [], onDeleteExisting }) {
  const [geoStatus, setGeoStatus] = useState('idle') // idle | loading | success | error
  const [currentLocation, setCurrentLocation] = useState(null)

  // Get geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setGeoStatus('success')
      },
      () => {
        setGeoStatus('error')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const onDrop = useCallback(
    (acceptedFiles) => {
      const newImages = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        license: 'CC BY-NC-SA 4.0',
        creator: '',
        organ: 'habit',
        caption: '',
        is_primary: images.length === 0 && existingImages.length === 0,
        latitude: currentLocation?.latitude ?? null,
        longitude: currentLocation?.longitude ?? null,
        location_label: currentLocation
          ? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
          : '',
      }))
      onChange([...images, ...newImages])
    },
    [images, existingImages, onChange, currentLocation]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 10 * 1024 * 1024,
  })

  const removeImage = (index) => {
    const updated = [...images]
    URL.revokeObjectURL(updated[index].preview)
    updated.splice(index, 1)
    onChange(updated)
  }

  const updateImageMeta = (index, field, value) => {
    const updated = [...images]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'is_primary' && value) {
      updated.forEach((img, i) => {
        if (i !== index) img.is_primary = false
      })
    }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      {/* Geolocation status */}
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="w-4 h-4 text-emerald-600" />
        {geoStatus === 'loading' && (
          <span className="text-gray-500 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Getting location...
          </span>
        )}
        {geoStatus === 'success' && currentLocation && (
          <span className="text-emerald-700">
            Location: {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
          </span>
        )}
        {geoStatus === 'error' && (
          <span className="text-gray-400">Location unavailable — images will be saved without coordinates</span>
        )}
      </div>

      {/* Existing images */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {existingImages.map((img) => (
              <div key={img.id} className="relative border rounded-lg overflow-hidden bg-gray-50">
                <img src={img.public_url} alt={img.caption || 'Plant image'} className="w-full h-32 object-cover" />
                <div className="p-2 text-xs text-gray-500 space-y-0.5">
                  <div className="flex items-center gap-1">
                    {img.organ && <span className="capitalize">{img.organ}</span>}
                    {img.is_primary && (
                      <Star className="w-3 h-3 inline text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  {(img.latitude && img.longitude) && (
                    <div className="flex items-center gap-0.5 text-emerald-600">
                      <MapPin className="w-3 h-3" />
                      <span>{Number(img.latitude).toFixed(4)}, {Number(img.longitude).toFixed(4)}</span>
                    </div>
                  )}
                </div>
                {onDeleteExisting && (
                  <button
                    type="button"
                    onClick={() => onDeleteExisting(img.id, img.storage_path)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {isDragActive ? 'Drop images here...' : 'Drag & drop images, or click to select'}
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max 10MB each</p>
      </div>

      {/* New image previews with metadata */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">New Images</h4>
          {images.map((img, index) => (
            <div key={index} className="flex gap-4 border rounded-lg p-3 bg-white">
              <div className="relative w-24 h-24 flex-shrink-0">
                <img src={img.preview} alt="Preview" className="w-full h-full object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                {/* Location label on image */}
                {img.latitude && img.longitude && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-[9px] text-white truncate">
                      {Number(img.latitude).toFixed(4)}, {Number(img.longitude).toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <select
                  value={img.license}
                  onChange={(e) => updateImageMeta(index, 'license', e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  {LICENSES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <select
                  value={img.organ}
                  onChange={(e) => updateImageMeta(index, 'organ', e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  {ORGANS.map((o) => (
                    <option key={o} value={o} className="capitalize">{o}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={img.creator}
                  onChange={(e) => updateImageMeta(index, 'creator', e.target.value)}
                  placeholder="Photographer"
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                />
                <input
                  type="text"
                  value={img.caption}
                  onChange={(e) => updateImageMeta(index, 'caption', e.target.value)}
                  placeholder="Caption"
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                />
                <input
                  type="text"
                  value={img.location_label}
                  onChange={(e) => updateImageMeta(index, 'location_label', e.target.value)}
                  placeholder="Location label (auto-filled)"
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                />
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={img.is_primary}
                    onChange={(e) => updateImageMeta(index, 'is_primary', e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <Star className="w-3 h-3" /> Primary
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
