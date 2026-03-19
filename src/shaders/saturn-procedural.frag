#include "./lib/noise.glsl"

uniform float u_time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 N = normalize(vNormal);
  vec3 lightDir = normalize(vec3(0.0) - vPosition);

  // === LATITUDE BANDS ===
  // Saturn has less turbulent, more subtle banding than Jupiter
  vec3 localDir = normalize(vPosition);
  float latitude = localDir.y;

  // Main band structure (less pronounced than Jupiter)
  float bands = sin(latitude * 22.0) * 0.5 + 0.5;
  // Subtle noise distortion
  float distortion = snoise(vec3(latitude * 6.0, vPosition.x * 1.5, u_time * 0.01));
  bands += distortion * 0.08;
  bands = clamp(bands, 0.0, 1.0);

  // Sub-bands for fine detail
  float subBands = sin(latitude * 50.0 + distortion * 2.0) * 0.5 + 0.5;
  subBands = smoothstep(0.35, 0.65, subBands);

  // === COLOR PALETTE ===
  // Saturn's pale, butterscotch/cream colors
  vec3 paleGold = vec3(0.94, 0.88, 0.70);
  vec3 cream = vec3(0.96, 0.94, 0.88);
  vec3 butterscotch = vec3(0.86, 0.76, 0.58);
  vec3 lightTan = vec3(0.90, 0.82, 0.68);

  // Band coloring - very subtle
  vec3 color = mix(paleGold, cream, bands);
  color = mix(color, butterscotch, subBands * 0.2);
  color = mix(color, lightTan, smoothstep(0.45, 0.55, bands) * 0.15);

  // === LIGHTING ===
  // Saturn is farther from sun, so softer lighting
  float diffuse = max(dot(N, lightDir), 0.0);
  diffuse = pow(diffuse, 0.7); // very soft atmospheric scattering
  float ambient = 0.15;

  color *= ambient + diffuse * 0.85;

  // Limb darkening
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float limbDark = pow(max(dot(viewDir, N), 0.0), 0.5);
  color *= 0.5 + 0.5 * limbDark;

  gl_FragColor = vec4(color, 1.0);
}
