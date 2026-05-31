import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Device } from '../data/cisco'
import { DeviceModel } from './DeviceModel'
import { PhotoBillboard } from './PhotoBillboard'
import { deviceImage } from '../data/deviceImages'

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
  const imageUrl = deviceImage(device.id)

  useFrame((_, dt) => {
    if (!group.current) return
    // Photos are billboarded — spinning the parent has no visual effect
    // and breaks hover affordance, so only spin primitives.
    if (spin && !imageUrl) group.current.rotation.y += dt * 0.25
    if (selected) {
      group.current.position.y =
        baseY + Math.sin(performance.now() * 0.002) * 0.025
    } else {
      group.current.position.y = baseY
    }
  })

  // Pick a billboard size scaled to the device's natural footprint so
  // small things (earbuds) don't dwarf big things (boards).
  const targetSize = Math.max(
    0.7,
    Math.min(1.8, Math.max(device.size[0], device.size[1]) * 0.9) * scale,
  )

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
      {imageUrl ? (
        <>
          {/* Invisible click target sized to the billboard's footprint */}
          <mesh position={[0, targetSize / 2, 0]} visible={false}>
            <boxGeometry args={[targetSize, targetSize, 0.3]} />
            <meshBasicMaterial />
          </mesh>
          <group position={[0, targetSize / 2, 0]}>
            <PhotoBillboard
              url={imageUrl}
              targetSize={targetSize}
              selected={selected}
            />
          </group>
          {/* Subtle shadow projected on the pedestal disc */}
          <mesh
            position={[0, 0.003, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[targetSize * 0.3, 32]} />
            <meshBasicMaterial
              color="#000"
              transparent
              opacity={0.18}
              depthWrite={false}
            />
          </mesh>
        </>
      ) : (
        <group scale={scale} position={[0, device.size[1] / 2 + 0.02, 0]}>
          <DeviceModel device={device} highlighted={selected} />
        </group>
      )}
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
          position={[
            0,
            (imageUrl ? targetSize : device.size[1]) + 0.35,
            0,
          ]}
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
