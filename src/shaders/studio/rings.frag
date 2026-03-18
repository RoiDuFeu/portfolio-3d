#include "../lib/noise.glsl"

uniform float u_time;
uniform vec3 u_colorInner;
uniform vec3 u_colorOuter;
uniform float u_bandCount;
uniform float u_opacity;

varying vec2 vUv;

void main() {
  // Radial position: 0 at inner edge, 1 at outer edge
  float r = vUv.x;

  // Band pattern
  float bands = sin(r * u_bandCount * 6.2831) * 0.5 + 0.5;
  bands = smoothstep(0.3, 0.7, bands);

  // Small noise for natural variation
  float noise = snoise(vec3(r * 20.0, vUv.y * 10.0, u_time * 0.05));
  bands += noise * 0.08;

  // Color gradient inner → outer
  vec3 color = mix(u_colorInner, u_colorOuter, r);
  color *= 0.5 + bands * 0.5;

  // Edge fade
  float edgeFade = smoothstep(0.0, 0.05, r) * smoothstep(1.0, 0.95, r);

  // Cassini-style gap at ~40%
  float gap = 1.0 - smoothstep(0.38, 0.40, r) * smoothstep(0.46, 0.44, r) * 0.7;

  gl_FragColor = vec4(color, u_opacity * edgeFade * gap);
}
