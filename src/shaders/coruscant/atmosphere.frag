#include "../lib/noise.glsl"

uniform vec3 uLightDirection;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPixelPosition;
varying vec3 vPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 nPos = normalize(vPosition);

    // Directional light
    float NdotL = -dot(normal, uLightDirection);
    float lightInfluence = max(NdotL, 0.0);
    float darkSide = 1.0 - smoothstep(-0.15, 0.4, NdotL);

    // Fresnel limb glow
    vec3 viewDir = normalize(cameraPosition - vPixelPosition);
    float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
    float limbGlow = pow(fresnel, 6.0);

    // ── Dual-tone rim: cool outer + warm inner ──
    // Cool blue-grey outer edge (thin atmosphere)
    vec3 coolColor = vec3(0.12, 0.15, 0.28);
    // Warm amber (scattered city light / pollution)
    vec3 warmColor = vec3(0.35, 0.18, 0.06);

    // Lit side gets the cool atmospheric color
    // Dark side gets warm city-light scatter
    vec3 color = mix(warmColor, coolColor, smoothstep(0.0, 0.6, lightInfluence));

    // Terminator accent — warm glow at the day/night boundary
    float terminatorGlow = smoothstep(0.0, 0.35, NdotL) * smoothstep(0.55, 0.2, NdotL);
    color += vec3(0.25, 0.12, 0.04) * terminatorGlow;

    // Dark side: boost warm component from city scatter
    color = mix(color, warmColor * 1.2, darkSide * 0.4);

    // Scatter factor
    float scatter = smoothstep(-0.3, 0.2, NdotL) * 0.35 + 0.15;

    // Wispy haze patches in atmosphere
    float t = uTime * 0.004;
    vec3 hazePos = nPos + vec3(t * 0.12, t * 0.04, t * -0.08);
    float haze = fbm(hazePos * 3.5);
    haze = smoothstep(0.1, 0.5, haze);
    float hazeAtLimb = haze * pow(fresnel, 2.0) * 0.15;

    // Haze color: polluted brown
    vec3 hazeColor = mix(vec3(0.08, 0.05, 0.03), vec3(0.15, 0.1, 0.05), lightInfluence);
    color = mix(color, hazeColor, hazeAtLimb);

    float alpha = limbGlow * scatter * 0.05;
    alpha += hazeAtLimb * scatter * 0.25;

    gl_FragColor = vec4(color, alpha);
}
