uniform sampler2D uTexture;
uniform sampler2D uNormalMap;
uniform vec3 uLightDirection;

varying vec3 vPixelPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vVertexPosition;

// Tangent-space normal mapping (same as Moon / Earth)
vec3 perturbNormal2Arb(vec3 surf_norm) {
  vec3 q0 = vec3(dFdx(vVertexPosition.x), dFdx(vVertexPosition.y), dFdx(vVertexPosition.z));
  vec3 q1 = vec3(dFdy(vVertexPosition.x), dFdy(vVertexPosition.y), dFdy(vVertexPosition.z));
  vec2 st0 = dFdx(vUv.st);
  vec2 st1 = dFdy(vUv.st);
  float scale = sign(st1.t * st0.s - st0.t * st1.s);
  vec3 S = normalize((q0 * st1.t - q1 * st0.t) * scale);
  vec3 T = normalize((-q0 * st1.s + q1 * st0.s) * scale);
  vec3 N = normalize(surf_norm);
  mat3 tsn = mat3(S, T, N);
  vec3 mapN = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
  mapN.xy *= (float(gl_FrontFacing) * 2.0 - 1.0);
  return normalize(tsn * mapN);
}

void main() {
  vec3 marsColor = texture2D(uTexture, vUv).rgb;

  // Normal-mapped lighting
  vec3 normal = perturbNormal2Arb(vNormal);
  float dotProduct = -dot(normal, uLightDirection);
  float lightIntensity = max(dotProduct, 0.0);

  // Ambient — slightly warm to mimic dust-scattered light
  float ambientStrength = 0.10;
  vec3 ambient = ambientStrength * marsColor * vec3(1.05, 0.95, 0.90);

  // Diffuse
  vec3 diffuse = lightIntensity * marsColor;

  // Subtle specular for dust shimmer on lit side
  vec3 viewDir = normalize(cameraPosition - vPixelPosition);
  vec3 reflectDir = reflect(uLightDirection, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 12.0);
  vec3 specular = spec * vec3(0.18, 0.14, 0.10) * lightIntensity;

  vec3 result = ambient + diffuse + specular;

  gl_FragColor = vec4(result, 1.0);
}
