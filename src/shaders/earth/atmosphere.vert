varying vec3 vPixelPosition;
varying vec3 vNormal;

void main() {
    vPixelPosition = mat3(modelMatrix) * position;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
