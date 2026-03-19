uniform float uVisibility;
uniform float uDirection;
uniform vec3  uLightView;

// Returns alpha based on normal vs light direction
// With uVisibility=1.0, everything is fully visible
float getAlpha(vec3 n){
  float nDotL = dot(n, uLightView) * uDirection;
  return smoothstep(1.0, 1.5, nDotL + uVisibility * 2.5);
}
