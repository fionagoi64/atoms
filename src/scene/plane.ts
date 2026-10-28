import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";

export interface AirplaneController {
  flightGroup: THREE.Group;
  aboutGroup: THREE.Group;
  planeMat: THREE.MeshLambertMaterial;
  aboutPlaneMat: THREE.MeshLambertMaterial;
  flightMesh: THREE.Object3D | null;
  aboutMesh: THREE.Object3D | null;
  updateFlight: (
    initPos: THREE.Vector3,
    lookAtPos: THREE.Vector3,
    introOffset: THREE.Vector3,
    time: number,
    isExploring: boolean,
    hasEnded: boolean,
  ) => void;
  updateAbout: (
    aboutCamera: THREE.PerspectiveCamera,
    xDynamicsVal: number,
    yDynamicsVal: number,
    distanceFactor: number,
    time: number,
  ) => void;
  triggerOutro: (trailMat?: THREE.Material | null) => void;
  reset: () => void;
}

/**
 * Creates and manages the 3D airplane models for both the active flight scene
 * and the dedicated about menu scene.
 */
export const createAirplane = (
  gltfLoader: GLTFLoader,
  scene: THREE.Scene,
  aboutScene: THREE.Scene,
): AirplaneController => {
  // Flight Scene Airplane Group
  const flightGroup = new THREE.Group();
  flightGroup.renderOrder = 100;
  flightGroup.visible = false;
  scene.add(flightGroup);

  // Dedicated About Scene Airplane Group
  const aboutGroup = new THREE.Group();
  aboutScene.add(aboutGroup);

  const planeMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    depthWrite: true,
    depthTest: true,
  });

  const aboutPlaneMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
  });

  let flightMesh: THREE.Object3D | null = null;
  let aboutMesh: THREE.Object3D | null = null;

  // Load the glider model
  gltfLoader.load(
    "/models/planeur.glb",
    (gltf) => {
      // 1. Flight airplane
      flightMesh = gltf.scene;
      flightMesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = planeMat;
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        }
      });
      flightMesh.scale.set(1.0, 1.0, 1.0);
      flightGroup.add(flightMesh);

      // 2. About airplane (independent clone in aboutScene)
      aboutMesh = gltf.scene.clone(true);
      aboutMesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = aboutPlaneMat;
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        }
      });
      aboutMesh.scale.set(1.0, 1.0, 1.0);
      aboutGroup.add(aboutMesh);
    },
    undefined,
    (err) => console.error("Error loading planeur.glb:", err),
  );

  // Scratch vectors for high-performance updates without allocations
  const _unprojectDir = new THREE.Vector3();
  const _aboutOffset = new THREE.Vector3();
  const _aboutTargetPos = new THREE.Vector3();

  const updateFlight = (
    initPos: THREE.Vector3,
    lookAtPos: THREE.Vector3,
    introOffset: THREE.Vector3,
    time: number,
    isExploring: boolean,
    hasEnded: boolean,
  ) => {
    flightGroup.visible = isExploring;
    if (hasEnded) return;

    const flightX = initPos.x + 0.1 * (-0.5 + Math.sin(0.5 * time));
    const flightY = initPos.y + 0.2 * Math.sin(time) + introOffset.y;
    const flightZ = initPos.z + introOffset.z;

    flightGroup.position.set(flightX, flightY, flightZ);
    flightGroup.lookAt(lookAtPos);

    const turnRoll = 0.15 * (lookAtPos.x - flightGroup.position.x);
    flightGroup.rotation.z += turnRoll;
  };

  const updateAbout = (
    aboutCamera: THREE.PerspectiveCamera,
    xDynamicsVal: number,
    yDynamicsVal: number,
    distanceFactor: number,
    time: number,
  ) => {
    const tAbout = xDynamicsVal + 0.05 * Math.sin(0.4 * time);
    const iAbout = 0.18 * Math.sin(0.6 * time) + yDynamicsVal;

    _unprojectDir.set(tAbout, iAbout, 0).unproject(aboutCamera);
    _aboutOffset
      .copy(_unprojectDir)
      .sub(aboutCamera.position)
      .multiplyScalar(distanceFactor);
    _aboutTargetPos.copy(_unprojectDir).add(_aboutOffset);

    aboutGroup.position.copy(_aboutTargetPos);
    aboutGroup.quaternion.copy(aboutCamera.quaternion);
  };

  const triggerOutro = (trailMat?: THREE.Material | null) => {
    gsap.to(flightGroup.position, {
      z: "-=20",
      y: "+=5",
      duration: 2.0,
      ease: "power2.in",
    });
    gsap.to(flightGroup.rotation, {
      x: "+=0.3",
      duration: 2.0,
      ease: "power2.in",
    });
    const matsToFade: THREE.Material[] = [planeMat];
    if (trailMat) matsToFade.push(trailMat);
    gsap.to(matsToFade, {
      opacity: 0,
      duration: 2.0,
      ease: "power2.in",
    });
  };

  const reset = () => {
    flightGroup.visible = false;
    planeMat.opacity = 1;
  };

  return {
    flightGroup,
    aboutGroup,
    planeMat,
    aboutPlaneMat,
    flightMesh,
    aboutMesh,
    updateFlight,
    updateAbout,
    triggerOutro,
    reset,
  };
};
