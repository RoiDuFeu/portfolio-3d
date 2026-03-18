#include "../lib/noise.glsl"
#include "../lib/lighting.glsl"

uniform float u_time;
uniform vec3 u_lightPosition;
uniform float u_cloudDensity;
uniform float u_cloudSpeed;
uniform vec3 u_cloudColor;
uniform float u_cloudOpacity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocalPosition;

void main() {
  // Drifting cloud sample position
  vec3 samplePos = vLocalPosition * 2.0;
  samplePos.x += u_time * u_cloudSpeed * 0.05;
  samplePos.z += u_time * u_cloudSpeed * 0.03;

  float clouds = fbm(samplePos);
  clouds = smoothstep(0.5 - u_cloudDensity * 0.4, 0.7, clouds * 0.5 + 0.5);

  float alpha = clouds * u_cloudOpacity;

  // Discard fully transparent fragments
  if (alpha < 0.01) discard;

  // Lit by directional light
  vec3 lightDir = normalize(u_lightPosition - vPosition);
  float diffuse = calcDiffuse(vNormal, lightDir);
  vec3 color = u_cloudColor * (0.35 + diffuse * 0.65);

  gl_FragColor = vec4(color, alpha);
}
