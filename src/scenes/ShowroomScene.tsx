import { useMemo } from 'react'
import { OrbitControls } from '@react-three/drei'
import type { Device } from '../data/cisco'
import { CATEGORY_ORDER, CATEGORY_LABELS } from '../data/cisco'
import { DevicePedestal } from '../three/DevicePedestal'
import { SceneEnv } from '../three/SceneEnv'

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
        maxPolarAngle={Math.PI * 0.49}
      />
      {/* Floor grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color="#0a1220" roughness={1} />
      </mesh>
      <gridHelper
        args={[28, 28, '#1e2a3c', '#101820']}
        position={[0, 0.001, 0]}
      />

      {/* Category labels as floor text rings */}
      {layout.rings.map((ring) => (
        <CategoryRing
          key={ring.category}
          radius={ring.radius}
          label={CATEGORY_LABELS[ring.category]}
        />
      ))}

      {/* Devices */}
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

function CategoryRing({ radius, label }: { radius: number; label: string }) {
  return (
    <group position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[radius - 0.01, radius + 0.01, 96]} />
        <meshBasicMaterial color="#1e2a3c" />
      </mesh>
      <mesh position={[radius + 0.55, 0, 0]}>
        <planeGeometry args={[1.1, 0.18]} />
        <meshBasicMaterial color="#049FD9" transparent opacity={0.0} />
      </mesh>
      <RingLabel label={label} radius={radius} />
    </group>
  )
}

import { Text } from '@react-three/drei'
function RingLabel({ label, radius }: { label: string; radius: number }) {
  return (
    <Text
      position={[radius + 0.7, 0, 0]}
      fontSize={0.18}
      color="#c4d6ed"
      anchorX="left"
      anchorY="middle"
      outlineWidth={0.005}
      outlineColor="#05080f"
    >
      {label}
    </Text>
  )
}
