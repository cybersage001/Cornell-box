export const screenVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const screenFragmentShader = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tTexture;

void main() {
    vec3 color = texture2D(tTexture, vUv).rgb;
    
    // Tone Mapping (Reinhard)
    color = color / (color + vec3(1.0));
    
    // Gamma Correction
    color = pow(color, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(color, 1.0);
}`;

// 添加一个空的默认导出，使这个文件被识别为一个模块
export default {};