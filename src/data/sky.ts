export interface SkyGradientStop {
  progress: number;
  top: [number, number, number];
  bot: [number, number, number];
  noise: [number, number, number];
}

export const SKY_GRADIENT_STOPS: SkyGradientStop[] = [
  { progress: 0.0, top: [8, 37, 198], bot: [159, 181, 205], noise: [8, 37, 198] },
  { progress: 0.15, top: [8, 37, 198], bot: [196, 203, 244], noise: [0, 27, 181] },
  { progress: 0.3, top: [116, 136, 234], bot: [255, 192, 148], noise: [116, 136, 234] },
  { progress: 0.45, top: [255, 192, 148], bot: [222, 229, 253], noise: [136, 162, 247] },
  { progress: 0.6, top: [136, 162, 247], bot: [222, 229, 253], noise: [255, 192, 148] },
  { progress: 0.75, top: [253, 175, 120], bot: [255, 230, 213], noise: [253, 175, 120] },
  { progress: 0.88, top: [253, 175, 120], bot: [197, 211, 254], noise: [90, 108, 216] },
  { progress: 1.0, top: [90, 108, 216], bot: [197, 211, 254], noise: [90, 108, 216] },
];
