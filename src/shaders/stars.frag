varying vec3 vColor;
varying float vAlpha;
varying float vBrightness;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));

  // Bright stars get a sharper core with soft halo
  // Dim stars are just soft dots
  float core = 1.0 - smoothstep(0.0, 0.15 + (1.0 - vBrightness) * 0.35, dist);
  float halo = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.3 * vBrightness;

  float alpha = (core + halo) * vAlpha;

  // Slight color boost for bright stars (more saturated)
  vec3 finalColor = vColor * (1.0 + vBrightness * 0.5);

  gl_FragColor = vec4(finalColor, alpha);
}
