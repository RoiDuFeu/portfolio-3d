attribute float aSize;
attribute float aOffset;
attribute float aBrightness;

uniform float u_time;
uniform float u_pixelRatio;

varying vec3 vColor;
varying float vAlpha;
varying float vBrightness;

void main() {
  vColor = color;
  vBrightness = aBrightness;

  // Subtle twinkle — brighter stars twinkle more
  float twinkleSpeed = 0.8 + aBrightness * 1.5;
  float twinkleAmount = 0.1 + aBrightness * 0.15;
  float twinkle = 1.0 - twinkleAmount + twinkleAmount * (sin(u_time * twinkleSpeed + aOffset * 100.0) * 0.5 + 0.5);
  vAlpha = twinkle * aBrightness;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // Size: bright stars appear larger
  float baseSize = aSize * (0.3 + aBrightness * 0.7);
  gl_PointSize = baseSize * u_pixelRatio * (180.0 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 0.5, 8.0);

  gl_Position = projectionMatrix * mvPosition;
}
