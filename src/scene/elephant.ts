import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface ElephantManager {
  mesh: THREE.Object3D | null;
  updateElephant: (
    time: number,
    cameraPosition: THREE.Vector3,
    isExploring: boolean,
    introAlpha: number,
  ) => void;
}

/**
 * Creates and manages the floating 3D elephant easter egg along the flight path.
 */
export const createElephant = (
  gltfLoader: GLTFLoader,
  scene: THREE.Scene,
  flightCurve: THREE.CatmullRomCurve3,
): ElephantManager => {
  let elephantMesh: THREE.Object3D | null = null;
  let elephantInitY = 0;

  gltfLoader.load("/models/elephant.glb", (gltf) => {
    elephantMesh = gltf.scene;
    elephantMesh.scale.set(0.65, 0.65, 0.65);
    const elPt = flightCurve.getPointAt(0.425);
    const elTan = flightCurve.getTangentAt(0.425);
    const elRight = new THREE.Vector3(-elTan.z, 0, elTan.x).normalize();
    elephantMesh.position.copy(elPt).add(elRight.multiplyScalar(4.5));
    elephantMesh.position.y += 2.0;
    elephantMesh.rotation.y = Math.PI / 4;
    elephantInitY = elephantMesh.position.y;
    elephantMesh.visible = false;

    const elMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
    });
    elephantMesh.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = elMat;
    });
    scene.add(elephantMesh);
  });

  const updateElephant = (
    time: number,
    cameraPosition: THREE.Vector3,
    isExploring: boolean,
    introAlpha: number,
  ) => {
    if (!elephantMesh) return;
    if (!isExploring || introAlpha < 0.01) {
      elephantMesh.visible = false;
      return;
    }

    elephantMesh.visible = true;
    elephantMesh.position.y = elephantInitY + 1.0 * Math.sin(0.2 * time);
    elephantMesh.rotation.y += 0.001;

    const elDist = cameraPosition.distanceTo(elephantMesh.position);
    let elAlpha = THREE.MathUtils.clamp(1 - elDist / 30, 0, 1);
    elAlpha = 2.0 * Math.pow(elAlpha, 2);

    elephantMesh.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        ((c as THREE.Mesh).material as THREE.MeshLambertMaterial).opacity =
          Math.min(elAlpha * introAlpha, 0.85);
      }
    });
  };

  return {
    get mesh() {
      return elephantMesh;
    },
    updateElephant,
  };
};
