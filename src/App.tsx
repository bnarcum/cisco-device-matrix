import { useCallback, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { DEVICES, CATEGORY_LABELS, CATEGORY_ORDER } from './data/cisco'
import type { Category, Device } from './data/cisco'
import { ShowroomScene } from './scenes/ShowroomScene'
import { CarouselScene } from './scenes/CarouselScene'
import { GridScene } from './scenes/GridScene'
import { FinderScene } from './scenes/FinderScene'
import { DeviceDrawer } from './ui/DeviceDrawer'
import { CompareTray } from './ui/CompareTray'
import { CompareModal } from './ui/CompareModal'
import { FinderOverlay, type FinderState } from './ui/FinderOverlay'

type Mode = 'showroom' | 'carousel' | 'grid' | 'finder'

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
            data-active={mode === 'carousel' ? 'true' : 'false'}
            onClick={() => setMode('carousel')}
          >
            Carousel
          </button>
          <button
            data-active={mode === 'grid' ? 'true' : 'false'}
            onClick={() => setMode('grid')}
          >
            Grid
          </button>
          <button
            data-active={mode === 'finder' ? 'true' : 'false'}
            onClick={() => setMode('finder')}
          >
            Finder
          </button>
        </nav>
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
          {mode === 'carousel' && (
            <CarouselScene
              devices={visibleDevices}
              selected={selected}
              onSelect={setSelected}
            />
          )}
          {mode === 'grid' && (
            <GridScene
              devices={visibleDevices}
              selected={selected}
              onSelect={setSelected}
            />
          )}
          {mode === 'finder' && (
            <FinderScene
              devices={DEVICES}
              selected={selected}
              filter={{
                roomSize: finder.roomSize,
                category: finder.category,
              }}
              onSelect={setSelected}
            />
          )}
        </Canvas>

        <div className="overlay">
          <Legend mode={mode} />
          {mode !== 'finder' && (
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
    case 'carousel':
      return [0, 1.8, 9]
    case 'grid':
      return [0, 12, 12]
    case 'finder':
      return [0, 4, 8]
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

function Legend({ mode }: { mode: Mode }) {
  return (
    <div className="legend" role="note">
      <h2>{LEGEND[mode].title}</h2>
      <p className="help">{LEGEND[mode].body}</p>
      <div className="legend-row">
        <span className="swatch" style={{ background: '#049fd9' }} />
        <span>Cisco Primary · selected device</span>
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ background: '#1b1b1f' }} />
        <span>Carbon Black finish</span>
      </div>
      <div className="legend-row">
        <span className="swatch" style={{ background: '#f2efe9' }} />
        <span>First Light finish</span>
      </div>
    </div>
  )
}

const LEGEND: Record<Mode, { title: string; body: string }> = {
  showroom: {
    title: 'Showroom',
    body: 'Drag to orbit, scroll to zoom. Each ring is a category. Click any device to see specs.',
  },
  carousel: {
    title: 'Carousel',
    body: 'Drag, scroll, or use ← / → to rotate. Press Enter to inspect the device at the front.',
  },
  grid: {
    title: 'Comparison grid',
    body: 'Rows = room size, columns = category. Click a device to compare.',
  },
  finder: {
    title: 'Finder',
    body: 'Answer two quick questions and watch the matching devices fly forward.',
  },
}
