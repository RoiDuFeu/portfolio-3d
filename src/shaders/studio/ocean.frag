#include "../lib/lighting.glsl"

uniform float u_time;
uniform vec3 u_lightPosition;
uniform vec3 u_colorDeep;
uniform vec3 u_colorShallow;
uniform float u_transparency;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 lightDir = normalize(u_lightPosition - vPosition);
  vec3 viewDir = normalize(cameraPosition - vPosition);

  float diffuse = calcDiffuse(vNormal, lightDir);
  float specular = calcSpecular(vNormal, lightDir, viewDir, 64.0);

  // Fresnel for reflectivity at grazing angles
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 4.0);

  // Shimmer
  float shimmer = sin(vPosition.x * 8.0 + u_time * 2.5) *
                  sin(vPosition.z * 8.0 + u_time * 1.8) * 0.05;

  vec3 color = mix(u_colorDeep, u_colorShallow, 0.5 + shimmer);
  color = color * (0.2 + diffuse * 0.6) + vec3(1.0) * specular * 0.6;
  color += vec3(0.4, 0.6, 0.9) * fresnel * 0.3;

  gl_FragColor = vec4(color, u_transparency);
}
