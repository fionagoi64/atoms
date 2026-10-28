import * as THREE from "three";
import gsap from "gsap";

export interface CameraRig {
  camera: THREE.PerspectiveCamera;
  aboutCamera: THREE.PerspectiveCamera;
  orthoCamera: THREE.OrthographicCamera;
  updateFlightCamera: (
    camPos: THREE.Vector3,
    camLookAt: THREE.Vector3,
    isExploring: boolean,
    hasEnded: boolean,
    textOffset: number,
    textInfluence: number,
  ) => void;
  triggerOutro: () => void;
  handleResize: (width: number, height: number) => void;
}

/**
 * Creates and manages the flight camera, dedicated about scene camera
 */
export const createCameraRig = (width: number, height: number): CameraRig => {
  // 1. Primary Flight Perspective Camera
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);

  const updateFlightFov = (w: number, h: number) => {
    camera.aspect = w / h;
    const fov = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(camera.aspect, 1.6, 0.6, 60, 90),
      60,
      90,
    );
    camera.fov = fov;
    camera.updateProjectionMatrix();
  };

  updateFlightFov(width, height);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, -20);

  // 2. Dedicated About Scene Perspective Camera
  const aboutCamera = new THREE.PerspectiveCamera(
    60,
    width / height,
    0.1,
    1000,
  );

  const updateAboutFov = (w: number, h: number) => {
    aboutCamera.aspect = w / h;
    const fov = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(aboutCamera.aspect, 1.6, 0.6, 60, 90),
      60,
      90,
    );
    aboutCamera.fov = fov;
    aboutCamera.updateProjectionMatrix();
  };

  updateAboutFov(width, height);
  aboutCamera.position.set(0, 0, 8);
  aboutCamera.lookAt(0, 0, -20);

  // 3. Orthographic Full-Screen Quad Camera (for wave transitions & film grain compositor)
  const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Scratch vector for lateral text framing
  const _lateralVec = new THREE.Vector3();

  const updateFlightCamera = (
    camPos: THREE.Vector3,
    camLookAt: THREE.Vector3,
    isExploring: boolean,
    hasEnded: boolean,
    textOffset: number,
    textInfluence: number,
  ) => {
    if (isExploring && !hasEnded) {
      camera.position.set(camPos.x, camPos.y, camPos.z);
      camera.lookAt(camLookAt.x, camLookAt.y, camLookAt.z);

      // Lateral camera offset factor based on aspect ratio (Atmos exact responsive logic)
      const cameraOffsetFactor = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(camera.aspect, 1.6, 0.6, 0, 1),
        0,
        1,
      );
      const tOffset = textInfluence * textOffset * 3.0;
      if (Math.abs(tOffset) > 0.0001) {
        _lateralVec.set(1, 0, 0).applyQuaternion(camera.quaternion);
        camera.position.add(
          _lateralVec.multiplyScalar(tOffset * cameraOffsetFactor),
        );
        camera.rotation.y += 0.1 * -tOffset;
      }
    } else if (!isExploring) {
      camera.position.set(0, 0, 8);
      camera.lookAt(0, 0, -20);
    }
  };

  const triggerOutro = () => {
    gsap.to(camera.position, {
      y: "+=5",
      duration: 3.5,
      ease: "power2.inOut",
    });
    gsap.to(camera.rotation, {
      x: "+=0.2",
      duration: 3.5,
      ease: "power2.inOut",
    });
  };

  const handleResize = (w: number, h: number) => {
    updateFlightFov(w, h);
    updateAboutFov(w, h);
  };

  return {
    camera,
    aboutCamera,
    orthoCamera,
    updateFlightCamera,
    triggerOutro,
    handleResize,
  };
};
