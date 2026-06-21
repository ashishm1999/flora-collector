const iucnColors = {
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

const iucnLabels = {
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

// FFG Act 1988 (Victoria) categories
const ffgColors = {
  threatened: 'bg-red-100 text-red-800',
  endangered: 'bg-red-200 text-red-900',
  vulnerable: 'bg-orange-100 text-orange-800',
  'critically endangered': 'bg-red-200 text-red-900',
  extinct: 'bg-gray-800 text-white',
  'not listed': 'bg-gray-100 text-gray-600',
}

// EPBC Act (national) categories
const epbcColors = {
  endangered: 'bg-red-100 text-red-800',
  vulnerable: 'bg-orange-100 text-orange-800',
  'critically endangered': 'bg-red-200 text-red-900',
  extinct: 'bg-gray-800 text-white',
  'not listed': 'bg-gray-100 text-gray-600',
}

const notThreatenedClass = 'bg-green-50 text-green-700 border border-green-200'

function pickClass(value, table) {
  const key = value?.toString().toLowerCase().trim()
  return table[key] ?? 'bg-gray-100 text-gray-700'
}

export default function ConservationBadge({ status, compact = false, hideIfNotThreatened = false }) {
  const iucn = status?.iucnCategory?.toUpperCase()
  const ffg = status?.ffgStatus
  const epbc = status?.epbcStatus

  const isThreatenedListed = (val) => val && val.toString().toLowerCase().trim() !== 'not listed'
  const hasAny = iucn || isThreatenedListed(ffg) || isThreatenedListed(epbc) || status?.nationalStatus || status?.stateStatus

  // Default "Not Threatened" when no data — suppressed on list views via hideIfNotThreatened
  if (!hasAny) {
    if (hideIfNotThreatened) return null
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${notThreatenedClass}`}
        title="No conservation listing — treated as Not Threatened"
      >
        Not Threatened
      </span>
    )
  }

  if (compact) {
    // Single most-severe badge for use in tight contexts
    if (ffg) {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${pickClass(ffg, ffgColors)}`} title={`FFG (Vic): ${ffg}`}>
          FFG: {ffg}
        </span>
      )
    }
    if (epbc) {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${pickClass(epbc, epbcColors)}`} title={`EPBC (national): ${epbc}`}>
          EPBC: {epbc}
        </span>
      )
    }
    if (iucn) {
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${iucnColors[iucn] ?? 'bg-gray-200 text-gray-700'}`}
          title={`IUCN: ${iucnLabels[iucn] ?? iucn}${status.authority ? ` (${status.authority})` : ''}`}
        >
          {iucn}
        </span>
      )
    }
    return null
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {iucn && (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${iucnColors[iucn] ?? 'bg-gray-200 text-gray-700'}`}
          title={`IUCN: ${iucnLabels[iucn] ?? iucn}`}
        >
          IUCN: {iucn}
        </span>
      )}
      {ffg && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${pickClass(ffg, ffgColors)}`} title="FFG Act 1988 (Victoria)">
          FFG (Vic): {ffg}
        </span>
      )}
      {epbc && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${pickClass(epbc, epbcColors)}`} title="EPBC Act (national)">
          EPBC: {epbc}
        </span>
      )}
      {!iucn && !ffg && !epbc && status?.stateStatus && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          State: {status.stateStatus}
        </span>
      )}
      {!iucn && !ffg && !epbc && status?.nationalStatus && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          National: {status.nationalStatus}
        </span>
      )}
    </div>
  )
}
