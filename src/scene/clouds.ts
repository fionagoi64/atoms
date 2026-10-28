import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CLOUD_CONFIGS } from "../data/clouds";

export interface CloudItem {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
}

export interface CloudManager {
  cloudsList: CloudItem[];
  updateClouds: (
    cameraPosition: THREE.Vector3,
    isExploring: boolean,
    introAlpha: number,
  ) => void;
}

/**
 * Creates and manages the atmospheric 3D cloud formations along the flight path.
 */
export const createClouds = (
  gltfLoader: GLTFLoader,
  scene: THREE.Scene,
  flightCurve: THREE.CatmullRomCurve3,
  curveSizeFactor = 2.5,
): CloudManager => {
  const cloudsList: CloudItem[] = [];
  let cloudGeo1: THREE.BufferGeometry | null = null;
  let cloudGeo2: THREE.BufferGeometry | null = null;

  const spawnClouds = () => {
    CLOUD_CONFIGS.forEach((cfg) => {
      const geo =
        cfg.type === 1 && cloudGeo1
          ? cloudGeo1
          : cloudGeo2
            ? cloudGeo2
            : new THREE.SphereGeometry(1.5, 12, 12);

      const mat = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0.0,
        depthWrite: true,
        depthTest: true,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 3;
      mesh.visible = false;

      const targetLookAt = new THREE.Vector3();
      flightCurve.getPointAt(cfg.progress, mesh.position);
      flightCurve.getPointAt(
        Math.max(0, cfg.progress - 0.05 * curveSizeFactor),
        targetLookAt,
      );
      mesh.position.add(
        new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]),
      );
      targetLookAt.y = mesh.position.y;
      mesh.lookAt(targetLookAt);

      if (cfg.rot) {
        mesh.rotation.x += cfg.rot[0];
        mesh.rotation.y += cfg.rot[1];
        mesh.rotation.z += cfg.rot[2];
      }
      if (cfg.scale) {
        mesh.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      } else {
        mesh.scale.set(1, 1, 1);
      }

      scene.add(mesh);
      cloudsList.push({ mesh, pos: mesh.position });
    });
  };

  gltfLoader.load(
    "/models/cloud_11.glb",
    (g1) => {
      g1.scene.traverse((c) => {
        if ((c as THREE.Mesh).isMesh && !cloudGeo1)
          cloudGeo1 = (c as THREE.Mesh).geometry;
      });
      gltfLoader.load(
        "/models/cloud_22.glb",
        (g2) => {
          g2.scene.traverse((c) => {
            if ((c as THREE.Mesh).isMesh && !cloudGeo2)
              cloudGeo2 = (c as THREE.Mesh).geometry;
          });
          spawnClouds();
        },
        undefined,
        () => spawnClouds(),
      );
    },
    undefined,
    () => spawnClouds(),
  );

  const updateClouds = (
    cameraPosition: THREE.Vector3,
    isExploring: boolean,
    introAlpha: number,
  ) => {
    cloudsList.forEach(({ mesh, pos }) => {
      if (!isExploring || introAlpha < 0.01) {
        mesh.visible = false;
        (mesh.material as THREE.MeshLambertMaterial).opacity = 0;
        return;
      }
      mesh.visible = true;
      const dist = cameraPosition.distanceTo(pos);
      let alpha = THREE.MathUtils.clamp(1 - dist / 30, 0, 1);
      alpha = 2.0 * Math.pow(alpha, 2);
      (mesh.material as THREE.MeshLambertMaterial).opacity = Math.min(
        alpha * introAlpha,
        1.0,
      );
    });
  };

  return {
    cloudsList,
    updateClouds,
  };
};
