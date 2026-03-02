const statusColors = {
  NE: 'bg-gray-200 text-gray-700',
  DD: 'bg-gray-300 text-gray-800',
  LC: 'bg-green-100 text-green-800',
  NT: 'bg-yellow-100 text-yellow-800',
  VU: 'bg-orange-100 text-orange-800',
  EN: 'bg-red-100 text-red-800',
  CR: 'bg-red-200 text-red-900',
  EW: 'bg-purple-100 text-purple-800',
  EX: 'bg-gray-800 text-white',
}

const statusLabels = {
  NE: 'Not Evaluated',
  DD: 'Data Deficient',
  LC: 'Least Concern',
  NT: 'Near Threatened',
  VU: 'Vulnerable',
  EN: 'Endangered',
  CR: 'Critically Endangered',
  EW: 'Extinct in the Wild',
  EX: 'Extinct',
}

export default function ConservationBadge({ status }) {
  if (!status?.iucnCategory) return null

  const category = status.iucnCategory.toUpperCase()
  const colorClass = statusColors[category] ?? 'bg-gray-200 text-gray-700'
  const label = statusLabels[category] ?? category

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
      title={`${label}${status.authority ? ` (${status.authority})` : ''}`}
    >
      {category}
    </span>
  )
}
