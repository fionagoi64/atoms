import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Text } from "troika-three-text";
import gsap from "gsap";
import { ATMOS_FACTS } from "../data/facts";
import { CLOUD_CONFIGS } from "../data/clouds";
import { createSkyMaterial } from "../shaders/skyShader";
import { TransitionShader } from "../shaders/transitionShader";
import { GrainShader } from "../shaders/grainShader";

/**
 * Authentic Atmos Dynamic Atmospheric Ground Bounce Colors (1:1 Leeroy Atmos Parity)
 * As the aircraft progresses along the flight path, the sky dome gradients transition through
 * 8 distinct mood phases (morning blue, lavender, peach sunset, periwinkle, sunset orange, dusk, night).
 * The HemisphereLight groundColor dynamically interpolates across these exact 10 stops,
 * coloring the underbelly, wings, and shadows of the airplane, clouds, and elephant.
 */
const makeColor = (r: number, g: number, b: number) =>
  new THREE.Color().setRGB(
    r / 255,
    g / 255,
    b / 255,
    THREE.LinearSRGBColorSpace,
  );

// 1:1 Parity with Leeroy Atmos flight lighting:
// Authentic 10-stop colors in LinearSRGBColorSpace:
// Deep royal blue -> lavender blue -> soft golden peach -> periwinkle -> soft golden apricot -> twilight indigo.
// Soft pastel tones matching Leeroy's exact RGB stops, with NO neon red or hot pink.
// The subtle warmth during flight transitions is purely a delicate cross-fade between blue and gentle pastel peach/apricot.
const ATMOS_LIGHT_GROUND_COLORS = [
  makeColor(8, 37, 198), // 0.0 - 0.1: Initial Deep Royal Blue (1:1 with About Us)
  makeColor(8, 37, 198), // 0.1 - 0.2: Deep Royal Blue
  makeColor(116, 136, 234), // 0.2 - 0.3: Soft Lavender / Periwinkle Blue
  makeColor(255, 192, 148), // 0.3 - 0.4: Soft Warm Golden Peach (gentle cream-peach, never red/pink)
  makeColor(136, 162, 247), // 0.4 - 0.5: Periwinkle Blue
  makeColor(136, 162, 247), // 0.5 - 0.6: Periwinkle Blue
  makeColor(253, 175, 120), // 0.6 - 0.7: Soft Warm Golden Apricot (gentle pastel apricot, never red/pink)
  makeColor(253, 175, 120), // 0.7 - 0.8: Soft Warm Golden Apricot
  makeColor(90, 108, 216), // 0.8 - 0.9: Twilight Indigo Blue
  makeColor(90, 108, 216), // 0.9 - 1.0: Twilight Indigo Blue
];

const ATMOS_LIGHT_FILL_COLORS = [
  makeColor(20, 60, 255), // 0.0 - 0.1: Electric Azure Blue (1:1 with About Us aboutBlueFill)
  makeColor(20, 60, 255), // 0.1 - 0.2: Electric Azure Blue
  makeColor(116, 136, 234), // 0.2 - 0.3: Soft Lavender Blue
  makeColor(255, 205, 165), // 0.3 - 0.4: Soft Golden Peach Glow (gentle pastel, never red/pink)
  makeColor(136, 162, 247), // 0.4 - 0.5: Periwinkle Blue
  makeColor(136, 162, 247), // 0.5 - 0.6: Periwinkle Blue
  makeColor(253, 190, 140), // 0.6 - 0.7: Soft Golden Apricot Glow (gentle pastel, never red/pink)
  makeColor(253, 190, 140), // 0.7 - 0.8: Soft Golden Apricot Glow
  makeColor(90, 115, 230), // 0.8 - 0.9: Twilight Indigo Blue
  makeColor(90, 115, 230), // 0.9 - 1.0: Twilight Indigo Blue
];

interface AtmosCanvasProps {
  isExploring: boolean;
  isAboutOpen: boolean;
  mousePos: { x: number; y: number };
  seekRatio?: number | null;
  onProgressChange: (progress: number, completion: number) => void;
  onExploreStart: () => void;
  onEndReached: () => void;
}

export const AtmosCanvas = ({
  isExploring,
  isAboutOpen,
  seekRatio,
  onProgressChange,
  onEndReached,
}: AtmosCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroller & Flight State (Exact replica of Atmos virtual scroller)
  const stateRef = useRef({
    scrollerRange: 13000 * 2.5, // 32500 virtual units
    scrollerDeltaY: 0,
    scrollerCurrentY: 0,
    completion: 0,
    progressAmp: 1.0,
    Am: 0.0001,
    introPosition: new THREE.Vector3(0, -2, 17.5),
    introCloudAlpha: { value: 0 },
    transitionMode: "NONE" as "NONE" | "TO_ABOUT" | "TO_FLIGHT",
    currentScene: "FLIGHT" as "FLIGHT" | "ABOUT",
    transitionProgress: { value: 0 },
    transitionSeed: 0,
    transitionDirection: -1,
    aboutDistanceFactor: { value: 50 },
    aboutYDynamics: { value: -0.5 },
    aboutDummy: { value: 0 },
    aboutXPosition:
      typeof window !== "undefined" && window.innerWidth > 1000 ? -0.4 : 0,
    mouseLerp: { x: 0, y: 0 },
    isExploring: false,
    isAboutOpen: false,
    hasEnded: false,
  });

  // Synchronize flags & trigger authentic Atmos waveclip page transition
  useEffect(() => {
    stateRef.current.isAboutOpen = isAboutOpen;
    const s = stateRef.current;
    s.aboutXPosition = window.innerWidth > 1000 ? -0.4 : 0;

    if (isAboutOpen) {
      if (s.currentScene !== "ABOUT" || s.transitionMode !== "NONE") {
        s.transitionMode = "TO_ABOUT";
        s.transitionProgress.value = 0;
        s.transitionSeed = 10 * Math.random();
        s.transitionDirection = -1;
        gsap.killTweensOf(s.transitionProgress);
        gsap.to(s.transitionProgress, {
          value: 1.0,
          duration: 2.0,
          ease: "power2.inOut",
          onComplete: () => {
            s.transitionMode = "NONE";
            s.currentScene = "ABOUT";
          },
        });

        // Enter About mode: Glide in from far distance 50 -> 20, yDynamics -0.5 -> 0
        s.aboutDistanceFactor.value = 50;
        s.aboutYDynamics.value = -0.5;
        s.aboutDummy.value = 0;
        gsap.killTweensOf([
          s.aboutDistanceFactor,
          s.aboutYDynamics,
          s.aboutDummy,
        ]);

        gsap.to(s.aboutDistanceFactor, {
          value: 20,
          duration: 2.8,
          ease: "power2.out",
        });
        gsap.to(s.aboutYDynamics, {
          value: 0,
          duration: 2.8,
          ease: "power2.out",
        });
        gsap.to(s.aboutDummy, {
          value: 1,
          duration: 2.8,
          ease: "power2.out",
        });
      }
    } else {
      if (s.currentScene !== "FLIGHT" || s.transitionMode !== "NONE") {
        s.transitionMode = "TO_FLIGHT";
        s.transitionProgress.value = 0;
        s.transitionSeed = 10 * Math.random();
        s.transitionDirection = 0;
        gsap.killTweensOf(s.transitionProgress);
        gsap.to(s.transitionProgress, {
          value: 1.0,
          duration: 2.0,
          ease: "power2.inOut",
          onComplete: () => {
            s.transitionMode = "NONE";
            s.currentScene = "FLIGHT";
          },
        });

        // Exit About mode: Glide out distance 20 -> 10, yDynamics 0 -> 1.0
        gsap.killTweensOf([
          s.aboutDistanceFactor,
          s.aboutYDynamics,
          s.aboutDummy,
        ]);
        gsap.to(s.aboutDistanceFactor, {
          value: 10,
          duration: 1.8,
          ease: "power2.in",
        });
        gsap.to(s.aboutYDynamics, {
          value: 1.0,
          duration: 1.8,
          ease: "power2.in",
        });
      }
    }
  }, [isAboutOpen]);

  useEffect(() => {
    if (seekRatio !== undefined && seekRatio !== null) {
      const targetY =
        THREE.MathUtils.clamp(seekRatio, 0, 1) * stateRef.current.scrollerRange;
      stateRef.current.scrollerDeltaY = targetY;
      stateRef.current.scrollerCurrentY = targetY;
    }
  }, [seekRatio]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") {
        const target = 0.175 * stateRef.current.scrollerRange;
        stateRef.current.scrollerDeltaY = target;
        stateRef.current.scrollerCurrentY = target;
        stateRef.current.Am = 0.175;
      } else if (e.key === "4") {
        const target = 0.375 * stateRef.current.scrollerRange;
        stateRef.current.scrollerDeltaY = target;
        stateRef.current.scrollerCurrentY = target;
        stateRef.current.Am = 0.375;
      } else if (e.key === "9") {
        const target = 0.875 * stateRef.current.scrollerRange;
        stateRef.current.scrollerDeltaY = target;
        stateRef.current.scrollerCurrentY = target;
        stateRef.current.Am = 0.875;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    stateRef.current.isExploring = isExploring;
    if (isExploring) {
      gsap.to(stateRef.current.introPosition, {
        y: 0,
        z: 0,
        duration: 3.0,
        ease: "power2.out",
      });
      setTimeout(() => {
        gsap.to(stateRef.current.introCloudAlpha, {
          value: 1.0,
          duration: 2.0,
          ease: "power2.in",
        });
      }, 500);
    } else {
      gsap.to(stateRef.current.introPosition, {
        y: -2,
        z: 17.5,
        duration: 1.5,
        ease: "power2.out",
      });
      gsap.to(stateRef.current.introCloudAlpha, {
        value: 0.0,
        duration: 1.0,
        ease: "power2.out",
      });
    }
  }, [isExploring]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    const updateCameraFov = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      let fov = THREE.MathUtils.mapLinear(camera.aspect, 1.6, 0.6, 60, 90);
      fov = THREE.MathUtils.clamp(fov, 60, 90);
      camera.fov = fov;
      camera.updateProjectionMatrix();
    };
    updateCameraFov();
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------
    // DYNAMIC ATMOSPHERIC LIGHTING (1:1 ABOUT US MENU "WHITE + DEEP ELECTRIC ENV" PARITY)
    // Saturated electric royal blue ground bounce (0x0a30f8) + azure fill (0x2055ff)
    // with brilliant pure white key light, exactly matching About Us menu airplane!
    // -------------------------------------------------------------
    scene.add(camera);

    // 1. Hemisphere Light (1:1 with About Us aboutLight):
    // Pure white sky (0xffffff) + rich royal blue ground at intensity 2.0
    const hemiLight = new THREE.HemisphereLight(
      0xffffff,
      ATMOS_LIGHT_GROUND_COLORS[0].clone(),
      2.0,
    );
    hemiLight.position.set(-6, 14, 0);
    scene.add(hemiLight);

    // 2. Crisp White Key Light from top-left (1:1 with About Us aboutTopLight):
    // Shines on upper wings, cockpit, and fuselage spine with gleaming pure white at intensity 1.0
    const flightTopLight = new THREE.DirectionalLight(0xffffff, 1.0);
    flightTopLight.position.set(-6, 12, 4);
    flightTopLight.target.position.set(0, 0, -6);
    camera.add(flightTopLight);
    camera.add(flightTopLight.target);

    // 3. Dynamic Environment Fill Light (1:1 with About Us aboutBlueFill):
    // Shines from bottom-front onto camera-visible underbelly at intensity 1.1
    const flightEnvFill = new THREE.DirectionalLight(
      ATMOS_LIGHT_FILL_COLORS[0].clone(),
      1.1,
    );
    flightEnvFill.position.set(1, -4, 4);
    flightEnvFill.target.position.set(0, 0, -6);
    camera.add(flightEnvFill);
    camera.add(flightEnvFill.target);

    // 4. Rear / Tail Environment Fill Light:
    // Shines directly forward onto the rear cone visible to camera at intensity 0.5
    // eliminating any dark or muddy shadow on the engine cone!
    const flightRearFill = new THREE.DirectionalLight(
      ATMOS_LIGHT_FILL_COLORS[0].clone(),
      0.5,
    );
    flightRearFill.position.set(0, -1, 4);
    flightRearFill.target.position.set(0, 0, -6);
    camera.add(flightRearFill);
    camera.add(flightRearFill.target);

    // Sky Dome Mesh (Authentic Atmos radius 50)
    const skyGeo = new THREE.SphereGeometry(50, 32, 16);
    const skyMaterial = createSkyMaterial(0.06);
    const skyMesh = new THREE.Mesh(skyGeo, skyMaterial);
    scene.add(skyMesh);

    const updateSkyYCompression = () => {
      let e = THREE.MathUtils.mapLinear(camera.aspect, 1.6, 0.6, 0.06, 0.04);
      e = THREE.MathUtils.clamp(e, 0.04, 0.06);
      skyMaterial.uniforms.uYCompression.value = e;
    };
    updateSkyYCompression();

    // Flight Curve (CatmullRomCurve3 with curve_size_factor = 2.5)
    const curveSizeFactor = 2.5;
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

    // Contrail / Smoke Trail (TubeGeometry) - Exact initial project import (cdeb15a)
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

    // Airplane Group (Hidden until explore starts)
    const planeGroup = new THREE.Group();
    planeGroup.renderOrder = 100;
    planeGroup.visible = false;
    scene.add(planeGroup);

    // -------------------------------------------------------------
    // DEDICATED ABOUT SCENE & CAMERA (100% INDEPENDENT OF FLIGHT SCENE)
    // In authentic Atmos, About is a completely separate Scene (scene_about).
    // The flight airplane, contrail, camera, facts, and HUD are never altered.
    // -------------------------------------------------------------
    const aboutScene = new THREE.Scene();
    const aboutCamera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    aboutCamera.position.set(0, 0, 8);
    aboutCamera.lookAt(0, 0, -20);

    const aboutSkyGeo = new THREE.SphereGeometry(50, 32, 16);
    const aboutSkyMat = createSkyMaterial(0.06);
    aboutSkyMat.uniforms.uGradientMixer.value = 0.01;
    const aboutSkyMesh = new THREE.Mesh(aboutSkyGeo, aboutSkyMat);
    aboutSkyMesh.rotation.x = -0.1 * Math.PI;
    aboutScene.add(aboutSkyMesh);

    // Dedicated About Lighting:
    // 1. Hemisphere light: pure white sky light from above (-6, 14, 0) + intense royal blue ground bounce
    const aboutLight = new THREE.HemisphereLight(
      0xffffff,
      0x0a30f8,
      2.2,
    );
    aboutLight.position.set(-6, 14, 0);
    aboutScene.add(aboutLight);

    // 2. White key light from top-left to illuminate upper wings & fuselage spine with crisp white
    const aboutTopLight = new THREE.DirectionalLight(0xffffff, 1.0);
    aboutTopLight.position.set(-6, 12, 6);
    aboutScene.add(aboutTopLight);

    // 3. Electric blue fill light illuminating the camera-visible underbelly from below-front
    // Saturated azure-blue (0x2055ff) gives the underbelly its glowing, vivid blue tone
    const aboutBlueFill = new THREE.DirectionalLight(0x2055ff, 1.4);
    aboutBlueFill.position.set(1, -4, 12);
    aboutScene.add(aboutBlueFill);

    const aboutPlaneGroup = new THREE.Group();
    aboutScene.add(aboutPlaneGroup);

    // -------------------------------------------------------------
    // WAVECLIP TRANSITION PASS & RENDER TARGETS
    // -------------------------------------------------------------
    const dpr = Math.min(window.devicePixelRatio, 2);
    const rtFlight = new THREE.WebGLRenderTarget(
      window.innerWidth * dpr,
      window.innerHeight * dpr,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      },
    );
    const rtAbout = new THREE.WebGLRenderTarget(
      window.innerWidth * dpr,
      window.innerHeight * dpr,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      },
    );
    const rtTransition = new THREE.WebGLRenderTarget(
      window.innerWidth * dpr,
      window.innerHeight * dpr,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      },
    );

    const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const transitionScene = new THREE.Scene();
    const transitionMat = new THREE.ShaderMaterial({
      vertexShader: TransitionShader.vertexShader,
      fragmentShader: TransitionShader.fragmentShader,
      uniforms: {
        uTexture1: { value: null },
        uTexture2: { value: null },
        uProgress: { value: 0 },
        uSeed: { value: 0 },
        uDirection: { value: -1 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const transitionQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      transitionMat,
    );
    transitionScene.add(transitionQuad);

    // -------------------------------------------------------------
    // AUTHENTIC LEEROY ATMOS FILM GRAIN COMPOSITOR (1:1 POSTPROCESSING)
    // 12 FPS stop-motion film grain jitter (intensity 0.065, zero-centered)
    // -------------------------------------------------------------
    const grainScene = new THREE.Scene();
    const grainMat = new THREE.ShaderMaterial({
      vertexShader: GrainShader.vertexShader,
      fragmentShader: GrainShader.fragmentShader,
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        uXCount: { value: window.innerWidth / (window.devicePixelRatio || 1) },
        uYCount: { value: window.innerHeight / (window.devicePixelRatio || 1) },
        uIntensity: { value: 0.065 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const grainQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), grainMat);
    grainScene.add(grainQuad);

    // Setup GLTF & Draco Loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const planeMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
    });

    let planeMesh: THREE.Object3D | null = null;
    gltfLoader.load(
      "/models/planeur.glb",
      (gltf) => {
        // 1. Flight airplane (in flight scene)
        planeMesh = gltf.scene;
        planeMesh.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = planeMat;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          }
        });
        planeMesh.scale.set(1.0, 1.0, 1.0);
        planeGroup.add(planeMesh);

        // 2. About airplane (dedicated clone in aboutScene)
        const aboutPlaneMesh = gltf.scene.clone(true);
        const aboutPlaneMat = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 1,
        });
        aboutPlaneMesh.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = aboutPlaneMat;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          }
        });
        aboutPlaneMesh.scale.set(1.0, 1.0, 1.0);
        aboutPlaneGroup.add(aboutPlaneMesh);
      },
      undefined,
      (err) => console.error("Error loading planeur.glb:", err),
    );

    // -------------------------------------------------------------
    // SPEED LINES / WIND PARTICLES (1:1 LEEROY ATMOS PARITY)
    // 200 aerodynamic speed streaks instanced around the flight tunnel.
    // In Leeroy Atmos:
    // - OctahedronGeometry(0.02, 0)
    // - MeshBasicMaterial({ transparent: true, opacity: 0.1, depthWrite: false })
    // - Scaled (1, 50, 1) and rotated 90deg along X (0.5 * Math.PI) so that the 50x-stretched
    //   Y-axis points along the flight path (Z-axis).
    // - Distributed in a 3.0 to 4.0 radius cylinder spanning 80 units (-40 to +40) along flight path.
    // -------------------------------------------------------------
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

    // -------------------------------------------------------------
    // 3D TROIKA TEXTS IN THE SKY - WITH EXACT ROTATION (NO REFLECTION!)
    // In Troika, text glyphs face +Z. Calling lookAt points -Z towards target.
    // Adding rotateY(Math.PI) flips local +Z towards the oncoming camera so
    // text is 100% normal, unmirrored, and crisp left-to-right!
    // -------------------------------------------------------------
    interface TextItem {
      group: THREE.Group;
      sup?: Text;
      title?: Text;
      body: Text;
      progress: number;
      align: "left" | "right";
      positionOffset: THREE.Vector3;
      position: THREE.Vector3;
      pre_position: THREE.Vector3;
    }

    const textItems: TextItem[] = [];

    // 1. Welcome announcement at progress = 0.1 (exact Atmos om[0])
    const welcomeGroup = new THREE.Group();
    const welcomeBody = new Text();
    welcomeBody.text =
      "Hello passengers and welcome aboard. Please sit back, relax, and enjoy the view while we tell you some of our favourite facts about the aviation world.";
    welcomeBody.font = "/fonts/font2.ttf";
    welcomeBody.fontSize = 0.3; // Atmos exact bodyFontSize
    welcomeBody.maxWidth = 3.2; // Atmos exact bodyMaxWidth
    welcomeBody.lineHeight = 1.35;
    welcomeBody.position.y = -1.2; // Atmos exact Y offset within text group
    welcomeBody.color = 0xffffff;
    welcomeBody.outlineWidth = 0;
    welcomeBody.strokeWidth = 0;
    welcomeBody.textAlign = "left";
    welcomeBody.anchorX = "left";
    welcomeBody.material.transparent = true;
    welcomeBody.material.opacity = 0;
    welcomeBody.material.depthWrite = false;
    welcomeBody.sdfGlyphSize = 128;
    welcomeBody.sync();
    welcomeGroup.add(welcomeBody);

    const welcomeOffset = new THREE.Vector3(1, 2.8, 0);
    flightCurve.getPointAt(0.1, welcomeGroup.position);
    welcomeGroup.position.add(welcomeOffset);

    const welcomeLookPt = new THREE.Vector3();
    flightCurve.getPointAt(
      Math.max(0, 0.1 - 0.01 * curveSizeFactor),
      welcomeLookPt,
    );
    welcomeLookPt.y = welcomeGroup.position.y;
    welcomeGroup.lookAt(welcomeLookPt);

    welcomeGroup.visible = false;
    scene.add(welcomeGroup);

    const welcomePrePos = new THREE.Vector3();
    flightCurve.getPointAt(0.1 - 0.015, welcomePrePos);
    welcomePrePos.add(welcomeOffset);

    textItems.push({
      group: welcomeGroup,
      body: welcomeBody,
      progress: 0.1,
      align: "left",
      positionOffset: welcomeOffset,
      position: welcomeGroup.position,
      pre_position: welcomePrePos,
    });
    (window as any).__scene = scene;
    (window as any).__textItems = textItems;
    (window as any).__welcomeGroup = welcomeGroup;
    (window as any).__seekTo = (p: number) => {
      const targetY =
        THREE.MathUtils.clamp(p, 0, 1) * stateRef.current.scrollerRange;
      stateRef.current.scrollerDeltaY = targetY;
      stateRef.current.scrollerCurrentY = targetY;
      stateRef.current.Am = p;
    };

    // 2. The 8 aviation facts (matching Atmos exact om[1..8] positions and alignments)
    const FACT_CONFIGS = [
      {
        factIdx: 0,
        progress: 0.2,
        position: new THREE.Vector3(1, 1, 0),
        align: "left" as const,
      },
      {
        factIdx: 1,
        progress: 0.3,
        position: new THREE.Vector3(1, 1, 0),
        align: "left" as const,
      },
      {
        factIdx: 3,
        progress: 0.4,
        position: new THREE.Vector3(-1, 1, 0),
        align: "right" as const,
      }, // Fact #04 "FORBIDDEN NUMBER"
      {
        factIdx: 2,
        progress: 0.5,
        position: new THREE.Vector3(1, 1, 0),
        align: "left" as const,
      },
      {
        factIdx: 4,
        progress: 0.6,
        position: new THREE.Vector3(-1, 1, 0),
        align: "right" as const,
      },
      {
        factIdx: 5,
        progress: 0.7,
        position: new THREE.Vector3(1, 1, 0),
        align: "left" as const,
      },
      {
        factIdx: 6,
        progress: 0.8,
        position: new THREE.Vector3(-0.5, 1, 0),
        align: "right" as const,
      },
      {
        factIdx: 8,
        progress: 0.9,
        position: new THREE.Vector3(1, 1, 0),
        align: "left" as const,
      }, // Fact #09 "LUCKY FEW"
    ];

    FACT_CONFIGS.forEach((cfg) => {
      const fact = ATMOS_FACTS[cfg.factIdx % ATMOS_FACTS.length];
      const group = new THREE.Group();

      const sup = new Text();
      sup.text = fact.sup;
      sup.font = "/fonts/font2.ttf";
      sup.fontSize = 0.18; // Atmos exact sup.fontSize (.18)
      sup.position.y = 0.25; // Atmos exact sup.position.y (+.25)
      sup.color = 0xffffff;
      sup.outlineWidth = 0;
      sup.strokeWidth = 0;
      sup.textAlign = cfg.align;
      sup.anchorX = cfg.align;
      sup.material.transparent = true;
      sup.material.opacity = 0;
      sup.material.depthWrite = false;
      sup.sdfGlyphSize = 128;
      sup.sync();
      group.add(sup);

      const title = new Text();
      title.text = fact.title;
      title.font = "/fonts/font3.otf";
      title.fontSize = 0.5; // Atmos exact title.fontSize (.5)
      title.position.y = -0.055; // Atmos exact title.position.y (-.055)
      title.color = 0xffffff;
      title.outlineWidth = 0;
      title.strokeWidth = 0;
      title.maxWidth = fact.titleMaxWidth || 2.5; // Atmos exact title maxWidth (2.5)
      title.lineHeight = 1.05; // Atmos exact lineHeight (1.05)
      title.textAlign = cfg.align;
      title.anchorX = cfg.align;
      title.material.transparent = true;
      title.material.opacity = 0;
      title.material.depthWrite = false;
      title.sdfGlyphSize = 128;
      title.sync();
      group.add(title);

      const body = new Text();
      body.text = fact.body;
      body.font = "/fonts/font2.ttf";
      body.fontSize = fact.bodyMaxWidth ? 0.18 : fact.bodyFontSize || 0.18; // Atmos exact body.fontSize (.18)
      body.position.y = -1.2; // Atmos exact body.position.y (-1.2)
      body.maxWidth = fact.bodyMaxWidth || 3.0; // Atmos exact body maxWidth (3.0)
      body.lineHeight = 1.35;
      body.color = 0xffffff;
      body.outlineWidth = 0;
      body.strokeWidth = 0;
      body.textAlign = cfg.align;
      body.anchorX = cfg.align;
      body.material.transparent = true;
      body.material.opacity = 0;
      body.material.depthWrite = false;
      body.sdfGlyphSize = 128;
      body.sync();
      group.add(body);

      flightCurve.getPointAt(cfg.progress, group.position);
      group.position.add(cfg.position);

      const lookPt = new THREE.Vector3();
      flightCurve.getPointAt(
        Math.max(0, cfg.progress - 0.01 * curveSizeFactor),
        lookPt,
      );
      lookPt.y = group.position.y;
      group.lookAt(lookPt);

      group.visible = false;
      scene.add(group);

      const prePos = new THREE.Vector3();
      flightCurve.getPointAt(cfg.progress - 0.015, prePos);
      prePos.add(cfg.position);

      textItems.push({
        group,
        sup,
        title,
        body,
        progress: cfg.progress,
        align: cfg.align,
        positionOffset: cfg.position,
        position: group.position,
        pre_position: prePos,
      });
    });

    // -------------------------------------------------------------
    // 3D CLOUDS (Atmospheric scenery along the path)
    // -------------------------------------------------------------
    const cloudsList: { mesh: THREE.Mesh; pos: THREE.Vector3 }[] = [];
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

    // 3D Elephant Easter egg (Hidden initially)
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

    // -------------------------------------------------------------
    // VIRTUAL SCROLLER EVENT LISTENERS (EXACT ATMOS PARITY)
    // Scrolling cannot start flight - ONLY clicking Explore button can!
    // -------------------------------------------------------------
    const onWheel = (e: WheelEvent) => {
      const s = stateRef.current;
      if (!s.isExploring) {
        return; // Strictly do nothing before clicking Explore button
      }
      if (s.isAboutOpen || s.hasEnded) return;

      e.preventDefault();
      const dpr = window.devicePixelRatio || 1;
      let pixelY = e.deltaY;
      if (e.deltaMode === 1) pixelY *= 33;
      else if (e.deltaMode === 2) pixelY *= 600;

      // Exact Atmos speed factor normalized for high-DPI displays
      const normalizedDelta = (pixelY / dpr) * 0.75;
      s.scrollerDeltaY = THREE.MathUtils.clamp(
        s.scrollerDeltaY + normalizedDelta,
        0,
        s.scrollerRange,
      );
    };

    let touchStartY = 0;
    let touchLastTime = 0;
    let touchVelocity = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
        touchLastTime = performance.now();
        touchVelocity = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const s = stateRef.current;
      if (e.touches.length === 0) return;
      const curY = e.touches[0].clientY;
      const now = performance.now();
      const dt = Math.max(now - touchLastTime, 8);
      const diff = touchStartY - curY;
      touchVelocity = diff / dt;
      touchStartY = curY;
      touchLastTime = now;

      if (!s.isExploring) {
        return; // Strictly do nothing before clicking Explore button
      }
      if (s.isAboutOpen || s.hasEnded) return;

      e.preventDefault();
      s.scrollerDeltaY = THREE.MathUtils.clamp(
        s.scrollerDeltaY + diff * 1.8,
        0,
        s.scrollerRange,
      );
    };

    const onTouchEnd = () => {
      const s = stateRef.current;
      if (!s.isExploring || s.isAboutOpen || s.hasEnded) return;
      // When releasing after swipe/flick, apply momentum inertia
      if (Math.abs(touchVelocity) > 0.12) {
        const momentum = touchVelocity * 500;
        s.scrollerDeltaY = THREE.MathUtils.clamp(
          s.scrollerDeltaY + momentum,
          0,
          s.scrollerRange,
        );
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    // Vectors for loop
    const _camPos = new THREE.Vector3();
    const _camTangent = new THREE.Vector3();
    const _camLookAt = new THREE.Vector3();
    const _planeInitPos = new THREE.Vector3();
    const _planeLookAtPos = new THREE.Vector3();
    const _dummyMat = new THREE.Matrix4();
    const _lateralVec = new THREE.Vector3();
    const _unprojectDir = new THREE.Vector3();
    const _aboutOffset = new THREE.Vector3();
    const _aboutTargetPos = new THREE.Vector3();
    const _tempGroundColor = new THREE.Color();
    const _tempFillColor = new THREE.Color();

    const clock = new THREE.Clock();
    let animId: number;
    let lastProgressReportTime = 0;

    const render = () => {
      const time = clock.getElapsedTime();
      const s = stateRef.current;

      // 1. Virtual Scroller Update (lerpAmount = 0.09 for silky momentum glide)
      s.scrollerCurrentY = THREE.MathUtils.lerp(
        s.scrollerCurrentY,
        s.scrollerDeltaY,
        0.09,
      );
      s.completion = s.scrollerCurrentY / s.scrollerRange;

      // -------------------------------------------------------------
      // EXACT ATMOS ENDING TRIGGER (Am >= 0.95)
      // Plane pitches up into the sky, contrails fade out,
      // Camera smoothly pans up into the pure atmosphere.
      // -------------------------------------------------------------
      if (s.Am >= 0.95 && !s.hasEnded && s.isExploring) {
        s.hasEnded = true;

        // Plane ascends away into the distance
        gsap.to(planeGroup.position, {
          z: "-=20",
          y: "+=5",
          duration: 2.0,
          ease: "power2.in",
        });
        gsap.to(planeGroup.rotation, {
          x: "+=0.3",
          duration: 2.0,
          ease: "power2.in",
        });
        gsap.to([planeMat, trailMat], {
          opacity: 0,
          duration: 2.0,
          ease: "power2.in",
        });

        // Camera tilts up towards the infinite sky
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

        // Reveal outro screen after 2.0s
        setTimeout(() => {
          onEndReached();
        }, 2000);
      }

      // -------------------------------------------------------------
      // DYNAMIC SPEED ON SCROLL (EXACT ATMOS DECELERATION NEAR FACTS)
      // Uses Em(e) closest fact selection and drops progressAmp to 0.02
      // -------------------------------------------------------------
      let closestTextItem = textItems[0];
      let minProgDiff = 9999;
      for (let i = 0; i < textItems.length; i++) {
        const diff = Math.abs(s.Am - textItems[i].progress);
        if (diff < minProgDiff) {
          minProgDiff = diff;
          closestTextItem = textItems[i];
        }
      }

      const closestDist = camera.position.distanceTo(
        closestTextItem.pre_position,
      );
      let eFactor = THREE.MathUtils.clamp(
        1 - closestDist / (5 * curveSizeFactor),
        0,
        1,
      );
      eFactor = Math.pow(eFactor, 3);
      s.progressAmp = Math.max(1 - 1.2 * eFactor, 0.02);

      // Flight progression interpolation (0.025 * progressAmp)
      s.Am = THREE.MathUtils.lerp(s.Am, s.completion, 0.025 * s.progressAmp);
      const Am = THREE.MathUtils.clamp(s.Am, 0.0001, 0.9999);

      // 1. Camera along flight path
      flightCurve.getPointAt(Am, _camPos);
      flightCurve.getTangentAt(Am, _camTangent);
      _camLookAt.copy(_camPos).add(_camTangent);

      // 2. Flight Airplane sampled ahead along flight path
      const planeLeadT = Math.min(Am + 0.05 / curveSizeFactor, 1.0);
      const lookAtLeadT = Math.min(Am + 0.1 / curveSizeFactor, 1.0);
      flightCurve.getPointAt(planeLeadT, _planeInitPos);
      flightCurve.getPointAt(lookAtLeadT, _planeLookAtPos);

      if (!s.hasEnded) {
        // FLIGHT AIRPLANE: 1:1 Leeroy Atmos & Initial Import Placement
        const flightX = _planeInitPos.x + 0.1 * (-0.5 + Math.sin(0.5 * time));
        const flightY =
          _planeInitPos.y + 0.2 * Math.sin(time) + s.introPosition.y;
        const flightZ = _planeInitPos.z + s.introPosition.z;

        planeGroup.position.set(flightX, flightY, flightZ);
        planeGroup.lookAt(_planeLookAtPos);

        const turnRoll = 0.15 * (_planeLookAtPos.x - planeGroup.position.x);
        planeGroup.rotation.z += turnRoll;
      }

      // 3. ABOUT AIRPLANE (IN DEDICATED ABOUT SCENE):
      // Positioned on the left side of screen via unproject, facing forward
      // (Wings horizontal, tail fin straight up, rear facing camera, nose forward)
      const xDynamicsVal = s.aboutDummy.value * s.aboutXPosition;
      const tAbout = xDynamicsVal + 0.05 * Math.sin(0.4 * time);
      const iAbout = 0.18 * Math.sin(0.6 * time) + s.aboutYDynamics.value;

      _unprojectDir.set(tAbout, iAbout, 0).unproject(aboutCamera);
      _aboutOffset
        .copy(_unprojectDir)
        .sub(aboutCamera.position)
        .multiplyScalar(s.aboutDistanceFactor.value);
      _aboutTargetPos.copy(_unprojectDir).add(_aboutOffset);

      aboutPlaneGroup.position.copy(_aboutTargetPos);
      aboutPlaneGroup.quaternion.copy(aboutCamera.quaternion);
      aboutSkyMesh.position.copy(aboutCamera.position);
      (aboutSkyMesh.material as THREE.ShaderMaterial).uniforms.uTime.value =
        time;

      // Camera position with text framing (Atmos signature framing)
      if (s.isExploring && !s.hasEnded) {
        camera.position.set(_camPos.x, _camPos.y, _camPos.z);
        camera.lookAt(_camLookAt.x, _camLookAt.y, _camLookAt.z);

        // Lateral camera offset factor based on aspect ratio (Atmos exact responsive logic)
        const cameraOffsetFactor = THREE.MathUtils.clamp(
          THREE.MathUtils.mapLinear(camera.aspect, 1.6, 0.6, 0, 1),
          0,
          1,
        );
        const tOffset =
          eFactor * (closestTextItem.positionOffset?.x ?? 1.0) * 3.0;
        if (Math.abs(tOffset) > 0.0001) {
          _lateralVec.set(1, 0, 0).applyQuaternion(camera.quaternion);
          camera.position.add(
            _lateralVec.multiplyScalar(tOffset * cameraOffsetFactor),
          );
          camera.rotation.y += 0.1 * -tOffset;
        }
      } else if (!s.isExploring) {
        camera.position.set(0, 0, 8);
        camera.lookAt(0, 0, -20);
      }

      // Sky dome follows camera
      skyMesh.position.copy(camera.position);
      skyMaterial.uniforms.uTime.value = time;
      skyMaterial.uniforms.uGradientMixer.value = Am / 0.95;
      skyMesh.rotation.x = 0;

      // -------------------------------------------------------------
      // SPEED LINES / WIND PARTICLES (1:1 LEEROY ATMOS PARITY)
      // Anchored along flight path curve slightly ahead of camera (leadT = Am + 0.01 / curveSizeFactor)
      // and facing the flight tangent direction (_camLookAt).
      // Each streak advances towards the camera along Z, wrapping around every 80 units.
      // Opacity dynamically responds to forward velocity & scroll, clamped to 0.1 max.
      // -------------------------------------------------------------
      const windLeadT = Math.min(Am + 0.01 / curveSizeFactor, 1.0);
      flightCurve.getPointAt(windLeadT, windMesh.position);
      windMesh.lookAt(_camLookAt);

      for (let i = 0; i < windCount; i++) {
        windMesh.getMatrixAt(i, _particleMatrix);
        _particlePos.setFromMatrixPosition(_particleMatrix);
        _particlePos.z += 0.2 * (1 + (i % 5));
        _particlePos.z = ((_particlePos.z + 40) % 80) - 40;

        _particleEuler.set(0.5 * Math.PI, 0, planeGroup.rotation.y);
        _particleQuat.setFromEuler(_particleEuler);
        _particleMatrix.compose(_particlePos, _particleQuat, _particleScale);
        windMesh.setMatrixAt(i, _particleMatrix);
      }
      windMesh.instanceMatrix.needsUpdate = true;

      // 3D Objects in flight scene (keeps path ending fade-out animation intact)
      planeGroup.visible =
        s.isExploring && (!s.hasEnded || planeMat.opacity > 0.001);
      trailMesh.visible =
        s.isExploring && (!s.hasEnded || trailMat.opacity > 0.001);
      windMesh.visible = s.isExploring && !s.hasEnded;
      if (s.isExploring && !s.hasEnded) {
        trailMat.opacity = THREE.MathUtils.lerp(trailMat.opacity, 0.55, 0.05);
      }

      // Dynamic speed lines opacity:
      // Exact Leeroy formula: responds to scroll speed and forward glide, clamped to [0, 0.1]
      const windFactor = window.innerWidth > 1000 ? 0.001 : 0.02;
      if (s.isExploring && !s.hasEnded) {
        const scrollDelta = Math.abs(s.scrollerDeltaY - s.scrollerCurrentY);
        const forwardGlide = Math.abs(s.completion - s.Am) * 20.0;
        const speedValue = Math.max(scrollDelta * windFactor, forwardGlide);
        const targetWindOpacity = THREE.MathUtils.clamp(speedValue, 0, 0.1);
        windMat.opacity = THREE.MathUtils.lerp(
          windMat.opacity,
          targetWindOpacity,
          0.05,
        );
      } else {
        windMat.opacity = THREE.MathUtils.lerp(windMat.opacity, 0, 0.1);
      }

      // -------------------------------------------------------------
      // DYNAMIC ATMOSPHERIC LIGHTING (1:1 LEEROY ATMOS PARITY)
      // 3D objects (airplane, clouds, elephant) dynamically absorb the ambient bounce light of the sky
      // -------------------------------------------------------------
      const normalizedProgress = THREE.MathUtils.clamp(Am / 0.95, 0, 1);
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

      // Clouds distance & intro fading
      const currentIntroAlpha = s.introCloudAlpha.value;
      cloudsList.forEach(({ mesh, pos }) => {
        if (!s.isExploring || currentIntroAlpha < 0.01) {
          mesh.visible = false;
          (mesh.material as THREE.MeshLambertMaterial).opacity = 0;
          return;
        }
        mesh.visible = true;
        const dist = camera.position.distanceTo(pos);
        let alpha = THREE.MathUtils.clamp(1 - dist / 30, 0, 1);
        alpha = 2.0 * Math.pow(alpha, 2);
        (mesh.material as THREE.MeshLambertMaterial).opacity = Math.min(
          alpha * currentIntroAlpha,
          1.0,
        );
      });

      // Elephant bobbing animation
      if (elephantMesh) {
        if (!s.isExploring || currentIntroAlpha < 0.01) {
          elephantMesh.visible = false;
        } else {
          elephantMesh.visible = true;
          elephantMesh.position.y = elephantInitY + 1.0 * Math.sin(0.2 * time);
          elephantMesh.rotation.y += 0.001;
          const elDist = camera.position.distanceTo(elephantMesh.position);
          let elAlpha = THREE.MathUtils.clamp(1 - elDist / 30, 0, 1);
          elAlpha = 2.0 * Math.pow(elAlpha, 2);
          elephantMesh.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              (
                (c as THREE.Mesh).material as THREE.MeshLambertMaterial
              ).opacity = Math.min(elAlpha * currentIntroAlpha, 0.85);
            }
          });
        }
      }

      // 3D TROIKA TEXTS DISTANCE FADING (1:1 ATMOS QUADRATIC FORMULA)
      textItems.forEach(({ group, sup, title, body }) => {
        if (!s.isExploring) {
          group.visible = false;
          return;
        }
        const dist = camera.position.distanceTo(group.position);
        let alpha = THREE.MathUtils.clamp(1 - dist / 30, 0, 1);
        alpha = Math.min(2.0 * Math.pow(alpha, 2), 1.0);

        if (alpha < 0.01) {
          group.visible = false;
        } else {
          group.visible = true;
          if (sup) sup.material.opacity = alpha;
          if (title) title.material.opacity = alpha;
          body.material.opacity = alpha;
        }
      });

      // -------------------------------------------------------------
      // AUTHENTIC LEEROY ATMOS DUAL-SCENE WAVECLIP & FILM GRAIN RENDERER
      // -------------------------------------------------------------
      transitionMat.uniforms.uProgress.value = s.transitionProgress.value;
      grainMat.uniforms.time.value = time;

      if (s.transitionMode === "NONE") {
        if (s.currentScene === "FLIGHT") {
          renderer.setRenderTarget(rtFlight);
          renderer.render(scene, camera);
          grainMat.uniforms.tDiffuse.value = rtFlight.texture;
        } else {
          renderer.setRenderTarget(rtAbout);
          renderer.render(aboutScene, aboutCamera);
          grainMat.uniforms.tDiffuse.value = rtAbout.texture;
        }
        renderer.setRenderTarget(null);
        renderer.render(grainScene, orthoCamera);
      } else if (s.transitionMode === "TO_ABOUT") {
        // Render flight scene to rtFlight
        renderer.setRenderTarget(rtFlight);
        renderer.render(scene, camera);

        // Render about scene to rtAbout
        renderer.setRenderTarget(rtAbout);
        renderer.render(aboutScene, aboutCamera);

        // Blend onto rtTransition with Perlin noise wave transition (NO feedback loop!)
        transitionMat.uniforms.uTexture1.value = rtFlight.texture;
        transitionMat.uniforms.uTexture2.value = rtAbout.texture;
        transitionMat.uniforms.uDirection.value = s.transitionDirection;
        transitionMat.uniforms.uSeed.value = s.transitionSeed;

        renderer.setRenderTarget(rtTransition);
        renderer.render(transitionScene, orthoCamera);

        grainMat.uniforms.tDiffuse.value = rtTransition.texture;
        renderer.setRenderTarget(null);
        renderer.render(grainScene, orthoCamera);
      } else if (s.transitionMode === "TO_FLIGHT") {
        // Render about scene to rtAbout
        renderer.setRenderTarget(rtAbout);
        renderer.render(aboutScene, aboutCamera);

        // Render flight scene to rtFlight
        renderer.setRenderTarget(rtFlight);
        renderer.render(scene, camera);

        // Blend back to flight onto rtTransition with Perlin noise wave transition (NO feedback loop!)
        transitionMat.uniforms.uTexture1.value = rtAbout.texture;
        transitionMat.uniforms.uTexture2.value = rtFlight.texture;
        transitionMat.uniforms.uDirection.value = s.transitionDirection;
        transitionMat.uniforms.uSeed.value = s.transitionSeed;

        renderer.setRenderTarget(rtTransition);
        renderer.render(transitionScene, orthoCamera);

        grainMat.uniforms.tDiffuse.value = rtTransition.texture;
        renderer.setRenderTarget(null);
        renderer.render(grainScene, orthoCamera);
      }

      // Notify parent of progress & completion for HUD/scrollbar
      if (Date.now() - lastProgressReportTime > 30) {
        lastProgressReportTime = Date.now();
        onProgressChange(Am, s.completion);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      stateRef.current.aboutXPosition = window.innerWidth > 1000 ? -0.4 : 0;
      updateCameraFov();
      updateSkyYCompression();

      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(dpr);

      rtFlight.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
      rtAbout.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
      rtTransition.setSize(window.innerWidth * dpr, window.innerHeight * dpr);

      grainMat.uniforms.uXCount.value =
        window.innerWidth / (window.devicePixelRatio || 1);
      grainMat.uniforms.uYCount.value =
        window.innerHeight / (window.devicePixelRatio || 1);

      aboutCamera.aspect = window.innerWidth / window.innerHeight;
      let aboutFov = THREE.MathUtils.mapLinear(
        aboutCamera.aspect,
        1.6,
        0.6,
        60,
        90,
      );
      aboutCamera.fov = THREE.MathUtils.clamp(aboutFov, 60, 90);
      aboutCamera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      cancelAnimationFrame(animId);
      rtFlight.dispose();
      rtAbout.dispose();
      rtTransition.dispose();
      transitionMat.dispose();
      transitionQuad.geometry.dispose();
      grainMat.dispose();
      grainQuad.geometry.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};

export default AtmosCanvas;
