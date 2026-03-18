#include "./lib/noise.glsl"

uniform float u_time;
uniform float u_intensity;
uniform vec3 u_color;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 pos = vPosition * 2.0;
  vec3 viewDir = normalize(cameraPosition - vPosition);
  vec3 N = normalize(vNormal);

  // === FRESNEL (sharper — edge-only) ===
  float NdotV = max(dot(N, viewDir), 0.0);
  float fresnel = pow(1.0 - NdotV, 4.0);

  // === 3-PASS DOMAIN-WARPED NOISE (3 calls total) ===
  float n1 = snoise(pos * 1.8 + u_time * 0.08);
  vec3 warpOffset = vec3(n1 * 0.6, n1 * 0.4 + 0.1, n1 * 0.5 - 0.1);
  float n2 = snoise((pos + warpOffset) * 2.5 + u_time * 0.05 + 100.0);
  float n3 = snoise(pos * 5.0 + u_time * 0.2 + 200.0);

  float plasma = n1 * 0.4 + n2 * 0.4 + n3 * 0.2;
  plasma = plasma * 0.5 + 0.5;

  // === COLOR MAPPING — warm amber/orange palette ===
  vec3 hotCenter    = vec3(1.0, 0.92, 0.7);
  vec3 brightAmber  = vec3(1.0, 0.75, 0.35);
  vec3 warmOrange   = vec3(0.95, 0.55, 0.15);
  vec3 deepAmber    = vec3(0.6, 0.28, 0.06);

  float t1 = smoothstep(0.0, 0.3, plasma);
  float t2 = smoothstep(0.3, 0.55, plasma);
  float t3 = smoothstep(0.55, 0.85, plasma);

  vec3 color = mix(deepAmber, warmOrange, t1);
  color = mix(color, brightAmber, t2);
  color = mix(color, hotCenter, t3);

  // === CONTROLLED CORE (no white clipping) ===
  float core = pow(NdotV, 6.0);
  core = smoothstep(0.4, 0.95, core);
  color = mix(color, hotCenter, core * 0.2);

  // === CONTRAST DARK ZONES (reuse n3 — no extra noise call) ===
  float darkZones = smoothstep(0.35, 0.7, n3 * 0.5 + 0.5);
  color *= mix(1.0, 0.7, darkZones);

  // === SUNSPOTS ===
  float spots = smoothstep(0.5, 0.65, n3);
  color = mix(color, vec3(0.35, 0.12, 0.02), spots * 0.4);

  // === SURFACE FLARES ===
  float flare = pow(max(n3, 0.0), 5.0);
  color += brightAmber * flare * 0.2;

  // === LIMB DARKENING ===
  float limbDarkening = pow(NdotV, 0.5);
  color *= (0.35 + 0.65 * limbDarkening);

  // === LIMB ORANGE TINT ===
  vec3 limbTint = vec3(1.0, 0.6, 0.25);
  color = mix(color, color * limbTint, (1.0 - limbDarkening) * 0.5);

  // === COOL EDGE TINT (chromosphere hint) ===
  vec3 coolEdge = vec3(0.5, 0.35, 0.9);
  color += coolEdge * fresnel * 0.08;

  // === FRESNEL RIM (sharp, edge-only — feeds bloom at rim) ===
  color += vec3(1.0, 0.7, 0.25) * fresnel * 0.5;

  // === FINAL OUTPUT (controlled brightness) ===
  color *= 0.8 * u_intensity;
  color *= u_color;
  color = min(color, vec3(1.2));

  gl_FragColor = vec4(color, 1.0);
}
