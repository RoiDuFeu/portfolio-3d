uniform float u_sunRadius;
uniform float u_haloRadius;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float dist = length(vWorldPos);
  float normalizedDist = dist / u_haloRadius;

  // === PURE EXPONENTIAL FALLOFF (no hard edge) ===
  // This decays smoothly to near-zero — no visible geometry boundary
  float glow = exp(-normalizedDist * 3.0);

  // Stronger near the sun
  float innerGlow = exp(-normalizedDist * 8.0);

  // === FRESNEL (BackSide rendering) ===
  float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), 1.5);

  // Combine: inner is bright, outer fades exponentially
  float intensity = glow * 0.15 + innerGlow * 0.25;
  intensity *= mix(0.4, 1.0, fresnel);

  // === WARM AMBER COLOR (orange, not white) ===
  vec3 innerColor = vec3(1.0, 0.75, 0.35);   // warm amber-orange
  vec3 outerColor = vec3(0.8, 0.4, 0.08);    // deep orange

  vec3 color = mix(innerColor, outerColor, smoothstep(0.0, 0.5, normalizedDist));

  // Clamp alpha low — this is subtle fog, not a solid
  intensity = clamp(intensity, 0.0, 0.2);

  gl_FragColor = vec4(color, intensity);
}
