import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Device } from '../data/cisco'
import { deviceImage } from '../data/deviceImages'

/**
 * Fixture primitive library for the Workspace Showcase.
 *
 * Each fixture is a small, parametric piece of furniture (table, wall,
 * glass case, shelf bank, plinth) with a `children` slot used by the
 * scene to position devices inside the fixture's local frame. Everything
 * is built from `MeshStandardMaterial` (or `MeshPhysicalMaterial` for the
 * glass case) so we avoid bringing in new dependencies — the look comes
 * from carefully picked colors, roughness, and metalness.
 */

/* ─────────────────── shared types ─────────────────── */

interface FixtureProps {
  position?: [number, number, number]
  rotationY?: number
  children?: ReactNode
}

/* ─────────────────── DisplayTable ─────────────────── */

interface DisplayTableProps extends FixtureProps {
  /** Width along local X. Default 1.6 m. */
  width?: number
  /** Depth along local Z. Default 0.9 m. */
  depth?: number
  /** Top height in world units. Default 0.75 m. */
  topHeight?: number
}

/**
 * A 1.6 × 0.75 × 0.9 m display plinth: off-white tabletop, brushed-grey
 * legs. Children are rendered in the table's local frame, with the
 * tabletop surface at local Y = `topHeight`.
 */
export function DisplayTable({
  position = [0, 0, 0],
  rotationY = 0,
  width = 1.6,
  depth = 0.9,
  topHeight = 0.75,
  children,
}: DisplayTableProps) {
  const topThickness = 0.05
  const legSize = 0.06
  const legInset = 0.07

  // Compute leg positions just inside each tabletop corner.
  const legX = width / 2 - legInset - legSize / 2
  const legZ = depth / 2 - legInset - legSize / 2
  const legY = (topHeight - topThickness) / 2
  const legHeight = topHeight - topThickness

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Tabletop */}
      <mesh
        position={[0, topHeight - topThickness / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, topThickness, depth]} />
        <meshStandardMaterial color="#f0eee9" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* Slim apron under the top for a built-in retail-bench feel */}
      <mesh position={[0, topHeight - topThickness - 0.02, 0]}>
        <boxGeometry args={[width * 0.94, 0.03, depth * 0.92]} />
        <meshStandardMaterial color="#e2dfd8" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Cisco-blue trim along the front edge of the apron — defines
          the bench visually and adds a brand cue without competing
          with the products on top. */}
      <mesh
        position={[
          0,
          topHeight - topThickness - 0.04,
          depth / 2 + 0.001,
        ]}
      >
        <boxGeometry args={[width * 0.94, 0.005, 0.01]} />
        <meshStandardMaterial
          color="#049FD9"
          roughness={0.4}
          metalness={0.3}
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* Four brushed-metal legs */}
      {[
        [legX, legY, legZ],
        [-legX, legY, legZ],
        [legX, legY, -legZ],
        [-legX, legY, -legZ],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[legSize, legHeight, legSize]} />
          <meshStandardMaterial
            color="#cfd1d3"
            roughness={0.45}
            metalness={0.6}
          />
        </mesh>
      ))}
      {/* Contact shadow under the table */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.32}
        scale={Math.max(width, depth) * 1.6}
        blur={2.4}
        far={1.2}
        resolution={256}
      />
      {/* Children render in the table's local frame; scene positions
          them on top using `topHeight` as the reference. */}
      <group position={[0, topHeight, 0]}>{children}</group>
    </group>
  )
}

/* ─────────────────── WallMount ─────────────────── */

interface WallMountProps extends FixtureProps {
  /** Wall width along local X. Default 3 m. */
  width?: number
  /** Wall height along local Y. Default 2.4 m. */
  height?: number
}

/**
 * A short stretch of wall (3 × 2.4 m, 0.05 m thick) tinted to match the
 * showcase floor. The wall surface faces +Z in local space, so the parent
 * can rotate the whole fixture to point it at the aisle. Children render
 * in front of the wall (Z slightly positive) — typically a {@link
 * WallMountedDevice}.
 */
export function WallMount({
  position = [0, 0, 0],
  rotationY = 0,
  width = 3,
  height = 2.4,
  children,
}: WallMountProps) {
  const thickness = 0.06
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Floor skirting line under the wall — a hairline darker strip
          so the wall reads as anchored to the ground. */}
      <mesh position={[0, 0.04, thickness / 2]}>
        <boxGeometry args={[width, 0.08, 0.02]} />
        <meshStandardMaterial color="#d8d5cd" roughness={0.8} />
      </mesh>
      {/* The wall plane itself */}
      <mesh
        position={[0, height / 2, 0]}
        castShadow={false}
        receiveShadow
      >
        <boxGeometry args={[width, height, thickness]} />
        <meshStandardMaterial
          color="#ece9e3"
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>
      {/* Subtle vertical Cisco-blue accent stripe near one edge — a
          small "this is a Cisco fixture" cue without painting the
          whole wall. Sits flush against the wall front. */}
      <mesh
        position={[
          -width / 2 + 0.18,
          height * 0.45,
          thickness / 2 + 0.006,
        ]}
      >
        <boxGeometry args={[0.04, height * 0.8, 0.012]} />
        <meshStandardMaterial
          color="#049FD9"
          roughness={0.4}
          metalness={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Children sit slightly in front of the wall so their plane
          doesn't z-fight with the wall geometry. */}
      <group position={[0, 0, thickness / 2 + 0.01]}>{children}</group>
    </group>
  )
}

/* ─────────────────── WallMountedDevice ─────────────────── */

interface WallMountedDeviceProps {
  device: Device
  /** Local X position on the parent wall. Default 0. */
  x?: number
  /** Local Y position (mount height) on the wall. Default 1.4 m. */
  y?: number
  /** Longest-edge size in world units. Default scales by device.size. */
  targetSize?: number
  selected?: boolean
  onClick?: (d: Device) => void
}

/**
 * A photo-billboard variant that does NOT follow the camera — it stays
 * locked to the wall surface so wall-mounted devices read as physically
 * mounted instead of "stickers" that pivot. Falls back to a primitive
 * fallback mesh if the photo asset is unavailable.
 */
export function WallMountedDevice({
  device,
  x = 0,
  y = 1.4,
  targetSize,
  selected = false,
  onClick,
}: WallMountedDeviceProps) {
  const imageUrl = deviceImage(device.id)
  const longest = Math.max(device.size[0], device.size[1])
  // Boards naturally want to be ~1.6–1.9m tall on the wall; bars are
  // much smaller (~1m wide). Clamp to a reasonable range.
  const size = targetSize ?? Math.max(0.8, Math.min(2.2, longest * 1.15))

  if (!imageUrl) {
    return (
      <FallbackPanel
        position={[x, y, 0]}
        size={size}
        color={device.surface}
        selected={selected}
        onClick={onClick ? () => onClick(device) : undefined}
      />
    )
  }

  return (
    <PhotoPanel
      url={imageUrl}
      position={[x, y, 0]}
      size={size}
      selected={selected}
      onClick={onClick ? () => onClick(device) : undefined}
    />
  )
}

/* ─────────────────── ShowcaseDevice ─────────────────── */

interface ShowcaseDeviceProps {
  device: Device
  /** Local position on the parent fixture surface (Y=0 = surface). */
  position?: [number, number, number]
  /** Multiplier on the device's natural longest-edge size. */
  scale?: number
  selected?: boolean
  onClick?: (d: Device) => void
}

/**
 * In-fixture device card. Replaces {@link DevicePedestal} for the
 * Showcase view's tables, shelves, cases, and pedestals.
 *
 * Three deliberate differences from {@link DevicePedestal}:
 *
 *   1. Bottom-anchored. The photo plane's bottom edge sits at the
 *      caller-provided Y=0 surface regardless of aspect ratio, so a
 *      wide phone or a tall phone both visibly rest on the table.
 *   2. Fixed orientation. No `<Billboard>` follow-camera pivot — the
 *      parent fixture's `rotationY` controls which way the card faces.
 *      Devices visibly sit on their fixtures even when orbiting.
 *   3. No 0.7 m floor on size. Earbuds at 0.07 m read as earbuds; a
 *      Board Pro at 1.3 m reads as a board.
 *
 * Selection visuals (contact shadow + Cisco-blue floor pool ring) are
 * rendered inline so the global SelectionRing helper isn't needed.
 */
export function ShowcaseDevice({
  device,
  position = [0, 0, 0],
  scale = 1,
  selected = false,
  onClick,
}: ShowcaseDeviceProps) {
  const url = deviceImage(device.id)
  // Honest sizing — no 0.7 m floor; clamp only to keep a board from
  // exceeding the fixture or an earbud from collapsing into a dot.
  const realSize = Math.max(device.size[0], device.size[1])
  const targetSize = THREE.MathUtils.clamp(realSize * scale, 0.08, 2.4)

  const [texture, setTexture] = useState<THREE.Texture | null>(() =>
    url ? (textureCache.get(url) ?? null) : null,
  )

  useEffect(() => {
    if (!url) return
    let alive = true
    // loadTexture already short-circuits to the cached texture via
    // Promise.resolve(), so we don't need a synchronous fast-path
    // here (which would trip react-hooks/set-state-in-effect).
    loadTexture(url)
      .then((t) => {
        if (alive) setTexture(t)
      })
      .catch(() => {
        if (alive) setTexture(null)
      })
    return () => {
      alive = false
    }
  }, [url])

  const [planeW, planeH] = useMemo<[number, number]>(() => {
    const image = texture?.image as
      | { width?: number; height?: number }
      | undefined
    if (!image?.width || !image?.height) {
      // While the texture loads, render to expected aspect — devices
      // are mostly wider than tall, so default to a 4:3-ish footprint.
      return [targetSize, targetSize * 0.75]
    }
    const aspect = image.width / image.height
    if (aspect >= 1) return [targetSize, targetSize / aspect]
    return [targetSize * aspect, targetSize]
  }, [texture, targetSize])

  // No image at all → primitive fallback. Does NOT camera-face.
  if (!url) {
    return (
      <FallbackBox
        device={device}
        position={position}
        scale={scale}
        selected={selected}
        onClick={onClick}
      />
    )
  }

  // Texture still loading — render nothing rather than a stretched
  // placeholder, mirroring the PhotoBillboard convention.
  if (!texture) return null

  // Floor-pool ring sized to fit just outside the contact shadow's
  // longest dimension. Floor a minimum so tiny earbuds still read.
  const ringOuter = Math.max(planeW * 0.5, 0.08)
  const ringInner = ringOuter * 0.82

  return (
    <group
      position={position}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation()
              onClick(device)
            }
          : undefined
      }
      onPointerOver={
        onClick
          ? (e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }
          : undefined
      }
      onPointerOut={
        onClick
          ? (e) => {
              e.stopPropagation()
              document.body.style.cursor = ''
            }
          : undefined
      }
    >
      {/* Localized contact shadow on the surface beneath the card.
          A flattened circle reads softer than a hard rectangle and
          costs nothing extra. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.0005, 0]}
        scale={[1, 0.5, 1]}
      >
        <circleGeometry args={[planeW * 0.35, 32]} />
        <meshBasicMaterial
          color="#000"
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>
      {/* Selection ring on the surface, just outside the contact
          shadow. Cisco blue, opacity ~0.55 to match the showcase
          selection palette. */}
      {selected && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.0008, 0]}
          renderOrder={4}
        >
          <ringGeometry args={[ringInner, ringOuter, 64]} />
          <meshBasicMaterial
            color="#049FD9"
            transparent
            opacity={0.55}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {/* Card body — gives the photo physical thickness and a
          believable rim where it meets the surface. The body is
          slightly inset from the photo so the photo's silhouette
          reads against the dark card. */}
      <mesh
        position={[0, planeH / 2 + 0.001, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[planeW * 0.95, planeH * 0.95, 0.025]} />
        <meshStandardMaterial
          color="#2a2d33"
          roughness={0.55}
          metalness={0.2}
        />
      </mesh>
      {/* Photo plane on the front face of the card */}
      <mesh position={[0, planeH / 2 + 0.001, 0.013]}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.5}
          depthWrite
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

/**
 * Tiny primitive fallback for {@link ShowcaseDevice} when no brochure
 * photo is available. Bottom-anchored to local Y=0 with a localized
 * contact shadow, so it still reads as physically resting on the
 * fixture surface.
 */
function FallbackBox({
  device,
  position,
  scale,
  selected,
  onClick,
}: {
  device: Device
  position: [number, number, number]
  scale: number
  selected: boolean
  onClick?: (d: Device) => void
}) {
  const w = THREE.MathUtils.clamp(device.size[0] * scale, 0.05, 1.5)
  const h = THREE.MathUtils.clamp(device.size[1] * scale, 0.05, 1.5)
  const d = THREE.MathUtils.clamp(
    Math.max(device.size[2] ?? 0.05, 0.05) * scale,
    0.02,
    0.6,
  )

  return (
    <group
      position={position}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation()
              onClick(device)
            }
          : undefined
      }
    >
      {/* contact shadow */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.0005, 0]}
        scale={[1, 0.6, 1]}
      >
        <circleGeometry args={[Math.max(w, d) * 0.7, 32]} />
        <meshBasicMaterial
          color="#000"
          transparent
          opacity={0.26}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, h / 2 + 0.001, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={device.surface}
          emissive={selected ? '#049FD9' : '#000000'}
          emissiveIntensity={selected ? 0.18 : 0}
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>
    </group>
  )
}

/* ─────────────────── DisplayCase ─────────────────── */

interface DisplayCaseProps extends FixtureProps {
  width?: number
  height?: number
  depth?: number
}

/**
 * Glass case ~1.0 × 0.7 × 0.4 m on a small base. The "glass" uses
 * {@link THREE.MeshPhysicalMaterial} with high `transmission` and low
 * `roughness` so light passes through — without piling on extra deps.
 * Children render inside the case, in the case's local frame with the
 * base surface at local Y = 0.
 */
export function DisplayCase({
  position = [0, 0, 0],
  rotationY = 0,
  width = 1.0,
  height = 0.7,
  depth = 0.4,
  children,
}: DisplayCaseProps) {
  const baseHeight = 0.85
  const wallThickness = 0.015

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base plinth */}
      <mesh
        position={[0, baseHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width + 0.08, baseHeight, depth + 0.08]} />
        <meshStandardMaterial
          color="#e8e6e0"
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>
      {/* Cisco-blue trim band around the top of the plinth — a thin
          retail-fixture detail that visually separates the plinth
          from the glass case sitting on top. */}
      <mesh position={[0, baseHeight - 0.005, 0]}>
        <boxGeometry args={[width + 0.085, 0.008, depth + 0.085]} />
        <meshStandardMaterial
          color="#049FD9"
          roughness={0.4}
          metalness={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* Glass cube on top of the base. We render six thin panes to keep
          the highlights crisp without using a hollow shell shader. */}
      <group position={[0, baseHeight, 0]}>
        {/* Bottom (clear) — children sit on top of this */}
        <mesh position={[0, wallThickness / 2, 0]} receiveShadow>
          <boxGeometry args={[width, wallThickness, depth]} />
          <meshStandardMaterial
            color="#dfdcd6"
            roughness={0.4}
            metalness={0.15}
          />
        </mesh>
        {/* Four sides + top */}
        {(
          [
            [0, height / 2, depth / 2, width, height, wallThickness], // front
            [0, height / 2, -depth / 2, width, height, wallThickness], // back
            [-width / 2, height / 2, 0, wallThickness, height, depth], // left
            [width / 2, height / 2, 0, wallThickness, height, depth], // right
            [0, height, 0, width, wallThickness, depth], // top
          ] as [number, number, number, number, number, number][]
        ).map(([px, py, pz, sx, sy, sz], i) => (
          <mesh key={i} position={[px, py, pz]}>
            <boxGeometry args={[sx, sy, sz]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transparent
              opacity={0.18}
              transmission={0.95}
              roughness={0.05}
              metalness={0}
              ior={1.4}
              thickness={0.3}
              clearcoat={1}
              clearcoatRoughness={0.05}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        {/* Items inside the case: positioned in case-local frame, with
            Y=0 at the inside floor (above the glass bottom). */}
        <group position={[0, wallThickness + 0.005, 0]}>{children}</group>
      </group>
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.34}
        scale={Math.max(width, depth) * 1.8 + 0.4}
        blur={2.6}
        far={1.4}
        resolution={256}
      />
    </group>
  )
}

/* ─────────────────── ShelfBank ─────────────────── */

interface ShelfBankProps extends FixtureProps {
  width?: number
  height?: number
  depth?: number
}

/**
 * A bookshelf-like unit (~1.4 × 1.6 × 0.4 m) with three horizontal
 * shelves. Children are positioned in shelf-local frames. We don't
 * auto-place children — scene code is responsible for emitting one or
 * more {@link ShelfRow} groups inside a {@link ShelfBank}.
 */
export function ShelfBank({
  position = [0, 0, 0],
  rotationY = 0,
  width = 1.4,
  height = 1.6,
  depth = 0.4,
  children,
}: ShelfBankProps) {
  const shelfThickness = 0.025
  const sideThickness = 0.04
  const backThickness = 0.02

  // Floor → top: three shelves at Y = 0.55, 1.0, 1.45 (relative to fixture base)
  const shelfYs = [0.55, 1.0, 1.45]

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Left side panel */}
      <mesh
        position={[-width / 2 + sideThickness / 2, height / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[sideThickness, height, depth]} />
        <meshStandardMaterial
          color="#e3e0d9"
          roughness={0.7}
          metalness={0.04}
        />
      </mesh>
      {/* Right side panel */}
      <mesh
        position={[width / 2 - sideThickness / 2, height / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[sideThickness, height, depth]} />
        <meshStandardMaterial
          color="#e3e0d9"
          roughness={0.7}
          metalness={0.04}
        />
      </mesh>
      {/* Back panel (lightly recessed) */}
      <mesh position={[0, height / 2, -depth / 2 + backThickness / 2]}>
        <boxGeometry args={[width - sideThickness * 2, height, backThickness]} />
        <meshStandardMaterial
          color="#ece9e3"
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>
      {/* Three horizontal shelves */}
      {shelfYs.map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, 0]} receiveShadow>
            <boxGeometry
              args={[width - sideThickness * 2, shelfThickness, depth - 0.02]}
            />
            <meshStandardMaterial
              color="#f0eee9"
              roughness={0.55}
              metalness={0.05}
            />
          </mesh>
          {/* Cisco-blue label strip along the front edge of each
              shelf — the retail "shelf trim" we read at first glance
              when walking past a fixture. */}
          <mesh position={[0, y, depth / 2 - 0.008]}>
            <boxGeometry
              args={[width - sideThickness * 2, 0.006, 0.005]}
            />
            <meshStandardMaterial
              color="#049FD9"
              roughness={0.4}
              metalness={0.3}
              transparent
              opacity={0.55}
            />
          </mesh>
        </group>
      ))}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.3}
        scale={Math.max(width, depth) * 1.8}
        blur={2.4}
        far={1.2}
        resolution={256}
      />
      {children}
    </group>
  )
}

/**
 * Helper marker for shelf rows — the scene wraps children that should
 * appear on a specific shelf in this group, with `y` matching one of the
 * shelf Y values (0.55 / 1.0 / 1.45).
 */
export function ShelfRow({
  y,
  children,
}: {
  y: number
  children: ReactNode
}) {
  return <group position={[0, y, 0]}>{children}</group>
}

/* ─────────────────── Pedestal ─────────────────── */

interface PedestalProps extends FixtureProps {
  width?: number
  height?: number
  depth?: number
}

/**
 * A simple square plinth ~0.5 × 1.0 × 0.5 m for taller floor-stand
 * devices that already include their own stand or codec chassis. Children
 * render with their local origin on top of the plinth.
 */
export function Pedestal({
  position = [0, 0, 0],
  rotationY = 0,
  width = 0.55,
  height = 1.0,
  depth = 0.55,
  children,
}: PedestalProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color="#ebe8e2"
          roughness={0.6}
          metalness={0.06}
        />
      </mesh>
      {/* Subtle base trim */}
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[width + 0.06, 0.02, depth + 0.06]} />
        <meshStandardMaterial color="#d6d3cc" roughness={0.7} />
      </mesh>
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.34}
        scale={Math.max(width, depth) * 2.4}
        blur={2.2}
        far={1.2}
        resolution={256}
      />
      <group position={[0, height, 0]}>{children}</group>
    </group>
  )
}

/* ─────────────────── FixtureLabel ─────────────────── */

/**
 * HTML pill overhead label, similar to RingLabel in the Showroom but
 * styled for a light background: white pill, dark text, Cisco-blue
 * accent border.
 */
export function FixtureLabel({
  label,
  position,
}: {
  label: string
  position: [number, number, number]
}) {
  return (
    <Html
      position={position}
      center
      distanceFactor={10}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[1, 0]}
    >
      <div
        style={{
          padding: '6px 12px',
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(4, 159, 217, 0.75)',
          color: '#0a1a2a',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 700,
          backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 16px rgba(20, 30, 50, 0.12)',
        }}
      >
        {label}
      </div>
    </Html>
  )
}

/* ─────────────────── SelectionRing ─────────────────── */

interface SelectionRingProps {
  position: [number, number, number]
  radius?: number
}

/**
 * Cisco-blue floor-pool ring used as the showcase's selection visual.
 * The Showroom's volumetric SpotLight cone is invisible against the
 * off-white walls here, so we substitute a flat ring on the ground
 * directly under the selected fixture. The ring is rendered with
 * `renderOrder` set high so it always reads over the polished floor.
 */
export function SelectionRing({
  position,
  radius = 0.9,
}: SelectionRingProps) {
  return (
    <mesh
      position={[position[0], position[1] + 0.006, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={4}
    >
      <ringGeometry args={[radius * 0.85, radius, 96]} />
      <meshBasicMaterial
        color="#049fd9"
        transparent
        opacity={0.6}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/* ─────────────────── Internal helpers ─────────────────── */

interface PhotoPanelProps {
  url: string
  position: [number, number, number]
  size: number
  selected?: boolean
  onClick?: () => void
}

const loader = new THREE.TextureLoader()
loader.setCrossOrigin('anonymous')
const textureCache = new Map<string, THREE.Texture>()

function loadTexture(url: string): Promise<THREE.Texture> {
  const existing = textureCache.get(url)
  if (existing) return Promise.resolve(existing)
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 8
        t.minFilter = THREE.LinearMipmapLinearFilter
        t.generateMipmaps = true
        textureCache.set(url, t)
        resolve(t)
      },
      undefined,
      reject,
    )
  })
}

/**
 * Wall-locked photo "board" with real physical depth. Renders a thin
 * bezel/body box flush against the wall, the product photo on the
 * front face of the bezel, a soft drop shadow on the wall behind, and
 * a selection halo that peeks out around the bezel edge. The whole
 * group is fully oriented by its parent (so the wall-mount fixture's
 * `rotationY` controls which way the board faces).
 */
function PhotoPanel({ url, position, size, selected, onClick }: PhotoPanelProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(
    () => textureCache.get(url) ?? null,
  )

  useEffect(() => {
    let alive = true
    if (textureCache.get(url)) {
      setTexture(textureCache.get(url)!)
      return
    }
    loadTexture(url)
      .then((t) => {
        if (alive) setTexture(t)
      })
      .catch(() => {
        if (alive) setTexture(null)
      })
    return () => {
      alive = false
    }
  }, [url])

  const [planeW, planeH] = useMemo<[number, number]>(() => {
    const image = texture?.image as
      | { width?: number; height?: number }
      | undefined
    if (!image?.width || !image?.height) return [size, size]
    const aspect = image.width / image.height
    if (aspect >= 1) return [size, size / aspect]
    return [size * aspect, size]
  }, [texture, size])

  if (!texture) return null

  return (
    <group
      position={position}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation()
              onClick()
            }
          : undefined
      }
      onPointerOver={
        onClick
          ? (e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }
          : undefined
      }
      onPointerOut={
        onClick
          ? (e) => {
              e.stopPropagation()
              document.body.style.cursor = ''
            }
          : undefined
      }
    >
      {/* Soft drop shadow on the wall behind/around the board. Sits
          flush with the wall surface, extends slightly beyond the
          bezel so a halo of darker tone visibly anchors the board. */}
      <mesh position={[0, 0, -0.008]}>
        <planeGeometry args={[planeW * 1.15, planeH * 1.18]} />
        <meshBasicMaterial
          color="#000"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      {/* Selection halo — Cisco-blue glow visible around the bezel
          edge when the board is the selected device. Sits in front
          of the drop shadow but behind the bezel back face. */}
      {selected && (
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[planeW * 1.08, planeH * 1.12]} />
          <meshBasicMaterial
            color="#049FD9"
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Bezel / body — the visible thickness of the board against
          the wall. 0.045 m is a believable real-board depth. */}
      <mesh position={[0, 0, 0.022]} castShadow receiveShadow>
        <boxGeometry args={[planeW * 1.02, planeH * 1.02, 0.045]} />
        <meshStandardMaterial
          color="#15171c"
          roughness={0.45}
          metalness={0.35}
        />
      </mesh>
      {/* Photo on the front face of the bezel. alphaTest=0.5 cleanly
          discards the brochure background so the rim of the device
          reads against the dark bezel beneath, not the wall. */}
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.5}
          depthWrite
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Brushed-metal mounting bracket bar visible along the bottom
          edge — a small "this is mounted" cue. */}
      <mesh
        position={[
          0,
          -planeH * 0.51 - 0.0075,
          0.025,
        ]}
      >
        <boxGeometry args={[planeW * 0.6, 0.015, 0.03]} />
        <meshStandardMaterial
          color="#cfd1d3"
          roughness={0.45}
          metalness={0.6}
        />
      </mesh>
    </group>
  )
}

/**
 * Minimal fallback for wall-mounted devices without a brochure photo.
 * Renders a flat colored panel with rounded proportions, so the
 * fixture's slot is never empty.
 */
function FallbackPanel({
  position,
  size,
  color,
  selected,
  onClick,
}: {
  position: [number, number, number]
  size: number
  color: string
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <mesh
      position={position}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation()
              onClick()
            }
          : undefined
      }
    >
      <planeGeometry args={[size, size * 0.62]} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? '#049FD9' : '#000000'}
        emissiveIntensity={selected ? 0.18 : 0}
        roughness={0.55}
        metalness={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
