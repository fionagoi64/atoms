import * as THREE from "three";

export interface FlightCurveManager {
  flightCurve: THREE.CatmullRomCurve3;
  trailMesh: THREE.Mesh;
  trailMat: THREE.MeshBasicMaterial;
  curveSizeFactor: number;
}

/**
 * Creates the authentic 3D flight trajectory curve and smoke contrail tube geometry.
 */
export const createFlightCurve = (
  scene: THREE.Scene,
  curveSizeFactor = 2.5,
): FlightCurveManager => {
  const dir = 1;
  const curvePoints = [
    new THREE.Vector3(0, 0, 0).multiplyScalar(curveSizeFactor),
    new THREE.Vector3(0, 0, -20).multiplyScalar(curveSizeFactor),
    new THREE.Vector3(5 * dir, 0, -40).multiplyScalar(curveSizeFactor),
    new THREE.Vector3(-5 * dir, 0, -60).multiplyScalar(curveSizeFactor),
    new THREE.Vector3(5 * dir, 0, -80).multiplyScalar(curveSizeFactor),
    new THREE.Vector3(0, 0, -100).multiplyScalar(curveSizeFactor),
    new THREE.Vector3(0, 0, -120).multiplyScalar(curveSizeFactor),
  ];

  const flightCurve = new THREE.CatmullRomCurve3(
    curvePoints,
    false,
    "catmullrom",
    0.5,
  );

  // Contrail / Smoke Trail (TubeGeometry)
  const trailGeo = new THREE.TubeGeometry(
    flightCurve,
    Math.round(200 * curveSizeFactor),
    0.022,
    6,
    false,
  );
  const trailMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    depthTest: true,
  });
  const trailMesh = new THREE.Mesh(trailGeo, trailMat);
  trailMesh.position.y = -0.5;
  trailMesh.visible = false;
  scene.add(trailMesh);

  return {
    flightCurve,
    trailMesh,
    trailMat,
    curveSizeFactor,
  };
};
