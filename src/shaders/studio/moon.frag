#include "../lib/noise.glsl"
#include "../lib/lighting.glsl"

uniform vec3 u_color;
uniform vec3 u_colorSecondary;
uniform float u_roughness;
uniform vec3 u_lightPosition;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocalPosition;
varying float vElevation;

void main() {
  // Highland vs lowland coloring based on elevation
  vec3 baseColor = mix(u_colorSecondary, u_color, smoothstep(0.3, 0.7, vElevation));

  // Subtle regolith texture — small variations, not big splotches
  float regolith = snoise(vLocalPosition * 15.0) * 0.04 + snoise(vLocalPosition * 30.0) * 0.02;
  baseColor += regolith;

  // Lighting
  vec3 lightDir = normalize(u_lightPosition - vPosition);
  vec3 viewDir = normalize(cameraPosition - vPosition);

  float diffuse = calcDiffuse(vNormal, lightDir);

  // Rougher surfaces have wider, softer specular
  float shininess = mix(8.0, 64.0, 1.0 - u_roughness);
  float specular = calcSpecular(vNormal, lightDir, viewDir, shininess);
  specular *= (1.0 - u_roughness * 0.7);

  float rim = calcRim(vNormal, viewDir, 4.0);

  // Low ambient but not invisible — earthshine / reflected light
  vec3 finalColor = baseColor * (0.08 + diffuse * 0.85)
                  + vec3(1.0) * specular * 0.08
                  + baseColor * rim * 0.06;

  gl_FragColor = vec4(finalColor, 1.0);
}
