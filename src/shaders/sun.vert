#include "./lib/noise.glsl"

uniform float u_time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Turbulent surface displacement — boiling plasma (3 octaves)
  float displacement = snoise(position * 1.8 + u_time * 0.15) * 0.10;
  displacement += snoise(position * 3.5 + u_time * 0.25) * 0.05;
  displacement += snoise(position * 7.0 + u_time * 0.4) * 0.025;

  vec3 newPosition = position + normal * displacement;
  vPosition = newPosition;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
