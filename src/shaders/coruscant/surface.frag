#include "../lib/noise.glsl"

uniform vec3 uLightDirection;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPixelPosition;
varying vec3 vPosition;

// ── Hash helpers ──

float hash1f(float p) {
    return fract(sin(p * 127.1) * 43758.5453);
}

float hash3D(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// ── Thin ring ──

float ring(float d, float r, float width) {
    return smoothstep(width, 0.0, abs(d - r));
}

// ══════════════════════════════════════════════
//  STRUCTURE FAMILY 0: Radial hub
//  Concentric rings + radial spokes + bright core
// ══════════════════════════════════════════════

float hubRadial(vec2 p, float seed, float radius) {
    float d = length(p);
    float angle = atan(p.y, p.x);
    float result = 0.0;
    if (d > radius * 1.15) return 0.0;
    float nd = d / radius;

    // Outer wall
    result += ring(d, radius, radius * 0.01) * 1.5;

    // 2-4 concentric inner rings
    float nRings = floor(2.0 + hash1f(seed * 3.7) * 3.0);
    for (float i = 1.0; i <= 4.0; i++) {
        if (i > nRings) break;
        float r = radius * (0.2 + i * 0.17);
        if (r < radius * 0.92)
            result += ring(d, r, radius * 0.008) * 0.5;
    }

    // Radial spokes
    float nSpokes = floor(6.0 + hash1f(seed * 7.3) * 12.0);
    float spokeAngle = mod(angle + seed * 2.0, 6.2831853 / nSpokes);
    float spoke = smoothstep(0.025, 0.0, abs(spokeAngle - 3.1415926 / nSpokes));
    spoke *= step(0.15, nd) * step(nd, 0.92);
    result += spoke * 0.3;

    // 1-2 inner sub-circles
    for (float i = 0.0; i < 2.0; i++) {
        float subA = hash1f(seed + i * 5.0) * 6.2831853;
        float subD = radius * (0.3 + hash1f(seed + i * 9.0) * 0.3);
        float subR = radius * (0.08 + hash1f(seed + i * 17.0) * 0.12);
        vec2 sc = vec2(cos(subA), sin(subA)) * subD;
        float sd = length(p - sc);
        result += ring(sd, subR, subR * 0.02) * 0.8;
        result += smoothstep(subR * 0.12, 0.0, sd) * 0.25;
    }

    // Bright center core
    result += smoothstep(radius * 0.1, 0.0, d) * 0.7;

    result *= smoothstep(radius * 1.05, radius * 0.88, d);
    return result;
}

// ══════════════════════════════════════════════
//  STRUCTURE FAMILY 1: Segmented arcs
//  Broken concentric arcs at different radii
// ══════════════════════════════════════════════

float hubArcs(vec2 p, float seed, float radius) {
    float d = length(p);
    float angle = atan(p.y, p.x); // -PI to PI
    float result = 0.0;
    if (d > radius * 1.15) return 0.0;

    // Several partial arcs at different radii
    for (float i = 0.0; i < 5.0; i++) {
        float r = radius * (0.25 + hash1f(seed + i * 3.1) * 0.65);
        float startA = hash1f(seed + i * 7.7) * 6.283 - 3.1415926;
        float arcLen = 1.2 + hash1f(seed + i * 11.3) * 2.8;

        // Angular mask for the arc
        float a = mod(angle - startA + 6.2831853, 6.2831853);
        float arcMask = smoothstep(0.0, 0.08, a) * smoothstep(arcLen, arcLen - 0.08, a);

        result += ring(d, r, radius * 0.009) * arcMask * 0.65;
    }

    // 2 radial lines cutting through
    for (float i = 0.0; i < 2.0; i++) {
        float lineA = hash1f(seed + i * 23.0) * 6.283 - 3.1415926;
        float angleDiff = abs(mod(angle - lineA + 3.1415926, 6.2831853) - 3.1415926);
        float line = smoothstep(0.03, 0.0, angleDiff) * step(0.05, d / radius) * step(d / radius, 0.95);
        result += line * 0.25;
    }

    // Small center
    result += smoothstep(radius * 0.06, 0.0, d) * 0.5;

    result *= smoothstep(radius * 1.05, radius * 0.88, d);
    return result;
}

// ══════════════════════════════════════════════
//  STRUCTURE FAMILY 2: Dense cluster
//  Many small circles packed together
// ══════════════════════════════════════════════

float hubCluster(vec2 p, float seed, float radius) {
    float d = length(p);
    float result = 0.0;
    if (d > radius * 1.15) return 0.0;

    // Outer boundary ring
    result += ring(d, radius, radius * 0.008) * 0.8;

    // Many small sub-circles packed inside
    for (float i = 0.0; i < 7.0; i++) {
        float subA = hash1f(seed + i * 5.3) * 6.283;
        float subDist = hash1f(seed + i * 8.7) * radius * 0.7;
        float subR = radius * (0.06 + hash1f(seed + i * 13.1) * 0.1);
        vec2 sc = vec2(cos(subA), sin(subA)) * subDist;
        float sd = length(p - sc);

        result += ring(sd, subR, subR * 0.02) * 0.6;
        result += smoothstep(subR * 0.1, 0.0, sd) * 0.2;
    }

    result *= smoothstep(radius * 1.05, radius * 0.88, d);
    return result;
}

// ══════════════════════════════════════════════
//  STRUCTURE FAMILY 3: Linked nodes
//  Small circles connected by thin lines
// ══════════════════════════════════════════════

float hubLinked(vec2 p, float seed, float radius) {
    float d = length(p);
    float result = 0.0;
    if (d > radius * 1.15) return 0.0;

    // Generate 4-6 node positions
    vec2 nodes[6];
    float nNodes = floor(4.0 + hash1f(seed * 19.0) * 3.0);

    for (int ni = 0; ni < 6; ni++) {
        float fi = float(ni);
        if (fi >= nNodes) break;
        float na = hash1f(seed + fi * 4.3) * 6.283;
        float nd = hash1f(seed + fi * 7.9) * radius * 0.75;
        nodes[ni] = vec2(cos(na), sin(na)) * nd;

        float nodeD = length(p - nodes[ni]);
        float nodeR = radius * (0.04 + hash1f(seed + fi * 15.0) * 0.08);

        // Node circle
        result += ring(nodeD, nodeR, nodeR * 0.025) * 0.7;
        result += smoothstep(nodeR * 0.15, 0.0, nodeD) * 0.3;
    }

    // Connect consecutive nodes with thin lines
    for (int ni = 0; ni < 5; ni++) {
        float fi = float(ni);
        if (fi >= nNodes - 1.0) break;
        vec2 a = nodes[ni];
        vec2 b = nodes[ni + 1];
        vec2 ab = b - a;
        float abLen = length(ab);
        if (abLen < 0.001) continue;
        vec2 abDir = ab / abLen;

        float t = clamp(dot(p - a, abDir) / abLen, 0.0, 1.0);
        float lineDist = length(p - a - abDir * abLen * t);
        result += smoothstep(radius * 0.012, 0.0, lineDist) * 0.35;
    }

    // Center dot
    result += smoothstep(radius * 0.05, 0.0, d) * 0.4;

    result *= smoothstep(radius * 1.05, radius * 0.88, d);
    return result;
}

// ══════════════════════════════════════════════
//  DISTRICT DISPATCHER — picks structure family
// ══════════════════════════════════════════════

float districtStructure(vec2 p, float seed, float radius) {
    float typeSelect = fract(seed * 4.37);

    if (typeSelect < 0.35) return hubRadial(p, seed, radius);
    if (typeSelect < 0.55) return hubArcs(p, seed, radius);
    if (typeSelect < 0.75) return hubCluster(p, seed, radius);
    return hubLinked(p, seed, radius);
}

// ══════════════════════════════════════════════
//  3D SPHERE-NATIVE HUB PLACEMENT (no seams)
// ══════════════════════════════════════════════

float sampleHubs3D(vec3 pos, float scale, float seedOffset, float sparsity) {
    vec3 sp = pos * scale;
    vec3 cell = floor(sp);
    float result = 0.0;

    for (int k = -1; k <= 1; k++)
    for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
        vec3 nb = vec3(float(i), float(j), float(k));
        vec3 cid = cell + nb;

        if (hash3D(cid + seedOffset + 77.0) > sparsity) continue;

        vec3 cOff = vec3(
            hash3D(cid + seedOffset),
            hash3D(cid + seedOffset + 31.0),
            hash3D(cid + seedOffset + 67.0)
        );
        vec3 raw = (cid + cOff) / scale;

        float cLen = length(raw);
        if (cLen < 0.4 || cLen > 1.6) continue;

        vec3 cDir = normalize(raw);

        float ang = acos(clamp(dot(pos, cDir), -1.0, 1.0));
        float seed = hash3D(cid + seedOffset * 0.1);
        float radius = 0.04 + seed * 0.14;

        if (ang > radius * 1.5) continue;

        vec3 up = abs(cDir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
        vec3 tangent = normalize(cross(up, cDir));
        vec3 bitangent = cross(cDir, tangent);

        vec3 diff = pos - cDir * dot(pos, cDir);
        vec2 localP = vec2(dot(diff, tangent), dot(diff, bitangent));

        // Per-hub brightness hierarchy: most dim, few medium, 2-3 landmark
        float hubBright = hash3D(cid + seedOffset + 200.0);
        float isLandmark = step(hubBright, 0.1); // top ~10%
        hubBright = hubBright < 0.1  ? 2.2   // 2-3 landmark hubs
                  : hubBright < 0.35 ? 1.1   // several bright
                  : hubBright < 0.6  ? 0.5   // some medium
                  : 0.22;                     // most very dim

        // Landmark hubs get slightly larger radius
        float adjRadius = radius * (1.0 + isLandmark * 0.25);

        result += districtStructure(localP, seed + seedOffset, adjRadius) * hubBright;
    }

    return result;
}

// ══════════════════════════════════════════════
//  FINE URBAN GRID — rectilinear micro-network
// ══════════════════════════════════════════════

float urbanGrid(vec3 pos, float density) {
    // Triplanar projected rectilinear grid — fine scale hides seam artifacts
    vec3 w = abs(pos);
    w = pow(w, vec3(8.0));
    w /= dot(w, vec3(1.0));

    float scale = 50.0;

    // Grid lines on each plane
    vec2 uvYZ = pos.yz * scale;
    vec2 uvXZ = pos.xz * scale;
    vec2 uvXY = pos.xy * scale;

    // Thin grid lines at integer positions
    float lineW = 0.04;
    float gYZ = smoothstep(lineW, 0.0, min(abs(fract(uvYZ.x) - 0.5) * 2.0, abs(fract(uvYZ.y) - 0.5) * 2.0));
    float gXZ = smoothstep(lineW, 0.0, min(abs(fract(uvXZ.x) - 0.5) * 2.0, abs(fract(uvXZ.y) - 0.5) * 2.0));
    float gXY = smoothstep(lineW, 0.0, min(abs(fract(uvXY.x) - 0.5) * 2.0, abs(fract(uvXY.y) - 0.5) * 2.0));

    float grid = gYZ * w.x + gXZ * w.y + gXY * w.z;

    // Only visible in urbanized areas, very dim
    return grid * density * 0.05;
}

// ══════════════════════════════════════════════
//  TRANSPORT / POWER LINES — thin straight-ish connections
// ══════════════════════════════════════════════

float transportLines(vec3 pos) {
    // Use triplanar thin lines at low frequency for long-range connections
    vec3 w = abs(pos);
    w = pow(w, vec3(6.0));
    w /= dot(w, vec3(1.0));

    float scale = 10.0;
    float lineW = 0.008;

    // Slightly warped for natural feel
    vec3 warpedPos = pos + vec3(
        snoise(pos * 2.0) * 0.03,
        snoise(pos * 2.0 + 50.0) * 0.03,
        snoise(pos * 2.0 + 100.0) * 0.03
    );

    float lYZ = smoothstep(lineW, 0.0, abs(fract(warpedPos.y * scale) - 0.5) * 2.0 - (1.0 - lineW * 2.0));
    lYZ += smoothstep(lineW, 0.0, abs(fract(warpedPos.z * scale) - 0.5) * 2.0 - (1.0 - lineW * 2.0));

    float lXZ = smoothstep(lineW, 0.0, abs(fract(warpedPos.x * scale) - 0.5) * 2.0 - (1.0 - lineW * 2.0));
    lXZ += smoothstep(lineW, 0.0, abs(fract(warpedPos.z * scale * 0.8 + 0.3) - 0.5) * 2.0 - (1.0 - lineW * 2.0));

    float lXY = smoothstep(lineW, 0.0, abs(fract(warpedPos.x * scale * 0.9 + 0.15) - 0.5) * 2.0 - (1.0 - lineW * 2.0));
    lXY += smoothstep(lineW, 0.0, abs(fract(warpedPos.y * scale * 1.1) - 0.5) * 2.0 - (1.0 - lineW * 2.0));

    float lines = lYZ * w.x + lXZ * w.y + lXY * w.z;
    return clamp(lines, 0.0, 1.0) * 0.12;
}

// ══════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════

void main() {
    vec3 normal = normalize(vNormal);
    vec3 nPos = normalize(vPosition);
    vec3 viewDir = normalize(cameraPosition - vPixelPosition);

    // ── Lighting ──
    float NdotL = -dot(normal, uLightDirection);
    float lightIntensity = max(NdotL, 0.0);
    float terminator = smoothstep(-0.15, 0.45, NdotL);
    float darkSide = 1.0 - terminator;

    // ══════════════════════════════════════════
    //  URBAN DENSITY MAP — regional variation
    // ══════════════════════════════════════════

    float density = fbm(nPos * 2.5) * 0.5 + 0.5;
    float urbanMask = smoothstep(0.35, 0.8, density);

    // Secondary variation — breaks uniformity
    float density2 = snoise(nPos * 7.0) * 0.5 + 0.5;
    urbanMask *= mix(0.2, 1.0, density2);

    // Tertiary fragmentation — dark gaps, corridors, industrial voids
    float gaps = snoise(nPos * 14.0) * 0.5 + 0.5;
    urbanMask *= smoothstep(0.15, 0.45, gaps);

    // 1-2 directional hotspots — concentrated dense regions
    float hotspot1 = smoothstep(0.45, 0.85, dot(nPos, normalize(vec3(0.3, 0.7, -0.5))));
    float hotspot2 = smoothstep(0.55, 0.88, dot(nPos, normalize(vec3(-0.6, -0.2, 0.7))));
    urbanMask = max(urbanMask, hotspot1 * 0.85);
    urbanMask = max(urbanMask, hotspot2 * 0.6);

    // ══════════════════════════════════════════
    //  CITY LAYERS
    // ══════════════════════════════════════════

    // ── Geometric hubs (3D seamless placement) ──
    float hubs = 0.0;
    // Few large hubs
    hubs += sampleHubs3D(nPos, 1.8, 0.0, 0.13) * 1.3;
    // More medium hubs
    hubs += sampleHubs3D(nPos, 3.5, 17.0, 0.10) * 0.7;
    // Many small hubs
    hubs += sampleHubs3D(nPos, 6.0, 33.0, 0.08) * 0.35;

    // ── Transport lines — brighter near hubs, subtle elsewhere ──
    float transportRaw = transportLines(nPos);
    float transportBoost = max(urbanMask, smoothstep(0.0, 0.1, hubs) * 0.8);
    float transport = transportRaw * mix(0.15, 1.0, transportBoost);

    // ── Fine urban grid ──
    float grid = urbanGrid(nPos, urbanMask);

    // ── Micro-urban layer — dense near hubs, fading into corridors ──
    float hubProximity = smoothstep(0.0, 0.15, hubs); // tight halo around hubs
    float hubHalo = smoothstep(0.0, 0.05, hubs);      // wider faint halo
    float microMask = max(hubProximity * 0.9, hubHalo * 0.4);
    microMask = max(microMask, urbanMask * 0.15); // whisper elsewhere

    float micro = 0.0;
    // Scattered building lights
    micro += max(0.0, snoise(nPos * 100.0)) * 0.04;
    // Tiny node clusters at higher frequency
    micro += max(0.0, snoise(nPos * 180.0 + 20.0)) * 0.02;
    // Faint grid fragments — broken micro-blocks
    float microGrid = max(0.0, snoise(nPos * 60.0)) * 0.5 + 0.5;
    microGrid *= smoothstep(0.45, 0.55, fract(nPos.x * 40.0 + snoise(nPos * 8.0) * 2.0));
    micro += microGrid * 0.018;
    micro *= microMask;

    // ══════════════════════════════════════════
    //  COMBINE — strong hierarchy
    // ══════════════════════════════════════════

    float cityLight = 0.0;
    cityLight += hubs;                    // geometric districts (dominant)
    cityLight += transport;               // connecting lines (subtle)
    cityLight += grid;                    // micro grid (very faint)
    cityLight += micro;                   // sparkle (barely there)

    cityLight = clamp(cityLight, 0.0, 2.5);

    // ══════════════════════════════════════════
    //  COLOR PALETTE — ember to white-hot
    // ══════════════════════════════════════════

    vec3 dimEmber   = vec3(0.35, 0.12, 0.03);
    vec3 warmOrange = vec3(0.8, 0.4, 0.08);
    vec3 goldenHub  = vec3(1.0, 0.7, 0.3);
    vec3 hotWhite   = vec3(1.5, 1.2, 0.8);

    vec3 cityColor = mix(dimEmber, warmOrange, smoothstep(0.05, 0.4, cityLight));
    cityColor = mix(cityColor, goldenHub, smoothstep(0.5, 1.0, cityLight));
    cityColor = mix(cityColor, hotWhite, smoothstep(1.2, 2.0, cityLight));

    // ══════════════════════════════════════════
    //  SURFACE MATERIAL — dark worn metallic
    // ══════════════════════════════════════════

    vec3 surfaceColor = vec3(0.03, 0.018, 0.01);

    // Surface variation — worn, uneven
    float surfVar = snoise(nPos * 12.0) * 0.5 + 0.5;
    surfaceColor *= 0.65 + surfVar * 0.5;


    // ══════════════════════════════════════════
    //  SPECULAR
    // ══════════════════════════════════════════

    vec3 halfDir = normalize(viewDir - uLightDirection);
    float spec = pow(max(dot(normal, halfDir), 0.0), 50.0);

    // ══════════════════════════════════════════
    //  EMISSIVE CITY LIGHTS — embedded in crust
    // ══════════════════════════════════════════

    // Steepen hierarchy: compress dim lights, preserve bright peaks
    float displayLight = cityLight * smoothstep(0.0, 0.15, cityLight);

    vec3 emissive = cityColor * displayLight;

    // Dark side: full brightness. Lit side: only structured detail survives.
    // Hubs stay visible on lit side, diffuse glow gets killed.
    float structuredness = smoothstep(0.0, 0.25, hubs); // 1 near hubs, 0 in flat areas
    float litSideRetain = mix(0.06, 0.25, structuredness); // hubs keep more emissive
    float emissiveStrength = mix(1.6, litSideRetain, terminator);
    emissive *= emissiveStrength;

    // ══════════════════════════════════════════
    //  FINAL COMPOSITION
    // ══════════════════════════════════════════

    // Darken surface where city lights are — stronger recess for bright hubs
    float recessAmount = smoothstep(0.0, 0.3, cityLight) * 0.5 + smoothstep(0.5, 1.5, cityLight) * 0.2;
    vec3 recessedSurface = surfaceColor * (1.0 - recessAmount);

    vec3 darkBase = recessedSurface * 0.015;
    vec3 litSide = recessedSurface * lightIntensity * 0.4;
    litSide += spec * vec3(0.04, 0.025, 0.01) * lightIntensity;

    vec3 color = mix(darkBase, litSide, terminator);
    color += emissive;

    // ── Atmospheric rim ──
    float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);

    // Thin cool outer rim — visible all around
    vec3 coolRim = vec3(0.08, 0.12, 0.25) * pow(fresnel, 4.5) * 0.32;
    // Warm inner glow near lit edge — scattered city light in haze
    vec3 warmRim = vec3(0.35, 0.18, 0.06) * pow(fresnel, 2.0) * urbanMask * 0.16;
    // Urban haze — subtle amber diffusion on dark side
    vec3 urbanHaze = vec3(0.2, 0.1, 0.04) * pow(fresnel, 3.0) * urbanMask * darkSide * 0.1;

    color += coolRim * (0.35 + darkSide * 0.65);
    color += warmRim * mix(0.3, 1.0, smoothstep(0.0, 0.4, NdotL)); // warm near lit edge
    color += urbanHaze;

    // Gentle limb darkening on the surface itself
    color *= 1.0 - pow(fresnel, 4.0) * 0.15;

    gl_FragColor = vec4(color, 1.0);
}
