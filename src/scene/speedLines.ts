import * as THREE from "three";

export interface SpeedLinesManager {
  mesh: THREE.InstancedMesh;
  material: THREE.MeshBasicMaterial;
  updateSpeedLines: (
    flightCurve: THREE.CatmullRomCurve3,
    Am: number,
    curveSizeFactor: number,
    camLookAt: THREE.Vector3,
    planeRotationY: number,
    isExploring: boolean,
    hasEnded: boolean,
    scrollDelta: number,
    forwardGlide: number,
  ) => void;
}

/**
 * Creates and manages the 200 aerodynamic wind / speed streak particles.
 */
export const createSpeedLines = (scene: THREE.Scene): SpeedLinesManager => {
  const windCount = 200;
  const windGeo = new THREE.OctahedronGeometry(0.02, 0);
  const windMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const windMesh = new THREE.InstancedMesh(windGeo, windMat, windCount);
  windMesh.visible = false;

  const _particleMatrix = new THREE.Matrix4();
  const _particlePos = new THREE.Vector3();
  const _particleEuler = new THREE.Euler();
  const _particleQuat = new THREE.Quaternion();
  const _particleScale = new THREE.Vector3(1, 50, 1);

  for (let i = 0; i < windCount; i++) {
    const angle = 360 * Math.random();
    const radius = 3.0 + Math.random(); // between 3 and 4
    _particlePos.x = Math.cos(angle) * radius;
    _particlePos.y = Math.sin(angle) * radius;
    _particlePos.z = 80 * Math.random() - 40;
    _particleEuler.x = 0.5 * Math.PI;
    _particleEuler.y = 2 * Math.PI * Math.random();
    _particleEuler.z = 0;
    _particleQuat.setFromEuler(_particleEuler);
    _particleMatrix.compose(_particlePos, _particleQuat, _particleScale);
    windMesh.setMatrixAt(i, _particleMatrix);
  }
  windMesh.instanceMatrix.needsUpdate = true;
  scene.add(windMesh);

  const updateSpeedLines = (
    flightCurve: THREE.CatmullRomCurve3,
    Am: number,
    curveSizeFactor: number,
    camLookAt: THREE.Vector3,
    planeRotationY: number,
    isExploring: boolean,
    hasEnded: boolean,
    scrollDelta: number,
    forwardGlide: number,
  ) => {
    if (!isExploring || hasEnded) {
      windMesh.visible = false;
      windMat.opacity = THREE.MathUtils.lerp(windMat.opacity, 0, 0.1);
      return;
    }

    const windLeadT = Math.min(Am + 0.01 / curveSizeFactor, 1.0);
    flightCurve.getPointAt(windLeadT, windMesh.position);
    windMesh.lookAt(camLookAt);

    for (let i = 0; i < windCount; i++) {
      windMesh.getMatrixAt(i, _particleMatrix);
      _particlePos.setFromMatrixPosition(_particleMatrix);
      _particlePos.z += 0.2 * (1 + (i % 5));
      _particlePos.z = ((_particlePos.z + 40) % 80) - 40;

      _particleEuler.set(0.5 * Math.PI, 0, planeRotationY);
      _particleQuat.setFromEuler(_particleEuler);
      _particleMatrix.compose(_particlePos, _particleQuat, _particleScale);
      windMesh.setMatrixAt(i, _particleMatrix);
    }
    windMesh.instanceMatrix.needsUpdate = true;
    windMesh.visible = true;

    const windFactor = window.innerWidth > 1000 ? 0.001 : 0.02;
    const speedValue = Math.max(scrollDelta * windFactor, forwardGlide);
    const targetWindOpacity = THREE.MathUtils.clamp(speedValue, 0, 0.1);
    windMat.opacity = THREE.MathUtils.lerp(
      windMat.opacity,
      targetWindOpacity,
      0.05,
    );
  };

  return {
    mesh: windMesh,
    material: windMat,
    updateSpeedLines,
  };
};
