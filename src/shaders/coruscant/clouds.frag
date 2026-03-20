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

    // Slow-drifting clouds
    float t = uTime * 0.006;
    vec3 warp = nPos + vec3(t * 0.25, t * 0.08, t * -0.15);

    // ── Wispy streak-like clouds, not dense blobs ──
    // Use stretched coordinates to create elongated wisps
    vec3 stretchedPos = warp * vec3(4.0, 2.0, 4.0);

    float cloud1 = snoise(stretchedPos * 2.5);
    float cloud2 = snoise(stretchedPos * 5.0 + 7.0);
    float cloud3 = snoise(stretchedPos * 10.0 + 15.0);

    // Thin streaks: sharper thresholds, less coverage
    float clouds = smoothstep(0.3, 0.6, cloud1) * 0.18;
    clouds += smoothstep(0.35, 0.65, cloud2) * 0.1;
    clouds += smoothstep(0.4, 0.7, cloud3) * 0.04;

    // Band structure — clouds concentrated in belts
    float bands = smoothstep(-0.3, 0.4, sin(nPos.y * 5.0 + snoise(nPos * 2.5) * 1.8));
    clouds *= mix(0.15, 1.0, bands);

    // Very thin overall — never opaque
    clouds = clamp(clouds, 0.0, 0.22);

    // ── Cloud color: polluted brown/amber, not white ──
    // Lit side: warm grey-brown (industrial haze)
    vec3 litCloud = vec3(0.35, 0.28, 0.22) * (0.25 + lightIntensity * 0.75);

    // Dark side: faint warm underglow from city lights below
    vec3 darkCloud = vec3(0.08, 0.04, 0.02) * (1.0 - terminator);

    vec3 cloudColor = litCloud * terminator + darkCloud;

    // Slight limb brightening
    vec3 viewDir = normalize(cameraPosition - vPixelPosition);
    float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
    clouds *= 1.0 + fresnel * 0.25;

    gl_FragColor = vec4(cloudColor, clouds);
}
