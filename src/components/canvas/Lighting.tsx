export function Lighting() {
  return (
    <>
      {/* Subtle ambient fill so planets aren't fully dark on backside */}
      <ambientLight intensity={0.08} color="#334466" />

      {/* Distant background light for stars visibility */}
      <directionalLight
        position={[50, 30, 50]}
        intensity={0.15}
        color="#aabbff"
      />
    </>
  )
}
