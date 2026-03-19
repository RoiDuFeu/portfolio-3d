#include "./includes/visibility.glsl"

varying float vUVY;
varying float vOpacity;
varying vec3  vColor;
varying vec3  vNormal;

uniform float uAlphaBlended;

void main(void) {
    // Solid ribbon center with soft falloff to edges
    float alpha = 1.0 - smoothstep(0.0, 1.0, abs(vUVY));
    alpha *= alpha;
    alpha *= vOpacity;
    alpha *= getAlpha(vNormal);

    gl_FragColor = vec4(vColor * alpha, alpha);
}
