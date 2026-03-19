#include "../lib/noise.glsl"

uniform float u_time;
uniform vec3 u_lightPosition;

// Biome uniforms (from procedural mode)
uniform float u_oceanLevel;
uniform float u_vegetation;
uniform float u_frost;

// Colors (from procedural mode)
uniform vec3 u_colorPrimary;
uniform vec3 u_colorSecondary;
uniform vec3 u_colorOcean;
uniform vec3 u_colorVegetation;
uniform vec3 u_colorSnow;
uniform vec3 u_colorFrost;

// Realistic mode uniforms
uniform float u_specularStrength;
uniform float u_nightLightsDensity;
uniform float u_roughness;

// Cloud uniforms (when enabled)
uniform bool u_cloudsEnabled;
uniform float u_cloudDensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocalPosition;
varying float vElevation;
varying float vLatitude;
varying vec2 vUv;
varying vec3 vPixelPosition;
varying vec3 vVertexPosition;

// Tangent-space normal mapping function (from Earth shader)
// Generates procedural normal map from terrain noise derivatives
vec3 perturbNormal2Arb(vec3 surf_norm, float detailScale) {
    vec3 q0 = vec3(dFdx(vVertexPosition.x), dFdx(vVertexPosition.y), dFdx(vVertexPosition.z));
    vec3 q1 = vec3(dFdy(vVertexPosition.x), dFdy(vVertexPosition.y), dFdy(vVertexPosition.z));
    vec2 st0 = dFdx(vUv.st);
    vec2 st1 = dFdy(vUv.st);
    float scale = sign(st1.t * st0.s - st0.t * st1.s);
    vec3 S = normalize((q0 * st1.t - q1 * st0.t) * scale);
    vec3 T = normalize((-q0 * st1.s + q1 * st0.s) * scale);
    vec3 N = normalize(surf_norm);
    mat3 tsn = mat3(S, T, N);
    
    // Procedural normal map from terrain noise
    // Sample noise at higher frequency for fine detail
    vec3 samplePos = vLocalPosition * detailScale;
    float n = snoise(samplePos);
    float nx = snoise(samplePos + vec3(0.01, 0.0, 0.0));
    float ny = snoise(samplePos + vec3(0.0, 0.01, 0.0));
    
    vec3 mapN = vec3(
        (nx - n) * 10.0,
        (ny - n) * 10.0,
        1.0
    );
    mapN = normalize(mapN);
    
    vec2 normalScale = vec2(1.0, 1.0);
    mapN.xy *= normalScale;
    mapN.xy *= (float(gl_FrontFacing) * 2.0 - 1.0);
    return normalize(tsn * mapN);
}

// Generate procedural city lights on land areas
float generateCityLights(vec3 pos, float landMask) {
    if (landMask < 0.5) return 0.0;
    
    // Multi-scale noise for city clusters
    float cityNoise = snoise(pos * 50.0) * 0.5 + 0.5;
    cityNoise *= snoise(pos * 25.0 + 100.0) * 0.5 + 0.5;
    
    // Threshold to create discrete city spots
    float threshold = 1.0 - u_nightLightsDensity * 0.7;
    float cities = smoothstep(threshold, threshold + 0.1, cityNoise);
    
    // Add grid pattern for realism
    float grid = snoise(pos * 200.0) * 0.5 + 0.5;
    cities *= 0.7 + grid * 0.3;
    
    return cities * landMask;
}

// Generate procedural cloud shadows
float generateCloudShadow(vec3 pos) {
    if (!u_cloudsEnabled) return 0.0;
    
    float cloudLayer = fbm(pos * 3.0 + vec3(u_time * 0.1, 0.0, 0.0));
    cloudLayer = smoothstep(1.0 - u_cloudDensity, 1.0, cloudLayer);
    
    return cloudLayer * 0.6; // Cloud shadow strength
}

void main() {
    // Base terrain color (from procedural shader logic)
    float aboveWater = (vElevation - u_oceanLevel) / max(1.0 - u_oceanLevel, 0.001);
    
    float beachEnd = 0.08;
    float vegEnd = 0.38;
    float rockEnd = 0.65;
    float snowLine = rockEnd + (1.0 - vLatitude) * 0.2;
    
    vec3 baseColor;
    float isOcean = step(vElevation, u_oceanLevel);
    
    if (vElevation < u_oceanLevel) {
        float depth = vElevation / max(u_oceanLevel, 0.001);
        vec3 deepOcean = u_colorOcean * 0.65;
        baseColor = mix(deepOcean, u_colorOcean, depth);
    } else {
        baseColor = mix(u_colorPrimary, u_colorSecondary, smoothstep(0.0, 1.0, aboveWater));
        
        // Vegetation zone
        float vegZone = smoothstep(beachEnd, vegEnd, aboveWater) * smoothstep(rockEnd, vegEnd + 0.1, aboveWater);
        float vegNoise = snoise(vLocalPosition * 3.0) * 0.5 + 0.5;
        baseColor = mix(baseColor, u_colorVegetation * (0.7 + vegNoise * 0.3), vegZone * u_vegetation);
        
        // Snow transition
        float snowFade = smoothstep(rockEnd, snowLine, aboveWater);
        baseColor = mix(baseColor, u_colorSnow, snowFade * 0.6);
    }
    
    // Frost overlay
    float frostMask = smoothstep(0.3, 0.7, fbm(vLocalPosition * 4.0 + 100.0) * 0.5 + 0.5);
    frostMask *= smoothstep(0.2, 0.6, vLatitude + aboveWater * 0.3);
    baseColor = mix(baseColor, u_colorFrost, frostMask * u_frost);
    
    // ===== REALISTIC LIGHTING =====
    
    // Normal mapping with procedural detail
    // Higher detail scale for land (mountains), lower for ocean (waves)
    float detailScale = mix(8.0, 15.0, 1.0 - isOcean);
    vec3 normal = perturbNormal2Arb(vNormal, detailScale);
    
    // Light direction (normalized)
    vec3 lightDir = normalize(u_lightPosition - vPosition);
    
    // Diffuse lighting
    float dotProduct = dot(normal, lightDir);
    float maxDotProduct = max(dotProduct, 0.0);
    
    // Cloud shadow subtraction
    float cloudShadow = generateCloudShadow(vLocalPosition);
    float diffuseFactor = maxDotProduct * (1.0 - cloudShadow * 0.5);
    
    vec3 diffuse = diffuseFactor * baseColor;
    
    // ===== SPECULAR REFLECTION =====
    
    // Procedural specular map: high on ocean, low on land
    float specularMap = mix(0.1, 0.9, isOcean);
    specularMap -= cloudShadow; // Subtract cloud shadow from specular
    
    // Apply roughness (inverted for shininess)
    float shininess = mix(5.0, 30.0, 1.0 - u_roughness);
    
    vec3 viewDir = normalize(cameraPosition - vPixelPosition);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    
    vec3 specularColor = vec3(1.0, 0.95, 0.8); // Warm sunlight specular
    vec3 specular = spec * specularColor * specularMap * u_specularStrength;
    
    // ===== NIGHT LIGHTS =====
    
    // Generate city lights on land only
    float cityLights = generateCityLights(vLocalPosition, 1.0 - isOcean);
    vec3 nightLightsColor = vec3(1.0, 0.85, 0.6) * cityLights * 1.5; // Warm city glow
    
    // Day/night transition (smooth terminator)
    float dayNightThreshold = smoothstep(-0.05, 0.05, dot(vNormal, lightDir));
    
    // Combine diffuse + specular
    vec3 dayColor = diffuse + specular;
    
    // Mix day lighting with night lights
    vec3 result = mix(nightLightsColor, dayColor, dayNightThreshold);
    
    // Ambient light (higher for ocean subsurface scattering)
    float ambient = mix(0.12, 0.22, isOcean);
    result += baseColor * ambient;
    
    // Subtle rim light for atmosphere feel
    float rim = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
    vec3 rimColor = u_colorOcean * rim * 0.25;
    result += rimColor;
    
    gl_FragColor = vec4(result, 1.0);
}
