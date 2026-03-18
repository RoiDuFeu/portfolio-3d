#include "./lib/noise.glsl"

uniform float u_time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 N = normalize(vNormal);
  vec3 lightDir = normalize(vec3(0.0) - vPosition);

  // === NEAR-FEATURELESS with subtle cloud bands ===
  vec3 localDir = normalize(vPosition);
  float latitude = localDir.y;

  // Very gentle banding
  float bands = sin(latitude * 10.0) * 0.5 + 0.5;
  float noise = snoise(vec3(latitude * 4.0, vPosition.x * 1.0, u_time * 0.01));
  bands += noise * 0.06;

  // === COLOR PALETTE (cyan-blue, near uniform) ===
  vec3 paleCyan = vec3(0.60, 0.82, 0.88);
  vec3 teal = vec3(0.45, 0.72, 0.78);
  vec3 iceBlue = vec3(0.70, 0.88, 0.92);

  vec3 color = mix(teal, paleCyan, bands * 0.5 + 0.25);
  color = mix(color, iceBlue, smoothstep(0.6, 0.8, bands) * 0.1);

  // === LIGHTING ===
  float diffuse = max(dot(N, lightDir), 0.0);
  diffuse = pow(diffuse, 0.55);
  float ambient = 0.08;

  color *= ambient + diffuse * 0.92;

  // Limb darkening
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float limbDark = pow(max(dot(viewDir, N), 0.0), 0.35);
  color *= 0.35 + 0.65 * limbDark;

  gl_FragColor = vec4(color, 1.0);
}
