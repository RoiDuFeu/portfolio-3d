#include "../lib/noise.glsl"

uniform vec3 uLightDirection;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPixelPosition;
varying vec3 vPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 nPos = normalize(vPosition);

    // Directional lighting
    float NdotL = -dot(normal, uLightDirection);
    float lightIntensity = max(NdotL, 0.0);
    float terminator = smoothstep(-0.1, 0.3, NdotL);

    // Slow-drifting smog/haze
    float t = uTime * 0.005;
    vec3 warp = nPos + vec3(t * 0.2, t * 0.08, t * -0.15);

    // Large wispy patches — not uniform coverage
    float cloud1 = fbm(warp * 2.5);
    float cloud2 = fbm(warp * 5.0 + 3.0);

    // Only keep the denser parts (sparse patches)
    float clouds = smoothstep(0.15, 0.55, cloud1) * 0.5;
    clouds += smoothstep(0.2, 0.6, cloud2) * 0.25;

    // Modulate by large-scale to create distinct cloud banks
    float bankMask = smoothstep(-0.1, 0.4, snoise(nPos * 1.5 + t * 0.1));
    clouds *= bankMask;

    clouds = clamp(clouds, 0.0, 0.5);

    // Cloud color: warm brown smog (not cool grey)
    vec3 litCloud = vec3(0.16, 0.11, 0.07) * (0.4 + lightIntensity * 1.0);

    // Dark side: warm underglow from city lights below
    vec3 darkCloud = vec3(0.05, 0.03, 0.015) * (1.0 - terminator);

    vec3 cloudColor = litCloud * terminator + darkCloud;

    // Slightly more visible at grazing angles
    vec3 viewDir = normalize(cameraPosition - vPixelPosition);
    float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
    clouds *= 1.0 + fresnel * 0.3;

    gl_FragColor = vec4(cloudColor, clouds);
}
