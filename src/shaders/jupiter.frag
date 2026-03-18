#include "./lib/noise.glsl"

uniform float u_time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 N = normalize(vNormal);
  vec3 lightDir = normalize(vec3(0.0) - vPosition);

  // === LATITUDE BANDS ===
  // Use spherical Y coordinate for banding
  vec3 localDir = normalize(vPosition);
  float latitude = localDir.y;

  // Main band structure
  float bands = sin(latitude * 18.0) * 0.5 + 0.5;
  // Noise distortion of bands (turbulent edges)
  float distortion = snoise(vec3(latitude * 8.0, vPosition.x * 2.0, u_time * 0.02));
  bands += distortion * 0.15;
  bands = clamp(bands, 0.0, 1.0);

  // Sub-bands for detail
  float subBands = sin(latitude * 45.0 + distortion * 3.0) * 0.5 + 0.5;
  subBands = smoothstep(0.3, 0.7, subBands);

  // === GREAT RED SPOT ===
  // Approximate position: -22° latitude, drifting in longitude
  float spotLat = -0.37; // ~-22 degrees
  float spotLon = u_time * 0.01 + 1.5; // slowly drifting
  float angle = atan(localDir.z, localDir.x);

  float dLat = (latitude - spotLat) * 8.0;
  float dLon = angle - spotLon;
  // Wrap longitude
  dLon = dLon - 6.2832 * floor((dLon + 3.1416) / 6.2832);
  dLon *= 5.0;

  float spotDist = dLat * dLat + dLon * dLon;
  float spot = smoothstep(3.0, 0.5, spotDist);

  // Vortex swirl inside the spot
  float swirl = snoise(vec3(dLon * 2.0 + u_time * 0.05, dLat * 2.0, u_time * 0.03));
  spot *= (0.8 + swirl * 0.2);

  // === COLOR PALETTE ===
  vec3 tan = vec3(0.82, 0.72, 0.55);
  vec3 cream = vec3(0.92, 0.88, 0.78);
  vec3 rustyRed = vec3(0.72, 0.42, 0.28);
  vec3 brown = vec3(0.55, 0.38, 0.25);
  vec3 spotColor = vec3(0.78, 0.35, 0.2);

  // Band coloring
  vec3 color = mix(tan, cream, bands);
  color = mix(color, brown, subBands * 0.3);
  color = mix(color, rustyRed, smoothstep(0.4, 0.6, bands) * 0.2);

  // Apply Great Red Spot
  color = mix(color, spotColor, spot * 0.7);

  // === LIGHTING ===
  float diffuse = max(dot(N, lightDir), 0.0);
  diffuse = pow(diffuse, 0.6); // soft atmospheric scattering
  float ambient = 0.12;

  color *= ambient + diffuse * 0.88;

  // Limb darkening
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float limbDark = pow(max(dot(viewDir, N), 0.0), 0.4);
  color *= 0.4 + 0.6 * limbDark;

  gl_FragColor = vec4(color, 1.0);
}
