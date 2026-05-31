import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Device } from '../data/cisco'
import { DeviceModel } from './DeviceModel'

interface Props {
  device: Device
  position?: [number, number, number]
  rotationY?: number
  /** Scale applied uniformly. */
  scale?: number
  selected?: boolean
  /** Show floating label & price chip. */
  showLabel?: boolean
  onClick?: (device: Device) => void
  /** Hover handler for the carousel mode. */
  onHover?: (device: Device | null) => void
  /** Idle gentle rotation. */
  spin?: boolean
}

export function DevicePedestal({
  device,
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  selected = false,
  showLabel = false,
  onClick,
  onHover,
  spin = false,
}: Props) {
  const group = useRef<THREE.Group>(null)
  const baseY = position[1]

  useFrame((_, dt) => {
    if (!group.current) return
    if (spin) group.current.rotation.y += dt * 0.25
    // Subtle bob when selected
    if (selected) {
      group.current.position.y =
        baseY + Math.sin(performance.now() * 0.002) * 0.025
    } else {
      group.current.position.y = baseY
    }
  })

  return (
    <group
      ref={group}
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(device)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        onHover?.(device)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        document.body.style.cursor = ''
        onHover?.(null)
      }}
    >
      <group scale={scale} position={[0, device.size[1] / 2 + 0.02, 0]}>
        <DeviceModel device={device} highlighted={selected} />
      </group>
      {/* Pedestal disc */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.4, 48]} />
        <meshStandardMaterial
          color={selected ? '#049FD9' : '#1e2a3c'}
          emissive={selected ? '#049FD9' : '#0a1a2a'}
          emissiveIntensity={selected ? 0.8 : 0.2}
        />
      </mesh>
      {showLabel && (
        <Html
          position={[0, device.size[1] + 0.35, 0]}
          center
          distanceFactor={6}
          zIndexRange={[1, 0]}
        >
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(5,8,15,0.7)',
              border: `1px solid ${selected ? '#049FD9' : 'rgba(255,255,255,0.1)'}`,
              fontSize: 11,
              color: '#fff',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(6px)',
            }}
          >
            {device.name}
          </div>
        </Html>
      )}
    </group>
  )
}
