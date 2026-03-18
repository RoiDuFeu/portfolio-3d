uniform vec3 u_color;
uniform float u_intensity;
uniform float u_exponent;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), u_exponent);
  gl_FragColor = vec4(u_color, fresnel * u_intensity);
}
