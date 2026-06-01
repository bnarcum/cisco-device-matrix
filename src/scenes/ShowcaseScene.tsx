import { useMemo } from 'react'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import type { Device } from '../data/cisco'
import { DevicePedestal } from '../three/DevicePedestal'
import { ShowcaseSceneEnv } from '../three/ShowcaseSceneEnv'
import {
  DisplayCase,
  DisplayTable,
  FixtureLabel,
  Pedestal,
  SelectionRing,
  ShelfBank,
  ShelfRow,
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
 * appropriate to their form factor. The camera enters at the front of a
 * central aisle and looks deep into the room. Devices remain interactive
 * (click to open the drawer) and update with the category filter just
 * like in the Showroom.
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
 *                                ↑ camera at [0, 5, 14] looks down -Z
 */
export function ShowcaseScene({ devices, selected, onSelect }: Props) {
  const groups = useMemo(() => groupDevices(devices), [devices])

  // Resolve fixture-local positions for every device so that selection
  // visuals (the floor pool ring) can be parented to the device's
  // world-space ground location even though the device itself is parented
  // to a fixture group.
  const selectionRing = useMemo(() => {
    if (!selected) return null
    return findGroundPositionFor(selected.id, groups)
  }, [selected, groups])

  return (
    <>
      <ShowcaseSceneEnv />
      {/* Inject our own camera + controls so switching here from another
          mode always lands at the front of the aisle, mirroring the
          Finder scene's pattern. */}
      <PerspectiveCamera makeDefault fov={45} position={[0, 5, 14]} />
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
              <DevicePedestal
                device={d}
                position={[0, 0, 0]}
                selected={selected?.id === d.id}
                showLabel={false}
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
          <DevicePedestal
            key={d.id}
            device={d}
            position={[(i - 0.5) * 1.0, 0, 0]}
            selected={selected?.id === d.id}
            showLabel={false}
            onClick={onSelect}
          />
        ))}
      </DisplayTable>
      <DisplayTable position={[2.4, 0, 0.5]} rotationY={0} width={1.6} depth={0.95}>
        {groups.desks[2] && (
          <DevicePedestal
            device={groups.desks[2]}
            position={[0, 0, 0]}
            selected={selected?.id === groups.desks[2].id}
            showLabel={false}
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
        {/* 2 × 3 grid of headsets inside the case */}
        {groups.headsets.slice(0, 6).map((d, i) => {
          const col = i % 3
          const row = Math.floor(i / 3)
          const x = (col - 1) * 0.46
          const z = (row - 0.5) * 0.32
          return (
            <DevicePedestal
              key={d.id}
              device={d}
              position={[x, 0, z]}
              scale={0.36}
              selected={selected?.id === d.id}
              showLabel={false}
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
        {/* Distribute up to 5 cameras across 3 shelves: 2 / 2 / 1 */}
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
                <DevicePedestal
                  key={d.id}
                  device={d}
                  position={[(i - (row.length - 1) / 2) * 0.42, 0, 0]}
                  scale={0.42}
                  selected={selected?.id === d.id}
                  showLabel={false}
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
                <DevicePedestal
                  key={d.id}
                  device={d}
                  position={[(i - (row.length - 1) / 2) * 0.42, 0, 0]}
                  scale={0.42}
                  selected={selected?.id === d.id}
                  showLabel={false}
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
          <DevicePedestal
            key={d.id}
            device={d}
            position={[(i - 0.5) * 0.85, 0, 0]}
            selected={selected?.id === d.id}
            showLabel={false}
            onClick={onSelect}
          />
        ))}
      </DisplayTable>

      {/* Selection ring under the selected device (replaces the showroom
          SpotLight cone, which is invisible against a light scene). */}
      {selectionRing && (
        <SelectionRing
          position={selectionRing.position}
          radius={selectionRing.radius}
        />
      )}
    </>
  )
}

/* ─────────────────── Phones layout ─────────────────── */

/**
 * Phones are split across two display tables so 7 IP/wireless devices
 * never have to crowd onto a single 1.6 m bench.
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
          <DevicePedestal
            key={d.id}
            device={d}
            position={[(i - (tableA.length - 1) / 2) * 0.62, 0, 0]}
            scale={0.55}
            selected={selected?.id === d.id}
            showLabel={false}
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
          <DevicePedestal
            key={d.id}
            device={d}
            position={[(i - (tableB.length - 1) / 2) * 0.6, 0, 0]}
            scale={0.55}
            selected={selected?.id === d.id}
            showLabel={false}
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

/* ─────────────────── selection ring helper ─────────────────── */

interface GroundPos {
  position: [number, number, number]
  radius: number
}

/**
 * Returns the world-space ground position under the selected device's
 * fixture so the {@link SelectionRing} can paint a pool of Cisco-blue
 * directly beneath it. Falling back to the device's category centroid
 * keeps the visual present even if a fixture isn't laid out yet.
 *
 * NOTE: this is a coarse approximation — it mirrors the fixture positions
 * declared above. Keep this in sync when the layout numbers change.
 */
function findGroundPositionFor(
  id: string,
  groups: DeviceGroups,
): GroundPos | null {
  // Boards
  const boardIdx = groups.boards.findIndex((d) => d.id === id)
  if (boardIdx >= 0) {
    const x = boardIdx === 0 ? -3.6 : 3.6
    return { position: [x, 0, -11.5], radius: 1.6 }
  }

  // Bars
  const barIdx = groups.bars.findIndex((d) => d.id === id)
  if (barIdx >= 0) {
    const positions: [number, number, number][] = [
      [-5.5, 0, -7],
      [-1.8, 0, -8.2],
      [5.5, 0, -7],
    ]
    const slot = groups.bars.length === 2 ? [0, 2][barIdx] : barIdx
    return { position: positions[slot] ?? positions[barIdx], radius: 1.0 }
  }

  // Kits
  const kitIdx = groups.kits.findIndex((d) => d.id === id)
  if (kitIdx >= 0) {
    const positions: [number, number, number][] = [
      [-4.2, 0, -3],
      [4.2, 0, -3],
      [0, 0, -3.6],
    ]
    return { position: positions[kitIdx] ?? positions[0], radius: 0.85 }
  }

  // Desks
  const deskIdx = groups.desks.findIndex((d) => d.id === id)
  if (deskIdx >= 0) {
    if (deskIdx < 2) {
      const x = -2.4 + (deskIdx - 0.5) * 1.0
      return { position: [x, 0, 0.5], radius: 0.7 }
    }
    return { position: [2.4, 0, 0.5], radius: 0.7 }
  }

  // Phones
  const phoneIdx = groups.phones.findIndex((d) => d.id === id)
  if (phoneIdx >= 0) {
    const half = Math.ceil(groups.phones.length / 2)
    if (phoneIdx < half) {
      const tableA = groups.phones.slice(0, half)
      const x = -4.6 + (phoneIdx - (tableA.length - 1) / 2) * 0.62
      return { position: [x, 0, 4.5], radius: 0.55 }
    }
    const tableB = groups.phones.slice(half)
    const localIdx = phoneIdx - half
    const x = -2.2 + (localIdx - (tableB.length - 1) / 2) * 0.6
    return { position: [x, 0, 4.5], radius: 0.55 }
  }

  // Headsets — all live inside the display case at (4.2, 0, 4.5)
  if (groups.headsets.some((d) => d.id === id)) {
    return { position: [4.2, 0, 4.5], radius: 1.0 }
  }

  // Cameras — shelf at (8.5, 0, 2)
  if (groups.cameras.some((d) => d.id === id)) {
    return { position: [8.5, 0, 2], radius: 1.0 }
  }

  // Mics — shelf at (-8.5, 0, 2.5)
  if (groups.mics.some((d) => d.id === id)) {
    return { position: [-8.5, 0, 2.5], radius: 1.0 }
  }

  // Navigators — table at (-8.5, 0, -1.5)
  if (groups.navigators.some((d) => d.id === id)) {
    return { position: [-8.5, 0, -1.5], radius: 0.8 }
  }

  return null
}
