#include "../lib/noise.glsl"
#include "../lib/lighting.glsl"

uniform float u_time;
uniform vec3 u_lightPosition;

// Biome uniforms
uniform float u_oceanLevel;
uniform float u_vegetation;
uniform float u_frost;

// Colors
uniform vec3 u_colorPrimary;
uniform vec3 u_colorSecondary;
uniform vec3 u_colorOcean;
uniform vec3 u_colorVegetation;
uniform vec3 u_colorSnow;
uniform vec3 u_colorFrost;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocalPosition;
varying float vElevation;
varying float vLatitude;

void main() {
  // Elevation relative to ocean level
  float aboveWater = (vElevation - u_oceanLevel) / max(1.0 - u_oceanLevel, 0.001);

  // Band thresholds
  float beachEnd = 0.08;
  float vegEnd = 0.38;
  float rockEnd = 0.65;
  float snowLine = rockEnd + (1.0 - vLatitude) * 0.2;

  vec3 color;

  if (vElevation < u_oceanLevel) {
    // Ocean — depth gradient from shallow to deep
    float depth = vElevation / max(u_oceanLevel, 0.001);
    vec3 deepOcean = u_colorOcean * 0.65;
    color = mix(deepOcean, u_colorOcean, depth);
    // Shimmer on lit areas
    color += vec3(0.015) * sin(u_time * 2.0 + vPosition.x * 5.0);
  } else {
    // Land base
    color = mix(u_colorPrimary, u_colorSecondary, smoothstep(0.0, 1.0, aboveWater));

    // Beach zone
    float beachFade = smoothstep(0.0, beachEnd, aboveWater);

    // Vegetation zone (mid elevation)
    float vegZone = smoothstep(beachEnd, vegEnd, aboveWater) * smoothstep(rockEnd, vegEnd + 0.1, aboveWater);
    float vegNoise = snoise(vLocalPosition * 3.0) * 0.5 + 0.5;
    color = mix(color, u_colorVegetation * (0.7 + vegNoise * 0.3), vegZone * u_vegetation);

    // Rock to snow transition
    float snowFade = smoothstep(rockEnd, snowLine, aboveWater);
    color = mix(color, u_colorSnow, snowFade * 0.6);
  }

  // Frost overlay (latitude + elevation based)
  float frostMask = smoothstep(0.3, 0.7, fbm(vLocalPosition * 4.0 + 100.0) * 0.5 + 0.5);
  frostMask *= smoothstep(0.2, 0.6, vLatitude + aboveWater * 0.3);
  color = mix(color, u_colorFrost, frostMask * u_frost);

  // Lighting
  vec3 lightDir = normalize(u_lightPosition - vPosition);
  vec3 viewDir = normalize(cameraPosition - vPosition);

  float diffuse = calcDiffuse(vNormal, lightDir);
  float specular = calcSpecular(vNormal, lightDir, viewDir, 32.0);
  float rim = calcRim(vNormal, viewDir, 3.0);

  vec3 rimColor = u_colorOcean * rim * 0.3;

  // Higher ambient for ocean (subsurface scattering), lower for land
  float isOcean = step(vElevation, u_oceanLevel);
  float ambient = mix(0.15, 0.25, isOcean);

  vec3 finalColor = color * (ambient + diffuse * 0.8)
                  + vec3(1.0) * specular * 0.15 * (1.0 - isOcean * 0.5)
                  + rimColor;

  gl_FragColor = vec4(finalColor, 1.0);
}
