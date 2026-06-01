import * as THREE from 'three'
import { Environment, MeshReflectorMaterial } from '@react-three/drei'

/**
 * Bright, gallery-style counterpart to {@link SceneEnv}. Where the Showroom
 * uses near-black walls and a single Cisco-blue fill so the carbon-finished
 * brochure photos read on top, the Showcase paints itself in the warm
 * off-white of the Cisco First Light palette: soft fog at the horizon,
 * one warm key + one cool fill, and a polished light-concrete floor that
 * suggests a retail showroom without becoming a mirror.
 */
export function ShowcaseSceneEnv() {
  return (
    <>
      {/* Cisco First Light off-white as the background fill so devices read
          as if shot on a brand-correct seamless. */}
      <color attach="background" args={['#f7f4ef']} />
      {/* Fog matches the background tone so the horizon dissolves softly
          instead of cutting a hard line where the floor disc ends. */}
      <fog attach="fog" args={['#f4f1ec', 14, 40]} />

      {/* Bright ambient so the photo-billboards never fall into shadow,
          even at the edges of the room. */}
      <ambientLight intensity={0.7} />

      {/* Warm key light from above-right, simulating an overhead spot. */}
      <directionalLight
        position={[6, 9, 5]}
        intensity={0.95}
        color="#fff5e8"
        castShadow={false}
      />

      {/* Cool Cisco-blue fill from the opposite side so brand colors
          still register without darkening the off-white palette. */}
      <directionalLight
        position={[-7, 5, -2]}
        intensity={0.35}
        color="#cfe7f5"
      />

      {/* drei's "apartment" HDR gives crisp white walls and neutral
          highlights — "city" reads slightly yellow on a light scene,
          and "warehouse" loses the brand-correct off-white feel. */}
      <Environment preset="apartment" />

      <ShowcaseFloor />
    </>
  )
}

/**
 * Polished light-concrete floor — large enough to fill the showcase aisle
 * without exposing the edge under normal orbit angles. Uses
 * MeshReflectorMaterial at a deliberately low mixStrength so reflections
 * are present as a hint of polish, not a mirror.
 */
function ShowcaseFloor() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[60, 60]} />
      <MeshReflectorMaterial
        color="#e8e6e1"
        roughness={0.88}
        metalness={0.08}
        blur={[300, 80]}
        resolution={512}
        mixBlur={1.4}
        mixStrength={0.25}
        mixContrast={1}
        mirror={0.18}
        depthScale={0.3}
        minDepthThreshold={0.7}
        maxDepthThreshold={1.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
