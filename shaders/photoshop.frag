#define GAMMA_LUMA vec3(0.2126, 0.7152, 0.0722)
#define LINEAR_LUMA vec3(0.2989, 0.5870, 0.1140)
#define LUMA LINEAR_LUMA

// GLSL Viewer
#define vUv v_texcoord

uniform sampler2D inputImage;

varying vec2 v_texcoord;

vec3 phBrightness(vec3 a, float brightness) {
    return a + vec3(brightness);
}

vec3 phBrightnessLuma(vec3 a, float brightness) {
    vec3 luma = LUMA;
    return a + vec3(brightness) * luma;
}

vec3 phContrast(vec3 a, float contrast) {
    return (a - vec3(0.5)) * (1.0 + contrast) + vec3(0.5);
}

vec3 phContrastMultiply(vec3 a, float contrast) {
    return a * (1.0 + contrast);
}

vec3 phSaturation(vec3 a, float saturation) {
    vec3 luma = LUMA;
    vec3 dotLuma = vec3(dot(a, luma));
    return a + saturation * (a - dotLuma);
}

vec3 phContrastBrightnessSaturation(vec3 a, float contrast, float brightness, float saturation) {
    return phSaturation(phBrightness(phContrast(a, contrast), brightness), saturation);
}

void main() {
    vec3 color = texture2D(inputImage, vUv).xyz;
    
    vec3 result = color;
    result = phContrast(result, 1.0);
    result = phBrightness(result, 0.4);
    result = phSaturation(result, 0.5);

    gl_FragColor = vec4(result, 1.0);
}