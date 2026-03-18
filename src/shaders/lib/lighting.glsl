// ── Shared lighting helpers ──
// Used via #include "../lib/lighting.glsl"

float calcDiffuse(vec3 normal, vec3 lightDir) {
  return max(dot(normal, lightDir), 0.0);
}

float calcSpecular(vec3 normal, vec3 lightDir, vec3 viewDir, float shininess) {
  vec3 halfDir = normalize(lightDir + viewDir);
  return pow(max(dot(normal, halfDir), 0.0), shininess);
}

float calcRim(vec3 normal, vec3 viewDir, float power) {
  return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
}
