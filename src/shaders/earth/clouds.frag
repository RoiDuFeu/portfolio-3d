uniform sampler2D uCloudCover;
uniform vec3 uLightDirection;

varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vec4 diffuseColor = texture2D(uCloudCover, vUv);

    float dotProduct = -dot(vNormal, uLightDirection);
    float maxDotProduct = max(dotProduct, 0.0);
    vec4 diffuse = maxDotProduct * diffuseColor;

    gl_FragColor = diffuse;
}
