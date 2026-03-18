#include "./lib/noise.glsl"

uniform float u_time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 N = normalize(vNormal);
  vec3 lightDir = normalize(vec3(0.0) - vPosition);

  // === MUTED LATITUDE BANDS ===
  vec3 localDir = normalize(vPosition);
  float latitude = localDir.y;

  // Gentle bands (less contrast than Jupiter)
  float bands = sin(latitude * 14.0) * 0.5 + 0.5;
  float distortion = snoise(vec3(latitude * 6.0, vPosition.x * 1.5, u_time * 0.015));
  bands += distortion * 0.1;
  bands = clamp(bands, 0.0, 1.0);

  float subBands = sin(latitude * 35.0 + distortion * 2.0) * 0.5 + 0.5;
  subBands = smoothstep(0.35, 0.65, subBands);

  // === COLOR PALETTE (pale gold, subtle blue-grey) ===
  vec3 paleGold = vec3(0.88, 0.82, 0.65);
  vec3 cream = vec3(0.94, 0.91, 0.82);
  vec3 blueGrey = vec3(0.65, 0.68, 0.72);
  vec3 warmBand = vec3(0.82, 0.72, 0.55);

  vec3 color = mix(paleGold, cream, bands);
  color = mix(color, blueGrey, subBands * 0.15);
  color = mix(color, warmBand, smoothstep(0.5, 0.7, bands) * 0.15);

  // === LIGHTING ===
  float diffuse = max(dot(N, lightDir), 0.0);
  diffuse = pow(diffuse, 0.6);
  float ambient = 0.1;

  color *= ambient + diffuse * 0.9;

  // Limb darkening
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float limbDark = pow(max(dot(viewDir, N), 0.0), 0.4);
  color *= 0.4 + 0.6 * limbDark;

  gl_FragColor = vec4(color, 1.0);
}
