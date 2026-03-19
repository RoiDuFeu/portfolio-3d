#include "./includes/visibility.glsl"

varying float vRadial;
varying vec3 vWorld;

uniform float uTint;
uniform float uBrightness;
uniform float uFalloffColor;

vec3 brightnessToColor(float b){
  b *= uTint;
  return (vec3(b, b*b, b*b*b*b) / (uTint)) * uBrightness;
}

void main(void){
    // Exponential falloff — no hard inner edge
    float t = 1.0 - vRadial;
    float alpha = exp(-3.0 * (1.0 - t)) * t * t;
    float brightness = 1.0 + alpha * uFalloffColor;
    alpha *= getAlpha(normalize(vWorld));
    gl_FragColor.xyz = brightnessToColor(brightness) * alpha;
    gl_FragColor.w = alpha;
}
