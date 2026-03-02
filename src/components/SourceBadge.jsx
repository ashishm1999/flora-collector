const sourceColors = {
  GBIF: 'bg-blue-100 text-blue-800',
  POWO: 'bg-green-100 text-green-800',
  ALA: 'bg-orange-100 text-orange-800',
  iNaturalist: 'bg-emerald-100 text-emerald-800',
  VicFlora: 'bg-teal-100 text-teal-800',
}

export default function SourceBadge({ sources }) {
  if (!sources || sources.length === 0) return null

  return (
    <span className="inline-flex gap-1 ml-2">
      {sources.map((source) => (
        <span
          key={source}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${sourceColors[source] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {source}
        </span>
      ))}
    </span>
  )
}
