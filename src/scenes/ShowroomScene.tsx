import { useMemo } from 'react'
import { Html, OrbitControls } from '@react-three/drei'
import type { Device } from '../data/cisco'
import { CATEGORY_ORDER, CATEGORY_LABELS } from '../data/cisco'
import { DevicePedestal } from '../three/DevicePedestal'
import { SceneEnv } from '../three/SceneEnv'
import { ShowroomFloor } from '../three/ShowroomFloor'

interface Props {
  devices: Device[]
  selected?: Device | null
  onSelect: (d: Device) => void
}

/**
 * Walkable virtual showroom: devices are arranged in concentric "rings" by
 * category. Drag to orbit; scroll to dolly. Click a device to inspect.
 */
export function ShowroomScene({ devices, selected, onSelect }: Props) {
  const layout = useMemo(() => layoutByCategory(devices), [devices])

  return (
    <>
      <SceneEnv />
      <OrbitControls
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={2.5}
        maxDistance={20}
        maxPolarAngle={Math.PI * 0.42}
      />

      <ShowroomFloor />

      {layout.rings.map((ring) => (
        <RingLabel
          key={ring.category}
          radius={ring.radius}
          label={CATEGORY_LABELS[ring.category]}
        />
      ))}

      {layout.placements.map((p) => (
        <DevicePedestal
          key={p.device.id}
          device={p.device}
          position={p.position}
          rotationY={p.rotationY}
          selected={selected?.id === p.device.id}
          showLabel
          onClick={onSelect}
        />
      ))}
    </>
  )
}

interface Placement {
  device: Device
  position: [number, number, number]
  rotationY: number
}

function layoutByCategory(devices: Device[]) {
  const rings: { category: Device['category']; radius: number }[] = []
  const placements: Placement[] = []
  let radius = 2.4
  for (const cat of CATEGORY_ORDER) {
    const inCat = devices.filter((d) => d.category === cat)
    if (inCat.length === 0) continue
    rings.push({ category: cat, radius })
    inCat.forEach((d, i) => {
      const angle = (i / inCat.length) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      placements.push({
        device: d,
        position: [x, 0, z],
        rotationY: -angle + Math.PI / 2,
      })
    })
    radius += 2.0
  }
  return { rings, placements }
}

/**
 * HTML pill label anchored at the outer edge of a category's invisible ring,
 * acting as a quiet wayfinding cue without painting big blue tracks on the
 * floor.
 */
function RingLabel({ radius, label }: { radius: number; label: string }) {
  return (
    <Html
      position={[radius + 0.55, 0.03, 0]}
      center
      distanceFactor={9}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[1, 0]}
    >
      <div
        style={{
          padding: '5px 11px',
          borderRadius: 999,
          background: 'rgba(5, 8, 15, 0.72)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: 'rgba(230, 240, 250, 0.85)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 600,
          backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
        }}
      >
        {label}
      </div>
    </Html>
  )
}
