varying vec2 vUv;
varying vec3 vPixelPosition;
varying vec3 vNormal;
varying vec3 vVertexPosition;

void main() {
  vNormal = mat3(modelMatrix) * normal;
  vPixelPosition = mat3(modelMatrix) * position;
  vUv = uv;

  vec4 finalVertexPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vVertexPosition = vec3(finalVertexPosition);

  gl_Position = finalVertexPosition;
}
