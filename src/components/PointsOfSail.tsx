import { TERM_TO_SECTOR } from './pointsOfSail'

interface Props {
  compact?: boolean
  onSelect?: (termId: string) => void
  /** Vocab term id to highlight. When set, only its sector is lit; the rest dim. */
  activeId?: string
}

// Each sector: label, termId, startAngle, endAngle (degrees, 0=top/bow, clockwise)
// Wind comes from the top (0°). We show both port and starboard sides.
const SECTORS = [
  {
    id: 'in-irons',
    termId: 'points-of-sail-in-irons',
    label: 'In Irons',
    // No-go zone: -30° to +30° from bow
    startDeg: -30,
    endDeg: 30,
    color: '#dc2626', // red
    port: false,
    symmetric: true, // renders as single centered wedge
  },
  {
    id: 'close-hauled',
    termId: 'points-of-sail-close-hauled',
    label: 'Close-hauled',
    startDeg: 30,
    endDeg: 60,
    color: '#2563eb', // blue
    port: true,
  },
  {
    id: 'close-reach',
    termId: 'points-of-sail-close-reach',
    label: 'Close Reach',
    startDeg: 60,
    endDeg: 90,
    color: '#7c3aed', // purple
    port: true,
  },
  {
    id: 'beam-reach',
    termId: 'points-of-sail-beam-reach',
    label: 'Beam Reach',
    startDeg: 90,
    endDeg: 120,
    color: '#0891b2', // cyan
    port: true,
  },
  {
    id: 'broad-reach',
    termId: 'points-of-sail-broad-reach',
    label: 'Broad Reach',
    startDeg: 120,
    endDeg: 160,
    color: '#059669', // green
    port: true,
  },
  {
    id: 'running',
    termId: 'points-of-sail-running',
    label: 'Running',
    startDeg: 160,
    endDeg: 200,
    color: '#d97706', // amber
    port: false,
    symmetric: true,
  },
]

const DEG = Math.PI / 180

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  // 0 = top (bow), clockwise
  const rad = (angleDeg - 90) * DEG
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function sectorPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polarToXY(cx, cy, r, startDeg)
  const end = polarToXY(cx, cy, r, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

export default function PointsOfSail({ compact = false, onSelect, activeId }: Props) {
  const activeSector = activeId ? TERM_TO_SECTOR[activeId] : undefined
  // Legend mode (no activeId): every sector visible. Highlight mode: light the
  // active wedge, fade the rest so the current point of sail actually reads.
  function fillOp(sectorId: string) {
    if (!activeSector) return 0.3
    return sectorId === activeSector ? 0.9 : 0.06
  }
  function strokeOp(sectorId: string) {
    if (!activeSector) return 0.6
    return sectorId === activeSector ? 1 : 0.12
  }
  const size = compact ? 220 : 320
  // Extra headroom above the circle so the WIND label + arrow are not clipped
  // by the viewBox (they were previously drawn at negative y and invisible).
  const topPad = compact ? 34 : 40
  const cx = size / 2
  const cy = topPad + size / 2
  const r = size * 0.42

  const labelR = r * 0.68

  function midAngle(start: number, end: number) {
    return (start + end) / 2
  }

  return (
    <svg
      width={size}
      height={size + topPad}
      viewBox={`0 0 ${size} ${size + topPad}`}
      className="mx-auto"
      aria-label="Points of sail diagram"
    >
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r} fill="#1e293b" stroke="#334155" strokeWidth={1} />

      {/* Symmetric sectors (in-irons, running) */}
      {SECTORS.filter(s => s.symmetric).map(sector => {
        const startDeg = sector.startDeg
        const endDeg = sector.endDeg
        return (
          <path
            key={sector.id}
            d={sectorPath(cx, cy, r, startDeg, endDeg)}
            fill={sector.color}
            fillOpacity={fillOp(sector.id)}
            stroke={sector.color}
            strokeWidth={sector.id === activeSector ? 2 : 1}
            strokeOpacity={strokeOp(sector.id)}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
            onClick={() => onSelect?.(sector.termId)}
          />
        )
      })}

      {/* Port (left) and Starboard (right) symmetric sectors */}
      {SECTORS.filter(s => s.port).map(sector => {
        // Starboard (right side): positive angles
        const sbStart = sector.startDeg
        const sbEnd = sector.endDeg
        // Port (left side): mirror negative angles
        const portStart = -sector.endDeg
        const portEnd = -sector.startDeg
        return (
          <g key={sector.id}>
            {/* Starboard */}
            <path
              d={sectorPath(cx, cy, r, sbStart, sbEnd)}
              fill={sector.color}
              fillOpacity={fillOp(sector.id)}
              stroke={sector.color}
              strokeWidth={sector.id === activeSector ? 2 : 1}
              strokeOpacity={strokeOp(sector.id)}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
              onClick={() => onSelect?.(sector.termId)}
            />
            {/* Port */}
            <path
              d={sectorPath(cx, cy, r, portStart, portEnd)}
              fill={sector.color}
              fillOpacity={fillOp(sector.id)}
              stroke={sector.color}
              strokeWidth={sector.id === activeSector ? 2 : 1}
              strokeOpacity={strokeOp(sector.id)}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
              onClick={() => onSelect?.(sector.termId)}
            />
          </g>
        )
      })}

      {/* Wind arrow from top */}
      <defs>
        <marker
          id="arrow"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#60a5fa" />
        </marker>
      </defs>
      <line
        x1={cx}
        y1={cy - r - 18}
        x2={cx}
        y2={cy - r + 4}
        stroke="#60a5fa"
        strokeWidth={2.5}
        markerEnd="url(#arrow)"
      />
      <text
        x={cx}
        y={cy - r - 22}
        textAnchor="middle"
        fill="#60a5fa"
        fontSize={compact ? 9 : 11}
        fontWeight="bold"
      >
        WIND
      </text>

      {/* Boat at center */}
      <ellipse cx={cx} cy={cy} rx={compact ? 5 : 7} ry={compact ? 10 : 14} fill="#f8fafc" opacity={0.9} />

      {/* Labels for non-compact or compact with enough space */}
      {!compact && (
        <>
          {/* In Irons */}
          {(() => {
            const mid = midAngle(-30, 30)
            const pos = polarToXY(cx, cy, labelR * 0.55, mid)
            return (
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#fca5a5" fontSize={8} fontWeight="bold">
                In Irons
              </text>
            )
          })()}
          {/* Running */}
          {(() => {
            const pos = polarToXY(cx, cy, labelR * 0.72, 180)
            return (
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#fcd34d" fontSize={8} fontWeight="bold">
                Running
              </text>
            )
          })()}
          {/* Starboard labels */}
          {SECTORS.filter(s => s.port).map(sector => {
            const mid = midAngle(sector.startDeg, sector.endDeg)
            const pos = polarToXY(cx, cy, labelR, mid)
            return (
              <text
                key={`sb-label-${sector.id}`}
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                fill="white"
                fontSize={7.5}
                fontWeight="600"
                opacity={0.9}
              >
                {sector.label}
              </text>
            )
          })}
          {/* Port labels (mirrored) */}
          {SECTORS.filter(s => s.port).map(sector => {
            const mid = midAngle(-sector.endDeg, -sector.startDeg)
            const pos = polarToXY(cx, cy, labelR, mid)
            return (
              <text
                key={`port-label-${sector.id}`}
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                fill="white"
                fontSize={7.5}
                fontWeight="600"
                opacity={0.9}
              >
                {sector.label}
              </text>
            )
          })}
        </>
      )}
    </svg>
  )
}
