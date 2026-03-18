uniform float u_time;

varying vec2 vUv;
varying vec3 vWorldPos;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float v = 0.0, a = 0.5, f = 1.0;
  for (int i = 0; i < 5; i++) {
    v += a * snoise(p * f);
    a *= 0.5;
    f *= 2.1;
  }
  return v;
}

void main() {
  vec3 dir = normalize(vWorldPos);

  // === GALACTIC BAND ===
  // Concentrated along a tilted great circle (the galactic plane)
  // Rotated ~60 degrees from the default equator
  vec3 galacticNormal = normalize(vec3(0.3, 0.85, 0.15));
  float distFromPlane = abs(dot(dir, galacticNormal));

  // Band profile — gaussian-like falloff
  float bandWidth = 0.18;
  float band = exp(-distFromPlane * distFromPlane / (2.0 * bandWidth * bandWidth));

  // === STAR CLOUD DENSITY ===
  // Vary density along the band using noise
  float longitude = atan(dir.z, dir.x);
  float latitude = asin(dir.y);

  // Large-scale density variation
  float density = fbm(vec3(longitude * 2.0, latitude * 3.0, 0.0)) * 0.5 + 0.5;

  // Fine granular structure (individual star clouds)
  float grain = fbm(vec3(longitude * 12.0, latitude * 15.0, 1.0)) * 0.5 + 0.5;
  grain = pow(grain, 1.5);

  // === DARK DUST LANES ===
  // Realistic dark lanes that cut through the milky way
  float dustLane = fbm(vec3(longitude * 5.0, latitude * 8.0 + 50.0, 2.0));
  dustLane = smoothstep(-0.1, 0.3, dustLane); // Creates dark rifts

  // === COLOR ===
  vec3 warmGlow = vec3(0.95, 0.85, 0.65);  // Warm star-light
  vec3 coolGlow = vec3(0.7, 0.75, 0.9);     // Blue regions
  vec3 reddish  = vec3(0.9, 0.5, 0.4);      // HII emission regions

  // Mix colors based on position
  float colorNoise = snoise(vec3(longitude * 3.0, latitude * 4.0, 3.0)) * 0.5 + 0.5;
  vec3 baseColor = mix(warmGlow, coolGlow, colorNoise * 0.5);

  // Add reddish emission nebulae spots
  float emission = pow(snoise(vec3(longitude * 8.0, latitude * 10.0, 4.0)) * 0.5 + 0.5, 4.0);
  baseColor = mix(baseColor, reddish, emission * 0.3);

  // === COMBINE ===
  float intensity = band * (density * 0.6 + grain * 0.4) * dustLane;
  intensity *= 0.12; // Keep it subtle — real milky way is faint

  float alpha = intensity;

  gl_FragColor = vec4(baseColor, alpha);
}
