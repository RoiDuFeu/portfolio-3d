#include "../lib/noise.glsl"

uniform float u_time;
uniform float u_intensity;
uniform vec3 u_colorCore;
uniform vec3 u_colorMid;
uniform vec3 u_colorEdge;
uniform float u_coronaGlow;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

void main() {
  // Turbulent noise for fire patterns
  float n = fbm(vPosition * 2.0 + u_time * 0.5);
  float n2 = abs(snoise(vPosition * 5.0 + u_time * 1.2));

  // Heat map
  float heat = clamp(n * 0.5 + 0.5 + n2 * 0.3, 0.0, 1.0);

  // Color ramp: edge → mid → core
  vec3 fireColor = mix(u_colorEdge, u_colorMid, smoothstep(0.2, 0.5, heat));
  fireColor = mix(fireColor, u_colorCore, smoothstep(0.6, 0.9, heat));

  // Corona rim glow
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float rim = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.0);
  fireColor += u_colorMid * rim * u_coronaGlow;

  // Emissive — no diffuse lighting, values > 1 will bloom
  gl_FragColor = vec4(fireColor * (1.0 + u_intensity * 0.5), 1.0);
}
