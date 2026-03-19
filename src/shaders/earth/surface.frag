uniform sampler2D uWorldMap;
uniform sampler2D uSpecularMap;
uniform sampler2D uNormalMap;
uniform sampler2D uCloudCover;
uniform sampler2D uNightLights;
uniform vec3 uLightDirection;

varying vec3 vPixelPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vVertexPosition;

// Tangent-space normal mapping function
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
    // Diffuse lighting with normal mapping
    vec3 diffuseColor = vec3(texture2D(uWorldMap, vUv));
    vec3 normal = perturbNormal2Arb(vNormal);
    float dotProduct = -dot(normal, uLightDirection);
    float maxDotProduct = max(dotProduct, 0.0);
    vec3 diffuse = maxDotProduct * diffuseColor;

    // Cloud cover for shadow projection
    vec4 cloudColor = texture2D(uCloudCover, vUv);

    // Specular reflection with cloud shadow subtraction
    float shininess = 20.0;
    float specularStrength = (texture2D(uSpecularMap, vUv).r * 2.0) - cloudColor.a;
    vec3 viewDir = normalize(cameraPosition - vPixelPosition);
    vec3 reflectDir = reflect(-uLightDirection, normal);
    float spec = pow(max(-dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specularColor = vec3(1.0, 0.8, 0.3);
    vec3 specular = spec * specularColor * specularStrength;
    vec3 result = diffuse + specular;

    // Night lights with smooth day/night transition
    vec3 nightLights = vec3(texture2D(uNightLights, vUv));
    float dayNightThreshold = smoothstep(-0.05, 0.05, -dot(vNormal, uLightDirection));
    result = mix(nightLights, result, dayNightThreshold);

    gl_FragColor = vec4(result, 1.0);
}
