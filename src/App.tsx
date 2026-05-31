import { useCallback, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { DEVICES, CATEGORY_LABELS, CATEGORY_ORDER } from './data/cisco'
import type { Category, Device } from './data/cisco'
import { ShowroomScene } from './scenes/ShowroomScene'
import { FinderScene } from './scenes/FinderScene'
import { DeviceDrawer } from './ui/DeviceDrawer'
import { CompareTray } from './ui/CompareTray'
import { CompareModal } from './ui/CompareModal'
import { FinderOverlay, type FinderState } from './ui/FinderOverlay'

type Mode = 'showroom' | 'finder'

const MAX_COMPARE = 3

export default function App() {
  const [mode, setMode] = useState<Mode>('showroom')
  const [selected, setSelected] = useState<Device | null>(null)
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [compare, setCompare] = useState<Device[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [finder, setFinder] = useState<FinderState>({ step: 0 })

  const visibleDevices = useMemo(() => {
    if (filter === 'all') return DEVICES
    return DEVICES.filter((d) => d.category === filter)
  }, [filter])

  const toggleCompare = useCallback((d: Device) => {
    setCompare((prev) => {
      const exists = prev.find((p) => p.id === d.id)
      if (exists) return prev.filter((p) => p.id !== d.id)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, d]
    })
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo" aria-hidden>
            ⩕
          </div>
          <div>
            <div className="brand-title">Collaboration Device Matrix</div>
            <div className="brand-sub">Interactive 3D · Feb 2026 catalog</div>
          </div>
        </div>
        <nav className="mode-switch" aria-label="View mode">
          <button
            data-active={mode === 'showroom' ? 'true' : 'false'}
            onClick={() => setMode('showroom')}
          >
            Showroom
          </button>
          <button
            data-active={mode === 'finder' ? 'true' : 'false'}
            onClick={() => setMode('finder')}
          >
            Finder
          </button>
        </nav>
        <a
          className="source-link"
          href="https://www.webex.com/content/dam/wbx/us/documents/pdf/Collaboration_Device_Product_Matrix_Brochure.pdf"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the official Cisco/Webex Collaboration Device Product Matrix brochure (PDF, opens in a new tab)"
          title="Open the official Cisco/Webex brochure (PDF)"
        >
          <span className="source-link-icon" aria-hidden>
            ⤓
          </span>
          <span className="source-link-text">
            <span className="source-link-label">Source brochure</span>
            <span className="source-link-meta">Cisco · Webex · PDF</span>
          </span>
        </a>
      </header>

      <div className="canvas-wrap">
        <Canvas
          camera={{ position: cameraFor(mode), fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          {mode === 'showroom' && (
            <ShowroomScene
              devices={visibleDevices}
              selected={selected}
              onSelect={setSelected}
            />
          )}
          {mode === 'finder' && (
            <FinderScene
              devices={DEVICES}
              selected={selected}
              step={finder.step}
              filter={{
                roomSize: finder.roomSize,
                category: finder.category,
              }}
              onSelect={setSelected}
            />
          )}
        </Canvas>

        <div className="overlay">
          {mode === 'showroom' && (
            <Filters value={filter} onChange={setFilter} />
          )}
          {mode === 'finder' && (
            <FinderOverlay state={finder} setState={setFinder} />
          )}
          <CompareTray
            items={compare}
            onRemove={(d) => toggleCompare(d)}
            onOpen={(d) => setSelected(d)}
            onCompareAll={() => setCompareOpen(true)}
          />
        </div>

        <DeviceDrawer
          device={selected}
          onClose={() => setSelected(null)}
          inCompare={!!selected && compare.some((c) => c.id === selected.id)}
          canAddCompare={compare.length < MAX_COMPARE}
          onToggleCompare={toggleCompare}
        />

        <CompareModal
          items={compare}
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
        />
      </div>
    </div>
  )
}

function cameraFor(mode: Mode): [number, number, number] {
  switch (mode) {
    case 'showroom':
      return [9, 6, 9]
    case 'finder':
      return [0, 4.5, 9]
  }
}

function Filters({
  value,
  onChange,
}: {
  value: Category | 'all'
  onChange: (c: Category | 'all') => void
}) {
  return (
    <div className="filters" role="toolbar" aria-label="Category filter">
      <button
        data-active={value === 'all' ? 'true' : 'false'}
        onClick={() => onChange('all')}
      >
        All
      </button>
      {CATEGORY_ORDER.map((c) => (
        <button
          key={c}
          data-active={value === c ? 'true' : 'false'}
          onClick={() => onChange(c)}
        >
          {CATEGORY_LABELS[c]}
        </button>
      ))}
    </div>
  )
}

