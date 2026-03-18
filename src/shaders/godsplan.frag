uniform float u_time;
uniform vec3 u_lightPosition;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

// Voronoi noise for stained glass pattern
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float voronoi(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);

  float md = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.5 + 0.5 * sin(u_time * 0.3 + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      md = min(md, d);
    }
  }
  return sqrt(md);
}

void main() {
  // Gold base colors
  vec3 goldDark = vec3(0.65, 0.5, 0.15);
  vec3 goldBright = vec3(1.0, 0.85, 0.3);
  vec3 goldHighlight = vec3(1.0, 0.95, 0.7);

  // Voronoi stained glass pattern
  float pattern = voronoi(vUv * 8.0);
  float cells = smoothstep(0.0, 0.15, pattern);

  // Mix gold tones
  vec3 baseColor = mix(goldDark, goldBright, cells);

  // Lighting
  vec3 lightDir = normalize(u_lightPosition - vPosition);
  float diffuse = max(dot(vNormal, lightDir), 0.0);

  // Specular (metallic highlight)
  vec3 viewDir = normalize(cameraPosition - vPosition);
  vec3 halfDir = normalize(lightDir + viewDir);
  float specular = pow(max(dot(vNormal, halfDir), 0.0), 64.0);

  // Fresnel rim
  float rim = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
  vec3 rimColor = goldHighlight * rim * 0.6;

  // Cell border accent
  float border = smoothstep(0.05, 0.08, pattern) - smoothstep(0.08, 0.12, pattern);
  vec3 borderColor = goldHighlight * border * 0.3;

  float ambient = 0.12;
  vec3 finalColor = baseColor * (ambient + diffuse * 0.8)
    + goldHighlight * specular * 0.7
    + rimColor
    + borderColor;

  gl_FragColor = vec4(finalColor, 1.0);
}
