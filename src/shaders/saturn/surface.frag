uniform sampler2D uTexture;
uniform vec3 uLightDirection;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPixelPosition;

void main() {
    // Base texture color
    vec3 textureColor = texture2D(uTexture, vUv).rgb;
    
    // Simple diffuse lighting (no specular for gas giant)
    float dotProduct = -dot(normalize(vNormal), uLightDirection);
    float lightIntensity = max(dotProduct, 0.0);
    
    // Add ambient light to avoid pure black shadows
    float ambientStrength = 0.2;
    vec3 ambient = ambientStrength * textureColor;
    
    // Diffuse component
    vec3 diffuse = lightIntensity * textureColor;
    
    // Final color
    vec3 result = ambient + diffuse;
    
    gl_FragColor = vec4(result, 1.0);
}
