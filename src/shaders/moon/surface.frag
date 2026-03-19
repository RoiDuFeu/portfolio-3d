uniform sampler2D uTexture;
uniform sampler2D uNormalMap;
uniform vec3 uLightDirection;

varying vec3 vPixelPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vVertexPosition;

// Tangent-space normal mapping function (reused from Earth)
vec3 perturbNormal2Arb(vec3 surf_norm) {
    vec3 q0 = vec3(dFdx(vVertexPosition.x), dFdx(vVertexPosition.y), dFdx(vVertexPosition.z));
    vec3 q1 = vec3(dFdy(vVertexPosition.x), dFdy(vVertexPosition.y), dFdy(vVertexPosition.z));
    vec2 st0 = dFdx(vUv.st);
    vec2 st1 = dFdy(vUv.st);
    float scale = sign(st1.t * st0.s - st0.t * st1.s);
    vec3 S = normalize((q0 * st1.t - q1 * st0.t) * scale);
    vec3 T = normalize((-q0 * st1.s + q1 * st0.s) * scale);
    vec3 N = normalize(surf_norm);
    mat3 tsn = mat3(S, T, N);
    vec3 mapN = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
    vec2 normalScale = vec2(1.0, 1.0);
    mapN.xy *= normalScale;
    mapN.xy *= (float(gl_FrontFacing) * 2.0 - 1.0);
    return normalize(tsn * mapN);
}

void main() {
    // Base lunar gray texture
    vec3 lunarColor = texture2D(uTexture, vUv).rgb;
    
    // Apply normal mapping for crater detail
    vec3 normal = perturbNormal2Arb(vNormal);
    
    // Diffuse lighting (no specular - matte lunar surface)
    float dotProduct = -dot(normal, uLightDirection);
    float lightIntensity = max(dotProduct, 0.0);
    
    // Ambient light (moon has no atmosphere, but we add slight ambient for visibility)
    float ambientStrength = 0.15;
    vec3 ambient = ambientStrength * lunarColor;
    
    // Diffuse component
    vec3 diffuse = lightIntensity * lunarColor;
    
    // Final color (no specular - powdery surface)
    vec3 result = ambient + diffuse;
    
    gl_FragColor = vec4(result, 1.0);
}
