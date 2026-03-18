#include "../lib/noise.glsl"

uniform float u_time;
uniform float u_waveAmplitude;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);

  // Gentle wave displacement
  float wave = snoise(position * 3.0 + u_time * 0.8) * u_waveAmplitude;
  wave += snoise(position * 6.0 + u_time * 1.2) * u_waveAmplitude * 0.3;

  vec3 newPosition = position + normal * wave;
  vPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
