uniform float u_time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Subtle breathing pulse
  float pulse = sin(u_time * 0.5) * 0.02;
  vec3 newPosition = position * (1.0 + pulse);

  vPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
