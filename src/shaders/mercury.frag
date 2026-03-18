#include "./lib/noise.glsl"

uniform float u_time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 N = normalize(vNormal);
  vec3 lightDir = normalize(vec3(0.0) - vPosition); // light from Sun at origin

  // === CRATER TERRAIN ===
  // Large crater basins
  float craters1 = snoise(vPosition * 3.0);
  craters1 = smoothstep(0.3, 0.5, craters1); // round crater rims

  // Medium craters
  float craters2 = snoise(vPosition * 8.0 + 50.0);
  craters2 = smoothstep(0.35, 0.55, craters2);

  // Fine surface roughness
  float roughness = snoise(vPosition * 20.0 + 100.0) * 0.15;

  float terrain = craters1 * 0.5 + craters2 * 0.35 + roughness;

  // === COLOR PALETTE (grey/brown rock) ===
  vec3 darkRock = vec3(0.18, 0.16, 0.14);
  vec3 lightRock = vec3(0.45, 0.42, 0.38);
  vec3 craterFloor = vec3(0.12, 0.11, 0.10);

  vec3 color = mix(darkRock, lightRock, terrain);
  color = mix(color, craterFloor, craters1 * 0.4);

  // === LIGHTING (harsh, no atmosphere) ===
  float diffuse = max(dot(N, lightDir), 0.0);
  // Mercury has extreme terminator — sharp day/night
  diffuse = pow(diffuse, 0.8);
  float ambient = 0.03; // almost no ambient (no atmosphere)

  color *= ambient + diffuse * 0.97;

  gl_FragColor = vec4(color, 1.0);
}
