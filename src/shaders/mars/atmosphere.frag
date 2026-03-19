uniform vec3 u_lightDir;

varying vec3 vPixelPosition;
varying vec3 vNormal;

void main() {
  // Mars: extremely thin CO2 atmosphere — barely visible rim
  vec3 atmosColor = vec3(0.78, 0.48, 0.28);

  float dotProduct = -dot(vNormal, normalize(u_lightDir));
  float litSide = smoothstep(-0.1, 0.6, dotProduct);

  vec3 viewDirection = normalize(cameraPosition - vPixelPosition);
  float edgeDot = 1.0 - abs(dot(vNormal, viewDirection));

  // Very steep falloff — keeps glow razor-thin at the limb
  float rim = pow(edgeDot, 8.0);

  float alpha = rim * litSide * 0.18;
  alpha += rim * 0.03; // barely-there dark-side scatter

  gl_FragColor = vec4(atmosColor, clamp(alpha, 0.0, 0.15));
}
