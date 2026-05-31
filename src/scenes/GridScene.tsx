import { useMemo } from 'react'
import { OrbitControls, Text } from '@react-three/drei'
import type { Device, RoomSize } from '../data/cisco'
import { ROOM_SIZE_ORDER, ROOM_SIZE_LABELS } from '../data/cisco'
import { DevicePedestal } from '../three/DevicePedestal'
import { SceneEnv } from '../three/SceneEnv'

interface Props {
  devices: Device[]
  selected?: Device | null
  onSelect: (d: Device) => void
}

/**
 * 3D comparison grid: rows = room size (personal → auditorium),
 * columns = category. Devices stack within their cell so multiple devices
 * of the same category can serve the same room size.
 */
export function GridScene({ devices, selected, onSelect }: Props) {
  const layout = useMemo(() => buildGrid(devices), [devices])

  return (
    <>
      <SceneEnv />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={4}
        maxDistance={28}
        maxPolarAngle={Math.PI * 0.49}
      />
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[layout.gridW + 4, layout.gridD + 4]} />
        <meshStandardMaterial color="#0a1220" />
      </mesh>
      <gridHelper
        args={[
          Math.max(layout.gridW, layout.gridD) + 4,
          Math.max(layout.gridW, layout.gridD) + 4,
          '#1e2a3c',
          '#101820',
        ]}
        position={[0, 0.001, 0]}
      />

      {/* Row labels (room sizes) */}
      {layout.rowLabels.map((r) => (
        <Text
          key={r.label}
          position={[-(layout.gridW / 2) - 1.2, 0.001, r.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#c4d6ed"
          anchorX="right"
          anchorY="middle"
        >
          {r.label}
        </Text>
      ))}
      {/* Column labels (categories) */}
      {layout.colLabels.map((c) => (
        <Text
          key={c.label}
          position={[c.x, 0.001, -(layout.gridD / 2) - 1.0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.22}
          color="#049fd9"
          anchorX="center"
          anchorY="middle"
        >
          {c.label}
        </Text>
      ))}

      {/* Devices */}
      {layout.placements.map((p) => (
        <DevicePedestal
          key={p.device.id + p.row}
          device={p.device}
          position={p.position}
          selected={selected?.id === p.device.id}
          showLabel
          onClick={onSelect}
        />
      ))}
    </>
  )
}

const CATEGORY_COLS: { id: Device['category']; label: string }[] = [
  { id: 'room', label: 'Room' },
  { id: 'desk', label: 'Desk' },
  { id: 'phone', label: 'Phones' },
  { id: 'headset', label: 'Headsets' },
  { id: 'peripheral', label: 'Peripherals' },
  { id: 'camera', label: 'Cameras' },
]

function buildGrid(devices: Device[]) {
  const COL_W = 2.1
  const ROW_D = 2.2
  const cols = CATEGORY_COLS
  const rows: RoomSize[] = ROOM_SIZE_ORDER

  const gridW = (cols.length - 1) * COL_W
  const gridD = (rows.length - 1) * ROW_D

  type P = {
    device: Device
    position: [number, number, number]
    row: RoomSize
  }
  const placements: P[] = []

  rows.forEach((row, ri) => {
    cols.forEach((col, ci) => {
      const inCell = devices.filter(
        (d) => d.category === col.id && d.roomSizes.includes(row),
      )
      inCell.forEach((d, i) => {
        const x = ci * COL_W - gridW / 2 + (i % 2 ? 0.3 : -0.3)
        const z = ri * ROW_D - gridD / 2 + (i > 1 ? 0.3 : -0.3)
        placements.push({ device: d, row, position: [x, 0, z] })
      })
    })
  })

  return {
    placements,
    rowLabels: rows.map((r, i) => ({
      label: ROOM_SIZE_LABELS[r],
      z: i * ROW_D - gridD / 2,
    })),
    colLabels: cols.map((c, i) => ({
      label: c.label,
      x: i * COL_W - gridW / 2,
    })),
    gridW: gridW + COL_W,
    gridD: gridD + ROW_D,
  }
}
