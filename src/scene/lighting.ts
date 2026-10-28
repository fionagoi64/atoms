import * as THREE from "three";

const makeColor = (r: number, g: number, b: number) =>
  new THREE.Color().setRGB(
    r / 255,
    g / 255,
    b / 255,
    THREE.LinearSRGBColorSpace,
  );

/**
 * Deep royal blue -> lavender blue -> soft golden peach -> periwinkle -> soft golden apricot -> twilight indigo.
 */
export const ATMOS_LIGHT_GROUND_COLORS = [
  makeColor(8, 37, 198), // 0.0 - 0.1: Initial Deep Royal Blue (1:1 with About Us)
  makeColor(8, 37, 198), // 0.1 - 0.2: Deep Royal Blue
  makeColor(116, 136, 234), // 0.2 - 0.3: Soft Lavender / Periwinkle Blue
  makeColor(255, 192, 148), // 0.3 - 0.4: Soft Warm Golden Peach
  makeColor(136, 162, 247), // 0.4 - 0.5: Periwinkle Blue
  makeColor(136, 162, 247), // 0.5 - 0.6: Periwinkle Blue
  makeColor(253, 175, 120), // 0.6 - 0.7: Soft Warm Golden Apricot
  makeColor(253, 175, 120), // 0.7 - 0.8: Soft Warm Golden Apricot
  makeColor(90, 108, 216), // 0.8 - 0.9: Twilight Indigo Blue
  makeColor(90, 108, 216), // 0.9 - 1.0: Twilight Indigo Blue
];

export const ATMOS_LIGHT_FILL_COLORS = [
  makeColor(20, 60, 255), // 0.0 - 0.1: Electric Azure Blue
  makeColor(20, 60, 255), // 0.1 - 0.2: Electric Azure Blue
  makeColor(116, 136, 234), // 0.2 - 0.3: Soft Lavender Blue
  makeColor(255, 205, 165), // 0.3 - 0.4: Soft Golden Peach Glow
  makeColor(136, 162, 247), // 0.4 - 0.5: Periwinkle Blue
  makeColor(136, 162, 247), // 0.5 - 0.6: Periwinkle Blue
  makeColor(253, 190, 140), // 0.6 - 0.7: Soft Golden Apricot Glow
  makeColor(253, 190, 140), // 0.7 - 0.8: Soft Golden Apricot Glow
  makeColor(90, 115, 230), // 0.8 - 0.9: Twilight Indigo Blue
  makeColor(90, 115, 230), // 0.9 - 1.0: Twilight Indigo Blue
];

export interface LightingManager {
  hemiLight: THREE.HemisphereLight;
  flightTopLight: THREE.DirectionalLight;
  flightEnvFill: THREE.DirectionalLight;
  flightRearFill: THREE.DirectionalLight;
  updateLighting: (progress: number) => void;
}

/**
 * Creates and dynamically interpolates the atmospheric flight lighting system.
 */
export const createLighting = (
  scene: THREE.Scene,
  camera: THREE.Camera,
): LightingManager => {
  // 1. Hemisphere Light: Pure white sky (0xffffff) + rich royal blue ground at intensity 2.0
  const hemiLight = new THREE.HemisphereLight(
    0xffffff,
    ATMOS_LIGHT_GROUND_COLORS[0].clone(),
    2.0,
  );
  hemiLight.position.set(-6, 14, 0);
  scene.add(hemiLight);

  // 2. Crisp White Key Light from top-left
  const flightTopLight = new THREE.DirectionalLight(0xffffff, 1.0);
  flightTopLight.position.set(-6, 12, 4);
  flightTopLight.target.position.set(0, 0, -6);
  camera.add(flightTopLight);
  camera.add(flightTopLight.target);

  // 3. Dynamic Environment Fill Light (underbelly illumination)
  const flightEnvFill = new THREE.DirectionalLight(
    ATMOS_LIGHT_FILL_COLORS[0].clone(),
    1.1,
  );
  flightEnvFill.position.set(1, -4, 4);
  flightEnvFill.target.position.set(0, 0, -6);
  camera.add(flightEnvFill);
  camera.add(flightEnvFill.target);

  // 4. Rear / Tail Environment Fill Light
  const flightRearFill = new THREE.DirectionalLight(
    ATMOS_LIGHT_FILL_COLORS[0].clone(),
    0.5,
  );
  flightRearFill.position.set(0, -1, 4);
  flightRearFill.target.position.set(0, 0, -6);
  camera.add(flightRearFill);
  camera.add(flightRearFill.target);

  const _tempGroundColor = new THREE.Color();
  const _tempFillColor = new THREE.Color();

  const updateLighting = (progress: number) => {
    const normalizedProgress = THREE.MathUtils.clamp(progress / 0.95, 0, 1);
    const stepVal =
      (ATMOS_LIGHT_GROUND_COLORS.length - 1) * normalizedProgress;
    const prevIdx = Math.floor(stepVal);
    const stepFrac = stepVal - prevIdx;
    const nextIdx = Math.min(
      prevIdx + 1,
      ATMOS_LIGHT_GROUND_COLORS.length - 1,
    );
    const curIdx = Math.min(prevIdx, ATMOS_LIGHT_GROUND_COLORS.length - 1);

    _tempGroundColor.lerpColors(
      ATMOS_LIGHT_GROUND_COLORS[curIdx],
      ATMOS_LIGHT_GROUND_COLORS[nextIdx],
      stepFrac,
    );
    _tempFillColor.lerpColors(
      ATMOS_LIGHT_FILL_COLORS[curIdx],
      ATMOS_LIGHT_FILL_COLORS[nextIdx],
      stepFrac,
    );

    hemiLight.groundColor.copy(_tempGroundColor);
    flightEnvFill.color.copy(_tempFillColor);
    flightRearFill.color.copy(_tempFillColor);
  };

  return {
    hemiLight,
    flightTopLight,
    flightEnvFill,
    flightRearFill,
    updateLighting,
  };
};
