#include "./lib/noise.glsl"

uniform float u_time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 N = normalize(vNormal);
  vec3 lightDir = normalize(vec3(0.0) - vPosition);

  // === THICK CLOUD LAYERS ===
  // Layer 1: large banded swirls
  vec3 warp1 = vPosition * 1.5 + vec3(u_time * 0.02, 0.0, u_time * 0.01);
  float clouds1 = snoise(warp1);
  // Domain warp for swirl effect
  vec3 warp2 = vPosition * 2.5 + vec3(clouds1 * 0.4, u_time * 0.015, clouds1 * 0.3);
  float clouds2 = snoise(warp2);

  // Layer 2: fine turbulence
  float fine = snoise(vPosition * 6.0 + vec3(u_time * 0.03, clouds2 * 0.2, 0.0));

  float cloudPattern = clouds2 * 0.6 + fine * 0.4;
  cloudPattern = cloudPattern * 0.5 + 0.5; // remap to [0,1]

  // === COLOR PALETTE (thick sulfuric atmosphere) ===
  vec3 paleYellow = vec3(0.92, 0.85, 0.65);
  vec3 cream = vec3(0.95, 0.90, 0.78);
  vec3 orangeStreak = vec3(0.85, 0.65, 0.40);

  float t1 = smoothstep(0.3, 0.6, cloudPattern);
  float t2 = smoothstep(0.6, 0.85, cloudPattern);

  vec3 color = mix(orangeStreak, paleYellow, t1);
  color = mix(color, cream, t2);

  // === LIGHTING (diffuse through thick atmosphere) ===
  float diffuse = max(dot(N, lightDir), 0.0);
  diffuse = pow(diffuse, 0.5); // very soft — light scatters through clouds
  float ambient = 0.2; // thick atmosphere scatters light everywhere

  color *= ambient + diffuse * 0.8;

  // Subtle glow on limb (atmosphere scattering)
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float rim = pow(1.0 - max(dot(viewDir, N), 0.0), 2.5);
  color += vec3(0.9, 0.8, 0.5) * rim * 0.15;

  gl_FragColor = vec4(color, 1.0);
}
