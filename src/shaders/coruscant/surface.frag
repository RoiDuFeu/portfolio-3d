#include "../lib/noise.glsl"

uniform vec3 uLightDirection;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPixelPosition;
varying vec3 vPosition;

// ── Hash helpers ──

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

float hash1(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash1f(float p) {
    return fract(sin(p * 127.1) * 43758.5453);
}

// ── Thin ring ──

float ring(float d, float r, float width) {
    return smoothstep(width, 0.0, abs(d - r));
}

// ── Single circular district with internal structure ──

float districtStructure(vec2 p, float seed, float radius) {
    float d = length(p);
    float angle = atan(p.y, p.x);
    float result = 0.0;

    if (d > radius * 1.3) return 0.0;

    float nd = d / radius;

    // Outer wall — thin bright rim
    result += ring(d, radius, radius * 0.015) * 1.2;

    // 2-4 concentric inner rings
    float numRings = floor(2.0 + hash1f(seed * 3.7) * 3.0);
    for (float i = 1.0; i <= 4.0; i++) {
        if (i > numRings) break;
        float r = radius * (0.2 + i * 0.18);
        if (r < radius * 0.95) {
            result += ring(d, r, radius * 0.01) * 0.6;
        }
    }

    // Radial spokes
    float numSpokes = floor(6.0 + hash1f(seed * 7.3) * 10.0);
    float spokeAngle = mod(angle + seed * 2.0, 6.2831853 / numSpokes);
    float spokeWidth = 0.03 + hash1f(seed * 11.0) * 0.02;
    float spoke = smoothstep(spokeWidth, 0.0, abs(spokeAngle - 3.1415926 / numSpokes));
    spoke *= step(0.1, nd) * step(nd, 0.95);
    result += spoke * 0.4;

    // Inner sub-circles (1-3)
    float numSub = floor(1.0 + hash1f(seed * 13.0) * 3.0);
    for (float i = 0.0; i < 3.0; i++) {
        if (i >= numSub) break;
        float subAngle = hash1f(seed + i * 5.0) * 6.2831853;
        float subDist = radius * (0.3 + hash1f(seed + i * 9.0) * 0.35);
        float subRadius = radius * (0.08 + hash1f(seed + i * 17.0) * 0.15);
        vec2 subCenter = vec2(cos(subAngle), sin(subAngle)) * subDist;
        float subD = length(p - subCenter);

        result += ring(subD, subRadius, subRadius * 0.03) * 0.8;
        result += ring(subD, subRadius * 0.5, subRadius * 0.02) * 0.4;
    }

    // Bright center core
    result += smoothstep(radius * 0.12, 0.0, d) * 0.5;

    // Fade at edges
    float inside = smoothstep(radius * 1.05, radius * 0.9, d);
    result *= mix(0.3, 1.0, inside);

    return result;
}

// ── Sample districts at one scale (no aspect correction needed with triplanar) ──

float districtLayer(vec2 uv, float scale, float offsetSeed, float sparsity) {
    vec2 suv = uv * scale;
    vec2 cell = floor(suv);
    vec2 frac_uv = fract(suv);
    float result = 0.0;

    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 cellId = cell + neighbor;

            // Skip cells based on sparsity — only some cells get a district
            float skip = hash1(cellId * 3.17 + offsetSeed + 77.0);
            if (skip > sparsity) continue;

            vec2 centerOffset = hash2(cellId + offsetSeed);
            vec2 delta = neighbor + centerOffset - frac_uv;

            float seed = hash1(cellId + offsetSeed);
            float radius = 0.25 + seed * 0.25;

            result += districtStructure(delta, seed + offsetSeed, radius);
        }
    }

    return result;
}

// ── All district scales at one 2D projection ──

float sampleDistricts(vec2 uv, float offsetBase) {
    float d = 0.0;
    // Large districts — sparse, only ~50% of cells
    d += districtLayer(uv, 3.0, offsetBase, 0.5) * 0.9;
    // Medium districts — sparser, ~40% of cells
    d += districtLayer(uv, 7.0, offsetBase + 17.0, 0.4) * 0.5;
    return d;
}

// ── Infrastructure at one 2D projection ──

float sampleInfra(vec2 uv, float offsetBase) {
    float result = 0.0;
    for (float s = 0.0; s < 2.0; s++) {
        float scale = 3.0 + s * 3.0;
        vec2 suv = uv * scale;
        vec2 cell = floor(suv);
        vec2 frac_uv = fract(suv);
        vec2 center = hash2(cell + s * 50.0 + offsetBase);
        vec2 toCenter = center - frac_uv;
        float angle = atan(toCenter.y, toCenter.x);
        float linePattern = abs(sin(angle * 4.0 + hash1(cell + offsetBase) * 6.28));
        float thinLine = smoothstep(0.02, 0.0, 1.0 - linePattern);
        result += thinLine * 0.08;
    }
    return result;
}

// ── Fine city texture using noise (3D, no distortion) ──

float cityNoise(vec3 pos) {
    float n = 0.0;

    vec3 warp = vec3(
        snoise(pos * 30.0),
        snoise(pos * 30.0 + 100.0),
        snoise(pos * 30.0 + 200.0)
    ) * 0.05;

    float detail = snoise((pos + warp) * 60.0);
    n += smoothstep(0.3, 0.5, abs(detail)) * 0.15;

    float medium = snoise((pos + warp * 0.5) * 25.0);
    n += smoothstep(0.2, 0.45, abs(medium)) * 0.1;

    float spots = snoise(pos * 100.0);
    n += smoothstep(0.6, 0.8, spots) * 0.2;

    return n;
}

// ── Base surface texture: granular cityscape ──

float surfaceGrain(vec3 pos) {
    float grain = 0.0;

    grain += fbm(pos * 4.0) * 0.3;

    float blocks = snoise(pos * 40.0);
    grain += smoothstep(-0.2, 0.3, blocks) * 0.2;

    float fine = snoise(pos * 80.0);
    grain += fine * 0.08;

    float speckle = snoise(pos * 150.0);
    grain += smoothstep(0.4, 0.7, speckle) * 0.1;

    return clamp(grain + 0.3, 0.0, 1.0);
}

// ── Main ──

void main() {
    vec3 normal = normalize(vNormal);
    vec3 nPos = normalize(vPosition);

    // ── Lighting ──
    float NdotL = -dot(normal, uLightDirection);
    float lightIntensity = max(NdotL, 0.0);
    float terminator = smoothstep(-0.15, 0.4, NdotL);

    vec3 viewDir = normalize(cameraPosition - vPixelPosition);

    // ── Triplanar mapping for perfectly round circles ──
    // Blend weights from absolute normal — squared for sharper transitions
    vec3 w = abs(nPos);
    w = w * w;
    w /= w.x + w.y + w.z;

    // Sample districts and infrastructure on 3 orthogonal planes
    float districts = 0.0;
    districts += sampleDistricts(nPos.yz, 0.0) * w.x;
    districts += sampleDistricts(nPos.xz, 100.0) * w.y;
    districts += sampleDistricts(nPos.xy, 200.0) * w.z;

    float infra = 0.0;
    infra += sampleInfra(nPos.yz, 0.0) * w.x;
    infra += sampleInfra(nPos.xz, 100.0) * w.y;
    infra += sampleInfra(nPos.xy, 200.0) * w.z;

    // ── Fine city texture (3D noise, already distortion-free) ──
    float fineCity = cityNoise(nPos);

    // ── Total city light intensity ──
    float cityLights = districts + fineCity + infra;

    // Large-scale variation
    float largePatch = fbm(nPos * 3.0) * 0.4 + 0.6;
    cityLights *= largePatch;

    // Darken patches (cloud-covered / less-developed areas)
    float darkPatches = smoothstep(0.3, 0.6, fbm(nPos * 5.0 + 10.0));
    cityLights *= mix(0.3, 1.0, darkPatches);

    cityLights = clamp(cityLights, 0.0, 1.5);

    // ── Base surface texture ──
    float grain = surfaceGrain(nPos);

    // Mottled surface variation (large organic patches like weathered metal)
    float mottled = fbm(nPos * 6.0 + 5.0) * 0.5 + 0.5;

    // ── Color palette ──

    // City light colors — saturated orange/amber
    vec3 dimLight  = vec3(0.7, 0.35, 0.05);
    vec3 warmLight = vec3(1.0, 0.6, 0.12);
    vec3 hotLight  = vec3(1.0, 0.82, 0.4);

    vec3 lightColor = mix(dimLight, warmLight, smoothstep(0.1, 0.5, cityLights));
    lightColor = mix(lightColor, hotLight, smoothstep(0.8, 1.3, cityLights));

    // ── Base surface albedo: warm bronze/copper with grain ──
    vec3 copperDark  = vec3(0.07, 0.04, 0.025);
    vec3 copperMid   = vec3(0.14, 0.08, 0.04);
    vec3 copperLight = vec3(0.22, 0.13, 0.06);

    vec3 surfaceAlbedo = mix(copperDark, copperMid, mottled);
    surfaceAlbedo = mix(surfaceAlbedo, copperLight, grain * mottled * 0.5);

    // City structures add subtle brightness to the base
    surfaceAlbedo += cityLights * 0.03 * vec3(0.8, 0.5, 0.2);

    // ── Lit side: strong warm gradient ──
    float diffuse = lightIntensity;
    vec3 litSide = surfaceAlbedo * diffuse * 2.2;

    // Warm wash toward the light source
    float strongLight = smoothstep(0.3, 1.0, lightIntensity);
    vec3 warmWash = vec3(0.18, 0.10, 0.04) * strongLight * grain;
    litSide += warmWash;

    // Bright hotspot near direct light
    float hotspot = pow(max(lightIntensity, 0.0), 2.5);
    litSide += hotspot * vec3(0.12, 0.07, 0.025) * mottled;

    // Specular — metallic copper surfaces
    vec3 halfDir = normalize(viewDir - uLightDirection);
    float spec = pow(max(dot(normal, halfDir), 0.0), 20.0);
    litSide += spec * vec3(0.3, 0.18, 0.06) * lightIntensity;

    // ── Emissive city lights ──
    vec3 emissive = lightColor * cityLights;
    float emissiveStrength = mix(0.8, 0.04, terminator);
    emissive *= emissiveStrength;

    // ── Dark side base: very dark ──
    vec3 darkBase = copperDark * 0.3 * grain;

    // ── Final composition ──
    vec3 color = mix(darkBase, litSide, terminator);
    color += emissive;

    // Subtle warm ambient on shadow side
    color += vec3(0.015, 0.008, 0.004) * (1.0 - terminator) * grain;

    // Limb darkening
    float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
    color *= 1.0 - fresnel * fresnel * 0.35;

    gl_FragColor = vec4(color, 1.0);
}
