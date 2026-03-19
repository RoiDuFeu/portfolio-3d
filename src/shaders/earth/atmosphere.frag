uniform vec3 uLightDirection;

varying vec3 vPixelPosition;
varying vec3 vNormal;

void main() {
    vec3 atmosphereColor = vec3(0.0, 0.2, 1.0); // Blue atmosphere

    float dotProduct = -dot(vNormal, uLightDirection);
    float maxDotProduct = max(dotProduct, 0.0);

    vec3 viewDirection = normalize(cameraPosition - vPixelPosition);
    float edgeDotProduct = 1.0 - dot(vNormal, viewDirection);

    float fuzziness = smoothstep(0.0, 0.2, 1.0 - abs(edgeDotProduct));

    gl_FragColor = vec4(atmosphereColor, maxDotProduct * edgeDotProduct * fuzziness);
}
