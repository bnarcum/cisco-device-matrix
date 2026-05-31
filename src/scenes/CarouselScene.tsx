import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { Device } from '../data/cisco'
import { DevicePedestal } from '../three/DevicePedestal'
import { SceneEnv } from '../three/SceneEnv'

interface Props {
  devices: Device[]
  selected?: Device | null
  onSelect: (d: Device) => void
}

/**
 * 3D ring carousel. Drag horizontally or scroll to rotate. The device facing
 * the camera is highlighted; click it to inspect, or use ← / → keys.
 */
export function CarouselScene({ devices, selected, onSelect }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const target = useRef(0)
  const current = useRef(0)
  const [front, setFront] = useState(0)
  const { gl } = useThree()
  const count = devices.length

  const RADIUS = Math.max(2.6, count * 0.35)

  // Pointer drag rotation
  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    let lastX = 0
    const down = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      target.current -= dx * 0.005
    }
    const up = (e: PointerEvent) => {
      dragging = false
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
    const wheel = (e: WheelEvent) => {
      target.current += e.deltaY * 0.0025
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl])

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') target.current += (Math.PI * 2) / count
      if (e.key === 'ArrowLeft') target.current -= (Math.PI * 2) / count
      if (e.key === 'Enter') {
        onSelect(devices[front])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, devices, front, onSelect])

  // Snap-to-nearest indicator
  useFrame((_, dt) => {
    if (!groupRef.current) return
    // Critically damped easing
    current.current = THREE.MathUtils.damp(
      current.current,
      target.current,
      6,
      dt,
    )
    groupRef.current.rotation.y = current.current
    const step = (Math.PI * 2) / count
    const idx = ((-current.current / step) % count + count) % count
    const rounded = Math.round(idx) % count
    if (rounded !== front) setFront(rounded)
  })

  return (
    <>
      <SceneEnv />
      <group position={[0, 0, 0]}>
        {/* Floor disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[RADIUS - 0.5, RADIUS + 0.5, 96]} />
          <meshStandardMaterial color="#0a1220" emissive="#001724" />
        </mesh>

        <group ref={groupRef}>
          {devices.map((d, i) => {
            const angle = (i / count) * Math.PI * 2
            const x = Math.sin(angle) * RADIUS
            const z = Math.cos(angle) * RADIUS
            const isFront = i === front
            return (
              <DevicePedestal
                key={d.id}
                device={d}
                position={[x, 0, z]}
                rotationY={-angle}
                selected={selected?.id === d.id || isFront}
                scale={isFront ? 1.15 : 0.9}
                showLabel={isFront}
                onClick={(dd) => onSelect(dd)}
              />
            )
          })}
        </group>

        {/* HUD label in world space */}
        <Text
          position={[0, 1.6, 0]}
          fontSize={0.16}
          color="#c4d6ed"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#05080f"
        >
          drag · scroll · ← / → · enter
        </Text>
      </group>
    </>
  )
}
