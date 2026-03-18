#include "../lib/noise.glsl"

uniform float u_craterStrength;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocalPosition;
varying float vElevation;

void main() {
  vLocalPosition = position;

  // Subtle crater-like displacement — much gentler than planet terrain
  vec3 samplePos = position * 4.0;
  float large = fbm(samplePos) * 0.4;
  float medium = snoise(samplePos * 3.0) * 0.15;

  float rawNoise = large + medium;

  // Craters: gentle depressions, not spiky mountains
  float craterMask = smoothstep(-0.2, 0.15, rawNoise);
  float disp = mix(-0.5, rawNoise, craterMask) * u_craterStrength * 0.015;

  vElevation = clamp(disp / max(u_craterStrength * 0.015, 0.001) * 0.5 + 0.5, 0.0, 1.0);

  vec3 newPosition = position + normal * disp;

  // Gentle normal perturbation for shading detail (not displacement)
  float eps = 0.02;
  float dx = fbm((position + vec3(eps, 0.0, 0.0)) * 4.0) - fbm((position - vec3(eps, 0.0, 0.0)) * 4.0);
  float dy = fbm((position + vec3(0.0, eps, 0.0)) * 4.0) - fbm((position - vec3(0.0, eps, 0.0)) * 4.0);
  float dz = fbm((position + vec3(0.0, 0.0, eps)) * 4.0) - fbm((position - vec3(0.0, 0.0, eps)) * 4.0);
  vec3 perturbedNormal = normalize(normal - u_craterStrength * 0.3 * vec3(dx, dy, dz));

  vNormal = normalize(normalMatrix * perturbedNormal);
  vPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
