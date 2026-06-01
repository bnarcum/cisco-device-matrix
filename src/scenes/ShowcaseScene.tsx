import { useMemo } from 'react'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import type { Device } from '../data/cisco'
import { ShowcaseSceneEnv } from '../three/ShowcaseSceneEnv'
import {
  DisplayCase,
  DisplayTable,
  FixtureLabel,
  Pedestal,
  ShelfBank,
  ShelfRow,
  ShowcaseDevice,
  WallMount,
  WallMountedDevice,
} from '../three/ShowcaseFixtures'

interface Props {
  devices: Device[]
  selected?: Device | null
  onSelect: (d: Device) => void
}

/**
 * Workspace Showcase scene
 * ───────────────────────────
 * A bright, retail-style 3D exhibition where devices sit on fixtures
 * appropriate to their form factor. The camera enters at human walking
 * height (≈ 3.8 m back, looking forward) and devices visibly REST on
 * their fixtures — bottom-anchored cards that don't camera-pivot, with
 * localized contact shadows and per-device selection rings.
 *
 * Layout (X = left/right, Z = forward/back where -Z is deeper into the room):
 *
 *                   [Boards 55"]   [Boards 75"]      ← Z ≈ -11 (back wall)
 *
 *       [Room Bar L]       [Bar Pro center?]     [Room Bar R]   ← Z ≈ -7
 *
 *        [EQX]                                    [Pro G2]      ← Z ≈ -3
 *
 *  [Mics shelf]   [Desk table]   [Desks table]   [Headset case]  ← Z ≈ +1..2
 *
 *  [Nav shelf]    [Phone table]  [Phone table]   [Cameras shelf] ← Z ≈ +4
 *                                ↑ camera at [0, 3.8, 13] looks down -Z
 */
export function ShowcaseScene({ devices, selected, onSelect }: Props) {
  const groups = useMemo(() => groupDevices(devices), [devices])

  return (
    <>
      <ShowcaseSceneEnv />
      {/* Inject our own camera + controls so switching here from another
          mode always lands at the front of the aisle, mirroring the
          Finder scene's pattern. The lowered camera reads more like
          walking into a retail space at human height. */}
      <PerspectiveCamera makeDefault fov={45} position={[0, 3.8, 13]} />
      <OrbitControls
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={24}
        maxPolarAngle={Math.PI * 0.45}
        target={[0, 1, 0]}
      />

      {/* ───────── Boards: 2 wall mounts at the back wall ───────── */}
      <FixtureLabel label="Boards" position={[0, 3.0, -11.4]} />
      <WallMount
        position={[-3.6, 0, -11.5]}
        rotationY={0}
        width={3.2}
        height={2.6}
      >
        {groups.boards[0] && (
          <WallMountedDevice
            device={groups.boards[0]}
            y={1.5}
            targetSize={1.95}
            selected={selected?.id === groups.boards[0].id}
            onClick={onSelect}
          />
        )}
      </WallMount>
      <WallMount
        position={[3.6, 0, -11.5]}
        rotationY={0}
        width={3.2}
        height={2.6}
      >
        {groups.boards[1] && (
          <WallMountedDevice
            device={groups.boards[1]}
            y={1.5}
            targetSize={2.15}
            selected={selected?.id === groups.boards[1].id}
            onClick={onSelect}
          />
        )}
      </WallMount>

      {/* ───────── Room Bars: 3 slim wall sections across the back ───────── */}
      <FixtureLabel label="Room Bars" position={[0, 2.9, -7.5]} />
      {([
        [-5.5, 0, -7],
        [-1.8, 0, -8.2],
        [5.5, 0, -7],
      ] as [number, number, number][]).map((pos, slot) => {
        // Skip the center slot when we have only 2 bars (push the second
        // one to the right side) so the aisle reads cleanly.
        const barIdx =
          groups.bars.length === 2
            ? slot === 0
              ? 0
              : slot === 2
                ? 1
                : -1
            : slot
        const d = groups.bars[barIdx]
        return (
          <WallMount key={slot} position={pos} rotationY={0} width={2.2} height={2.0}>
            {d && (
              <WallMountedDevice
                device={d}
                y={1.2}
                targetSize={Math.max(0.9, d.size[0] * 1.4)}
                selected={selected?.id === d.id}
                onClick={onSelect}
              />
            )}
          </WallMount>
        )
      })}

      {/* ───────── Room Kits: floor-stand pedestals ───────── */}
      <FixtureLabel label="Room Kits" position={[0, 2.9, -3.2]} />
      {([
        [-4.2, 0, -3],
        [4.2, 0, -3],
        [0, 0, -3.6],
      ] as [number, number, number][]).map((pos, i) => {
        const d = groups.kits[i]
        return (
          <Pedestal key={i} position={pos} rotationY={0} width={0.7} height={0.9} depth={0.7}>
            {d && (
              <ShowcaseDevice
                device={d}
                position={[0, 0, 0]}
                scale={1.0}
                selected={selected?.id === d.id}
                onClick={onSelect}
              />
            )}
          </Pedestal>
        )
      })}

      {/* ───────── Desk Series: 2 adjacent display tables ───────── */}
      <FixtureLabel label="Desk Series" position={[0, 2.6, 0.5]} />
      <DisplayTable position={[-2.4, 0, 0.5]} rotationY={0} width={2.2} depth={0.95}>
        {groups.desks.slice(0, 2).map((d, i) => (
          <ShowcaseDevice
            key={d.id}
            device={d}
            position={[(i - 0.5) * 1.0, 0, 0]}
            scale={0.9}
            selected={selected?.id === d.id}
            onClick={onSelect}
          />
        ))}
      </DisplayTable>
      <DisplayTable position={[2.4, 0, 0.5]} rotationY={0} width={1.6} depth={0.95}>
        {groups.desks[2] && (
          <ShowcaseDevice
            device={groups.desks[2]}
            position={[0, 0, 0]}
            scale={0.9}
            selected={selected?.id === groups.desks[2].id}
            onClick={onSelect}
          />
        )}
      </DisplayTable>

      {/* ───────── Phones: 2 display tables in front ───────── */}
      <FixtureLabel label="Phones" position={[-4.2, 2.6, 4.5]} />
      <PhoneTables
        devices={groups.phones}
        selected={selected}
        onSelect={onSelect}
      />

      {/* ───────── Headsets: glass case ───────── */}
      <FixtureLabel label="Headsets" position={[4.2, 2.6, 4.5]} />
      <DisplayCase
        position={[4.2, 0, 4.5]}
        rotationY={0}
        width={1.5}
        height={0.7}
        depth={0.7}
      >
        {/* 3 across × 2 deep grid of headsets inside the case. With
            ShowcaseDevice's honest sizing, headsets render at ~0.2 m
            and comfortably fit a 1.5 × 0.7 case. */}
        {groups.headsets.slice(0, 6).map((d, i) => {
          const col = i % 3
          const row = Math.floor(i / 3)
          const x = (col - 1) * 0.4
          const z = (row - 0.5) * 0.25
          return (
            <ShowcaseDevice
              key={d.id}
              device={d}
              position={[x, 0, z]}
              scale={0.9}
              selected={selected?.id === d.id}
              onClick={onSelect}
            />
          )
        })}
      </DisplayCase>

      {/* ───────── Cameras: shelf bank on the far right ───────── */}
      <FixtureLabel label="Cameras" position={[8.5, 2.4, 2]} />
      <ShelfBank
        position={[8.5, 0, 2]}
        rotationY={-Math.PI / 2}
        width={1.6}
        height={1.7}
        depth={0.45}
      >
        {/* 2 cameras per shelf across 3 shelves, ~0.5 m apart */}
        {(() => {
          const cams = groups.cameras
          const rows: Device[][] = [
            cams.slice(0, 2),
            cams.slice(2, 4),
            cams.slice(4, 6),
          ]
          const shelfYs = [0.6, 1.05, 1.5]
          return rows.map((row, ri) => (
            <ShelfRow key={ri} y={shelfYs[ri]}>
              {row.map((d, i) => (
                <ShowcaseDevice
                  key={d.id}
                  device={d}
                  position={[(i - (row.length - 1) / 2) * 0.5, 0, 0]}
                  scale={0.85}
                  selected={selected?.id === d.id}
                  onClick={onSelect}
                />
              ))}
            </ShelfRow>
          ))
        })()}
      </ShelfBank>

      {/* ───────── Microphones + Navigators: two shelf banks on the far left ───────── */}
      <FixtureLabel label="Microphones" position={[-8.5, 2.4, 2.5]} />
      <ShelfBank
        position={[-8.5, 0, 2.5]}
        rotationY={Math.PI / 2}
        width={1.6}
        height={1.7}
        depth={0.45}
      >
        {(() => {
          const mics = groups.mics
          const rows: Device[][] = [
            mics.slice(0, 2),
            mics.slice(2, 4),
            mics.slice(4, 6),
          ]
          const shelfYs = [0.6, 1.05, 1.5]
          return rows.map((row, ri) => (
            <ShelfRow key={ri} y={shelfYs[ri]}>
              {row.map((d, i) => (
                <ShowcaseDevice
                  key={d.id}
                  device={d}
                  position={[(i - (row.length - 1) / 2) * 0.5, 0, 0]}
                  scale={0.85}
                  selected={selected?.id === d.id}
                  onClick={onSelect}
                />
              ))}
            </ShelfRow>
          ))
        })()}
      </ShelfBank>

      {/* Navigators — small display table behind the mic shelf, between
          the cameras shelf and the headset case so they're easy to spot.
          The table stays in place even when no navigators are visible so
          the layout doesn't shift when filtering. */}
      <FixtureLabel label="Navigators" position={[-8.5, 2.6, -1.5]} />
      <DisplayTable
        position={[-8.5, 0, -1.5]}
        rotationY={Math.PI / 2}
        width={1.5}
        depth={0.8}
      >
        {groups.navigators.slice(0, 2).map((d, i) => (
          <ShowcaseDevice
            key={d.id}
            device={d}
            position={[(i - 0.5) * 0.85, 0, 0]}
            scale={0.85}
            selected={selected?.id === d.id}
            onClick={onSelect}
          />
        ))}
      </DisplayTable>
    </>
  )
}

/* ─────────────────── Phones layout ─────────────────── */

/**
 * Phones are split across two display tables so 7 IP/wireless devices
 * never have to crowd onto a single 1.6 m bench. With ShowcaseDevice's
 * honest sizing the phones render at ~0.2 m and fit comfortably.
 */
function PhoneTables({
  devices,
  selected,
  onSelect,
}: {
  devices: Device[]
  selected?: Device | null
  onSelect: (d: Device) => void
}) {
  // Always render both tables so the layout doesn't shift when the
  // category filter empties this section.
  const half = Math.ceil(devices.length / 2)
  const tableA = devices.slice(0, half)
  const tableB = devices.slice(half)

  return (
    <>
      <DisplayTable
        position={[-4.6, 0, 4.5]}
        rotationY={0}
        width={2.2}
        depth={0.9}
      >
        {tableA.map((d, i) => (
          <ShowcaseDevice
            key={d.id}
            device={d}
            position={[(i - (tableA.length - 1) / 2) * 0.6, 0, 0]}
            scale={0.7}
            selected={selected?.id === d.id}
            onClick={onSelect}
          />
        ))}
      </DisplayTable>
      <DisplayTable
        position={[-2.2, 0, 4.5]}
        rotationY={0}
        width={2.0}
        depth={0.9}
      >
        {tableB.map((d, i) => (
          <ShowcaseDevice
            key={d.id}
            device={d}
            position={[(i - (tableB.length - 1) / 2) * 0.6, 0, 0]}
            scale={0.7}
            selected={selected?.id === d.id}
            onClick={onSelect}
          />
        ))}
      </DisplayTable>
    </>
  )
}

/* ─────────────────── grouping ─────────────────── */

interface DeviceGroups {
  boards: Device[]
  bars: Device[]
  kits: Device[]
  desks: Device[]
  phones: Device[]
  headsets: Device[]
  cameras: Device[]
  mics: Device[]
  navigators: Device[]
}

/**
 * Bucket the (filtered) device list by fixture. Within `category === 'room'`
 * we further split on `shape`: boards → wall mounts, video bars → wall
 * mounts, codec kits → pedestals. Within `peripheral` we split by `family`:
 * Microphones → shelf, Navigator → table.
 */
function groupDevices(devices: Device[]): DeviceGroups {
  const boards: Device[] = []
  const bars: Device[] = []
  const kits: Device[] = []
  const desks: Device[] = []
  const phones: Device[] = []
  const headsets: Device[] = []
  const cameras: Device[] = []
  const mics: Device[] = []
  const navigators: Device[] = []

  for (const d of devices) {
    switch (d.category) {
      case 'room':
        if (d.shape === 'board') boards.push(d)
        else if (d.shape === 'video-bar') bars.push(d)
        else kits.push(d)
        break
      case 'desk':
        desks.push(d)
        break
      case 'phone':
        phones.push(d)
        break
      case 'headset':
        headsets.push(d)
        break
      case 'camera':
        cameras.push(d)
        break
      case 'peripheral':
        if (d.shape === 'navigator') navigators.push(d)
        else mics.push(d)
        break
    }
  }

  return { boards, bars, kits, desks, phones, headsets, cameras, mics, navigators }
}
