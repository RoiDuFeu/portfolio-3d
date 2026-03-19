varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPixelPosition;

void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vPixelPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
