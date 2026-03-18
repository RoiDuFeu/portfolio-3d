varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocalPosition;

void main() {
  vLocalPosition = position;
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelMatrix * vec4(position, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
