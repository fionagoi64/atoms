export interface CloudConfig {
  type: 1 | 2;
  progress: number;
  pos: [number, number, number];
  scale?: [number, number, number];
  rot?: [number, number, number];
}

export const CLOUD_CONFIGS: CloudConfig[] = [
  { type: 1, progress: 0.034, pos: [5.5, -4.6, 0], scale: [3, 3, 3] },
  { type: 1, progress: 0.037, pos: [10.7, 1, 0], scale: [2, 2, 2] },
  { type: 1, progress: 0.1, pos: [-0.5, -4.5, 0], rot: [0, Math.PI, 0] },
  { type: 1, progress: 0.12, pos: [-4, -1, 0], scale: [1.3, 1.3, 1.3] },
  { type: 2, progress: 0.16, pos: [3.5, -1, 0], scale: [1, 1, 1] },
  { type: 1, progress: 0.18, pos: [-3, -1, 0] },
  { type: 2, progress: 0.22, pos: [-4.5, 1.5, 0], scale: [-1, 1, 1] },
  { type: 1, progress: 0.25, pos: [0, -4.5, 0], scale: [-1, 1, 1], rot: [0, Math.PI, 0] },
  { type: 2, progress: 0.28, pos: [-4, 1.5, 0], scale: [-1, 1, 1] },
  { type: 1, progress: 0.32, pos: [3.5, 0.5, 0], scale: [1, 1, -1] },
  { type: 2, progress: 0.37, pos: [-2.5, -3, 0] },
  { type: 1, progress: 0.4, pos: [2, 1.5, 0] },
  { type: 1, progress: 0.46, pos: [2.5, 1.5, 0], scale: [1, 1, -1] },
  { type: 1, progress: 0.5, pos: [-3, -1.5, 0], scale: [-1.2, 1.2, 1.2] },
  { type: 1, progress: 0.55, pos: [-2.5, 1.5, 0], scale: [-1, 1, 1] },
  { type: 2, progress: 0.6, pos: [3, -3, 0], rot: [0, Math.PI, 0] },
  { type: 1, progress: 0.62, pos: [-3, 2, 0] },
  { type: 1, progress: 0.65, pos: [3, -2, 0], rot: [0, Math.PI, 0] },
  { type: 1, progress: 0.69, pos: [4, -2.5, 0], scale: [0.3, 0.3, 0.3] },
  { type: 1, progress: 0.7, pos: [-3, 1, 0], scale: [0.35, 0.35, 0.35] },
  { type: 1, progress: 0.76, pos: [-4, -1, 0], scale: [-1.5, 1.5, 1.5] },
  { type: 1, progress: 0.85, pos: [-0.5, -4.5, 0], rot: [0, Math.PI, 0] },
  { type: 1, progress: 0.87, pos: [-3, -1, 0], rot: [-1, Math.PI, 0] },
  // Secondary atmospheric layer (cm array from original Atmos)
  { type: 1, progress: 0.053, pos: [-7, -6, 0], scale: [-3.5, 3.5, -3.5] },
  { type: 2, progress: 0.05, pos: [-15, 0, 0], scale: [-2.5, 2.5, 2.5] },
  { type: 2, progress: 0.08, pos: [8, 6, 0], scale: [-2, 2, -2] },
  { type: 1, progress: 0.09, pos: [8, -6, 0], scale: [2.5, 2.5, -2.5] },
  { type: 2, progress: 0.13, pos: [8, 6, 0], scale: [2.5, 2.5, -2.5] },
  { type: 1, progress: 0.185, pos: [-9, 6, 0], scale: [1.8, 1.8, 1.8] },
  { type: 2, progress: 0.2, pos: [8, 6, 0], scale: [2, 2, 2] },
  { type: 1, progress: 0.24, pos: [8, 0, 0], scale: [2, 2, 2] },
  { type: 1, progress: 0.32, pos: [-5, 0, 0], scale: [1.5, 1.5, 1.5] },
  { type: 1, progress: 0.32, pos: [-5, 0, 0], scale: [1.5, 1.5, 1.5] },
  { type: 1, progress: 0.35, pos: [-5, 2, 0], scale: [-0.5, 0.5, 0.5] },
  { type: 2, progress: 0.36, pos: [5, -1, 0], scale: [-0.5, 0.5, 0.5] },
  { type: 2, progress: 0.41, pos: [9, -9, 0], scale: [3, 3, 3] },
  { type: 2, progress: 0.42, pos: [-9, -9, 0], scale: [3, 3, 3] },
  { type: 2, progress: 0.43, pos: [-9, 7, 0], scale: [3, 3, 3] },
  { type: 2, progress: 0.57, pos: [9, 0, 0], scale: [2, 2, 2] },
  { type: 2, progress: 0.7, pos: [3.5, 2, 0], scale: [0.4, 0.4, 0.4] },
  { type: 1, progress: 0.72, pos: [2, 0, 0], scale: [0.4, 0.4, 0.4] },
];
