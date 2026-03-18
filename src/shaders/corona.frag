#include "./lib/noise.glsl"

uniform float u_time;
uniform float u_radius;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
varying vec2 vUv;

const float TAU = 6.2831853;

void main() {
  float dist = length(vWorldPos) / u_radius;
  float normalizedDist = max(0.0, dist - 1.0);

  // === FRESNEL BASE ===
  float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), 2.0);

  // === CORONA DENSITY FALLOFF ===
  float falloff = 1.0 / (1.0 + normalizedDist * normalizedDist * 8.0);

  // === STREAMER RAYS ===
  vec3 radialDir = normalize(vWorldPos);
  float angle = atan(radialDir.z, radialDir.x);
  float latitude = asin(clamp(radialDir.y, -1.0, 1.0));

  float streamers = snoise(vec3(angle * 3.0, latitude * 2.0, u_time * 0.05)) * 0.5 + 0.5;
  streamers = pow(streamers, 2.0);

  float fineStreamers = snoise(vec3(angle * 8.0, latitude * 5.0, u_time * 0.1 + 50.0)) * 0.5 + 0.5;
  fineStreamers = pow(fineStreamers, 3.0);

  float rayIntensity = streamers * 0.7 + fineStreamers * 0.3;
  float equatorFocus = 1.0 - abs(radialDir.y) * 0.5;
  rayIntensity *= equatorFocus;

  // === SOLAR FLARES ===
  float flareAngle1 = u_time * 0.03;
  float flareAngle2 = u_time * 0.02 + 2.094;
  float flareAngle3 = u_time * 0.025 + 4.189;

  float d1 = angle - flareAngle1;
  d1 = d1 - TAU * floor((d1 + 3.14159) / TAU);
  float d2 = angle - flareAngle2;
  d2 = d2 - TAU * floor((d2 + 3.14159) / TAU);
  float d3 = angle - flareAngle3;
  d3 = d3 - TAU * floor((d3 + 3.14159) / TAU);

  float equatorMask = max(0.0, 1.0 - abs(latitude) * 1.5);
  float flare1 = exp(-pow(d1 * 2.0, 2.0)) * equatorMask;
  float flare2 = exp(-pow(d2 * 2.0, 2.0)) * equatorMask;
  float flare3 = exp(-pow(d3 * 1.5, 2.0)) * equatorMask;
  float flares = max(max(flare1, flare2), flare3) * falloff * 2.0;

  // === PLASMA TURBULENCE ===
  float turbulence = snoise(vWorldPos * 1.5 + u_time * 0.12) * 0.5 + 0.5;
  turbulence *= falloff;

  // === ASYMMETRY (enhanced — varies with distance) ===
  float chaosAngle = atan(vUv.y - 0.5, vUv.x - 0.5);
  float chaos = snoise(vec3(chaosAngle * 4.0, u_time * 0.4, normalizedDist * 2.0));
  float chaosFlare = smoothstep(0.5, 1.0, chaos);
  turbulence += chaosFlare * 0.4;
  rayIntensity *= mix(0.7, 1.3, chaosFlare);

  // === COMBINE ===
  float corona = fresnel * falloff * (0.5 + rayIntensity * 0.5 + turbulence * 0.3) + flares;

  // === COLOR — warm orange/amber ===
  vec3 innerColor = vec3(1.0, 0.78, 0.35);   // bright amber
  vec3 midColor   = vec3(0.9, 0.5, 0.12);    // warm orange
  vec3 outerColor = vec3(0.7, 0.3, 0.05);    // deep orange

  float ct1 = smoothstep(0.0, 0.3, normalizedDist);
  float ct2 = smoothstep(0.3, 1.0, normalizedDist);
  vec3 color = mix(innerColor, midColor, ct1);
  color = mix(color, outerColor, ct2);

  // Flare white-gold shift
  vec3 flareColor = vec3(1.0, 0.85, 0.5);
  color = mix(color, flareColor, clamp(flares * 0.6, 0.0, 1.0));

  // Controlled boost (shader carries visual weight, not bloom)
  color *= 1.1;

  // Steeper alpha falloff — prevents visible concentric rings from layered shells
  float edgeFade = 1.0 - smoothstep(0.0, 0.6, normalizedDist);
  float alpha = corona * edgeFade * edgeFade;
  alpha = clamp(alpha, 0.0, 0.8);

  gl_FragColor = vec4(color, alpha);
}
