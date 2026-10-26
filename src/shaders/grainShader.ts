/**
 * Authentic Leeroy Atmos 12-FPS Film Grain Shader
 * Extracted 1:1 from atmos.leeroy.ca
 */
export const GrainShader = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float uXCount;
    uniform float uYCount;
    uniform float uIntensity;
    varying vec2 vUv;

    const float speed = 12.0;

    float random2d(vec2 coord) {
      return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 inputColor = texture2D(tDiffuse, vUv);
      float gridX = floor(vUv.x * uXCount) / uXCount;
      float gridY = 1.0 - floor(vUv.y * uYCount) / uYCount;
      float t = mod(time, 10.0);
      float timeSpeed = floor(t * speed); // 12 FPS stop-motion film grain jitter
      float light = (inputColor.r + inputColor.g + inputColor.b) / 3.0;
      float grain = random2d(vec2(gridX + timeSpeed + light / 100000.0, gridY)) * uIntensity;

      grain -= grain * 0.5;

      gl_FragColor = vec4(inputColor.rgb + vec3(grain), inputColor.a);
    }
  `
};
