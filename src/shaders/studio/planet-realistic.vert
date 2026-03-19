#include "../lib/noise.glsl"

uniform float u_time;
uniform float u_displacement;
uniform float u_noiseFrequency;
uniform float u_noiseSeed;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocalPosition;
varying float vElevation;
varying float vLatitude;
varying vec2 vUv;
varying vec3 vPixelPosition;
varying vec3 vVertexPosition;

void main() {
  vLocalPosition = position;
  vNormal = normalize(normalMatrix * normal);

  // FBM terrain displacement (identique au mode procédural)
  vec3 samplePos = position * u_noiseFrequency + u_noiseSeed;
  float disp = fbm(samplePos + u_time * 0.02) * u_displacement;
  disp += snoise(samplePos * 2.0 + 10.0) * u_displacement * 0.3;

  // Normalize elevation to 0–1
  vElevation = clamp((disp / max(u_displacement, 0.001)) * 0.5 + 0.5, 0.0, 1.0);

  // Latitude: 0 at equator, 1 at poles
  vec3 normPos = normalize(position);
  vLatitude = abs(normPos.y);

  // UV mapping (spherical projection)
  vUv = vec2(
    0.5 + atan(normPos.z, normPos.x) / (2.0 * 3.14159265),
    0.5 - asin(normPos.y) / 3.14159265
  );

  vec3 newPosition = position + normal * disp;
  vPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
  vPixelPosition = vPosition;

  vec4 finalVertexPosition = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  vVertexPosition = vec3(finalVertexPosition);

  gl_Position = finalVertexPosition;
}
