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

    // Fresnel limb glow
    vec3 viewDir = normalize(cameraPosition - vPixelPosition);
    float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
    float limbGlow = pow(fresnel, 4.5);

    // Color: bluish-white on lit side, faint on dark side
    vec3 litColor = vec3(0.5, 0.55, 0.8);
    vec3 darkColor = vec3(0.2, 0.25, 0.5);
    vec3 color = mix(darkColor, litColor, lightInfluence);

    // Warm tint at the terminator
    float terminatorGlow = smoothstep(0.0, 0.4, NdotL) * smoothstep(0.6, 0.2, NdotL);
    color += vec3(0.3, 0.2, 0.08) * terminatorGlow;

    float scatter = smoothstep(-0.3, 0.2, NdotL) * 0.5 + 0.3;
    float alpha = limbGlow * scatter * 0.35;

    // ── Wispy cloud patches in the atmosphere ──
    float t = uTime * 0.004;
    vec3 cloudPos = nPos + vec3(t * 0.15, t * 0.05, t * -0.1);

    float cloud = fbm(cloudPos * 3.0);
    cloud = smoothstep(0.05, 0.5, cloud);

    // Clouds add density to the atmosphere at the limb
    float cloudAtLimb = cloud * pow(fresnel, 2.0) * 0.25;

    // Cloud color slightly warmer (smog)
    vec3 cloudColor = mix(vec3(0.15, 0.12, 0.1), vec3(0.25, 0.22, 0.2), lightInfluence);

    // Blend cloud into atmosphere
    color = mix(color, cloudColor, cloudAtLimb * 2.0);
    alpha += cloudAtLimb * scatter;

    gl_FragColor = vec4(color, alpha);
}
