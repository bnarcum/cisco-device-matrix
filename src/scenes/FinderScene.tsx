import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Category, Device, RoomSize } from '../data/cisco'
import { DevicePedestal } from '../three/DevicePedestal'
import { SceneEnv } from '../three/SceneEnv'
import { OrbitControls, Text } from '@react-three/drei'

interface Filter {
  roomSize?: RoomSize
  category?: Category
}

interface Props {
  devices: Device[]
  filter: Filter
  selected?: Device | null
  onSelect: (d: Device) => void
}

/** A swarm scene: matching devices fly forward, others recede. */
export function FinderScene({ devices, filter, selected, onSelect }: Props) {
  const matching = useMemo(
    () =>
      devices.filter((d) => {
        if (filter.roomSize && !d.roomSizes.includes(filter.roomSize))
          return false
        if (filter.category && d.category !== filter.category) return false
        return true
      }),
    [devices, filter],
  )

  const positions = useMemo(() => {
    const map = new Map<string, [number, number, number]>()
    const radius = 6
    // Non-matching: random scattered "back layer"
    devices.forEach((d, i) => {
      const angle = (i / devices.length) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = (i % 3) * 0.2
      const z = Math.sin(angle) * radius
      map.set(d.id, [x, y, z])
    })
    // Matching: arrange in a small grid up front
    const cols = Math.max(1, Math.ceil(Math.sqrt(matching.length)))
    const spacing = 1.6
    matching.forEach((d, i) => {
      const cx = (i % cols) - (cols - 1) / 2
      const cz = Math.floor(i / cols) - Math.floor(matching.length / cols) / 2
      map.set(d.id, [cx * spacing, 0, cz * spacing])
    })
    return map
  }, [devices, matching])

  return (
    <>
      <SceneEnv />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={3}
        maxDistance={18}
        maxPolarAngle={Math.PI * 0.49}
      />
      <gridHelper
        args={[24, 24, '#1e2a3c', '#101820']}
        position={[0, 0.001, 0]}
      />
      <Text
        position={[0, 1.5, -3]}
        fontSize={0.22}
        color="#049fd9"
        anchorX="center"
        anchorY="middle"
      >
        {matching.length} match{matching.length === 1 ? '' : 'es'}
      </Text>

      {devices.map((d) => {
        const target = positions.get(d.id) ?? [0, 0, 0]
        const isMatch = matching.includes(d)
        return (
          <FlyTo key={d.id} target={target} dim={!isMatch}>
            <DevicePedestal
              device={d}
              selected={selected?.id === d.id}
              showLabel={isMatch}
              scale={isMatch ? 1 : 0.7}
              onClick={onSelect}
            />
          </FlyTo>
        )
      })}
    </>
  )
}

function FlyTo({
  target,
  dim,
  children,
}: {
  target: [number, number, number]
  dim: boolean
  children: React.ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.position.x = THREE.MathUtils.damp(
      ref.current.position.x,
      target[0],
      4,
      dt,
    )
    ref.current.position.y = THREE.MathUtils.damp(
      ref.current.position.y,
      target[1] + (dim ? 0.4 : 0),
      4,
      dt,
    )
    ref.current.position.z = THREE.MathUtils.damp(
      ref.current.position.z,
      target[2],
      4,
      dt,
    )
    const scale = dim ? 0.55 : 1
    const cur = ref.current.scale.x
    const ns = THREE.MathUtils.damp(cur, scale, 4, dt)
    ref.current.scale.set(ns, ns, ns)
  })
  return <group ref={ref}>{children}</group>
}

/**
 * The question-driven UI overlay (HTML, not 3D). The state lives in the
 * parent so the 3D scene can react to changes. We export the question flow
 * here so all finder logic stays together.
 */
export interface FinderState {
  step: 0 | 1 | 2
  filter: Filter
}

export const FINDER_QUESTIONS = [
  {
    title: 'What kind of space?',
    options: [
      { label: 'Personal desk', value: 'personal' as RoomSize, hint: '1 person' },
      { label: 'On the go', value: 'mobile' as RoomSize, hint: 'Frontline, field' },
      { label: 'Huddle', value: 'huddle' as RoomSize, hint: '2–6 people' },
      { label: 'Small room', value: 'small' as RoomSize, hint: '3–6 people' },
      { label: 'Medium room', value: 'medium' as RoomSize, hint: '6–12 people' },
      { label: 'Large room', value: 'large' as RoomSize, hint: '12+ people' },
      { label: 'Auditorium', value: 'auditorium' as RoomSize, hint: 'Cinematic' },
    ],
  },
  {
    title: 'What are you outfitting?',
    options: [
      { label: 'Anything', value: undefined, hint: 'Show me all matches' },
      { label: 'Room device', value: 'room' as Category, hint: 'Bars, boards, kits' },
      { label: 'Desk device', value: 'desk' as Category, hint: 'All-in-ones' },
      { label: 'Phone', value: 'phone' as Category, hint: 'IP / wireless' },
      { label: 'Headset', value: 'headset' as Category, hint: 'Wired & wireless' },
      { label: 'Peripheral', value: 'peripheral' as Category, hint: 'Mics, controllers' },
      { label: 'Camera', value: 'camera' as Category, hint: 'PTZ, webcams' },
    ],
  },
] as const

/** Tiny hook just to silence "unused" warnings in this file. */
export function _useUnused() {
  useEffect(() => {}, [])
}
