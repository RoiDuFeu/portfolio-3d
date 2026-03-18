#include "../lib/noise.glsl"

uniform float u_time;
uniform float u_intensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

void main() {
  vNormal = normalize(normalMatrix * normal);

  // Turbulent displacement for fire surface
  float turb = fbm(position * 3.0 + u_time * 0.8) * 0.2 * u_intensity;
  turb += abs(snoise(position * 6.0 + u_time * 1.5)) * 0.1 * u_intensity;

  vDisplacement = turb;

  vec3 newPosition = position + normal * turb;
  vPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
