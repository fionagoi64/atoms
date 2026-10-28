import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import gsap from "gsap";
import { createSkyMaterial } from "../shaders/skyShader";
import { TransitionShader } from "../shaders/transitionShader";
import { GrainShader } from "../shaders/grainShader";
import {
  createAirplane,
  createClouds,
  createElephant,
  createSpeedLines,
  createLighting,
  createFlightCurve,
  createSkyTexts,
  createCameraRig,
} from "../scene";

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

  // Jump keys for debugging / fast inspection (1: Fact #1, 4: Fact #4, 9: Fact #9)
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

    // Flight Scene
    const scene = new THREE.Scene();

    // 1. Reusable Camera Rig (Flight, About, and Orthographic Compositor Cameras)
    const cameraRig = createCameraRig(window.innerWidth, window.innerHeight);
    const { camera, aboutCamera, orthoCamera } = cameraRig;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);

    scene.add(camera);

    // 1. Reusable Lighting System
    const lighting = createLighting(scene, camera);

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

    // 2. Reusable Flight Curve & Contrail
    const { flightCurve, trailMesh, trailMat, curveSizeFactor } =
      createFlightCurve(scene);

    // Dedicated About Scene
    const aboutScene = new THREE.Scene();

    const aboutSkyGeo = new THREE.SphereGeometry(50, 32, 16);
    const aboutSkyMat = createSkyMaterial(0.06);
    aboutSkyMat.uniforms.uGradientMixer.value = 0.01;
    const aboutSkyMesh = new THREE.Mesh(aboutSkyGeo, aboutSkyMat);
    aboutSkyMesh.rotation.x = -0.1 * Math.PI;
    aboutScene.add(aboutSkyMesh);

    // Dedicated About Lighting
    const aboutLight = new THREE.HemisphereLight(0xffffff, 0x0a30f8, 2.2);
    aboutLight.position.set(-6, 14, 0);
    aboutScene.add(aboutLight);

    const aboutTopLight = new THREE.DirectionalLight(0xffffff, 1.0);
    aboutTopLight.position.set(-6, 12, 6);
    aboutScene.add(aboutTopLight);

    const aboutBlueFill = new THREE.DirectionalLight(0x2055ff, 1.4);
    aboutBlueFill.position.set(1, -4, 12);
    aboutScene.add(aboutBlueFill);

    // Waveclip transition pass & render targets
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

    // Film Grain Compositor (1:1 Postprocessing)
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

    // 3. Reusable Airplane Controller (Flight & About Scene Gliders)
    const airplane = createAirplane(gltfLoader, scene, aboutScene);

    // 4. Reusable Speed Lines / Wind Particles
    const speedLines = createSpeedLines(scene);

    // 5. Reusable 3D Sky Texts (Aviation Facts)
    const skyTexts = createSkyTexts(scene, flightCurve, curveSizeFactor);

    // 6. Reusable 3D Clouds Manager
    const clouds = createClouds(
      gltfLoader,
      scene,
      flightCurve,
      curveSizeFactor,
    );

    // 7. Reusable 3D Elephant Easter Egg
    const elephant = createElephant(gltfLoader, scene, flightCurve);

    // Global debug helpers
    (window as any).__scene = scene;
    (window as any).__textItems = skyTexts.textItems;
    (window as any).__welcomeGroup = skyTexts.welcomeGroup;
    (window as any).__seekTo = (p: number) => {
      const targetY =
        THREE.MathUtils.clamp(p, 0, 1) * stateRef.current.scrollerRange;
      stateRef.current.scrollerDeltaY = targetY;
      stateRef.current.scrollerCurrentY = targetY;
      stateRef.current.Am = p;
    };

    // Scroller Event Listeners
    const onWheel = (e: WheelEvent) => {
      const s = stateRef.current;
      if (!s.isExploring) return;
      if (s.isAboutOpen || s.hasEnded) return;

      e.preventDefault();
      const currentDpr = window.devicePixelRatio || 1;
      let pixelY = e.deltaY;
      if (e.deltaMode === 1) pixelY *= 33;
      else if (e.deltaMode === 2) pixelY *= 600;

      const normalizedDelta = (pixelY / currentDpr) * 0.75;
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

      if (!s.isExploring) return;
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

    // Scratch vectors for high-performance animation updates
    const _camPos = new THREE.Vector3();
    const _camTangent = new THREE.Vector3();
    const _camLookAt = new THREE.Vector3();
    const _planeInitPos = new THREE.Vector3();
    const _planeLookAtPos = new THREE.Vector3();
    const _lateralVec = new THREE.Vector3();

    const clock = new THREE.Clock();
    let animId: number;
    let lastProgressReportTime = 0;

    const render = () => {
      const time = clock.getElapsedTime();
      const s = stateRef.current;

      // 1. Virtual Scroller Update
      s.scrollerCurrentY = THREE.MathUtils.lerp(
        s.scrollerCurrentY,
        s.scrollerDeltaY,
        0.09,
      );
      s.completion = s.scrollerCurrentY / s.scrollerRange;

      // 2. Flight outro ending trigger
      if (s.Am >= 0.95 && !s.hasEnded && s.isExploring) {
        s.hasEnded = true;

        airplane.triggerOutro(trailMat);

        cameraRig.triggerOutro();

        setTimeout(() => {
          onEndReached();
        }, 2000);
      }

      // 3. Dynamic speed deceleration near closest fact
      let closestTextItem = skyTexts.textItems[0];
      let minProgDiff = 9999;
      for (let i = 0; i < skyTexts.textItems.length; i++) {
        const diff = Math.abs(s.Am - skyTexts.textItems[i].progress);
        if (diff < minProgDiff) {
          minProgDiff = diff;
          closestTextItem = skyTexts.textItems[i];
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

      // Flight progression interpolation
      s.Am = THREE.MathUtils.lerp(s.Am, s.completion, 0.025 * s.progressAmp);
      const Am = THREE.MathUtils.clamp(s.Am, 0.0001, 0.9999);

      // Camera sampling along flight path
      flightCurve.getPointAt(Am, _camPos);
      flightCurve.getTangentAt(Am, _camTangent);
      _camLookAt.copy(_camPos).add(_camTangent);

      // Flight airplane lead point sampling
      const planeLeadT = Math.min(Am + 0.05 / curveSizeFactor, 1.0);
      const lookAtLeadT = Math.min(Am + 0.1 / curveSizeFactor, 1.0);
      flightCurve.getPointAt(planeLeadT, _planeInitPos);
      flightCurve.getPointAt(lookAtLeadT, _planeLookAtPos);

      // 4. Update Reusable 3D Airplane
      airplane.updateFlight(
        _planeInitPos,
        _planeLookAtPos,
        s.introPosition,
        time,
        s.isExploring,
        s.hasEnded,
      );

      airplane.updateAbout(
        aboutCamera,
        s.aboutDummy.value * s.aboutXPosition,
        s.aboutYDynamics.value,
        s.aboutDistanceFactor.value,
        time,
      );

      aboutSkyMesh.position.copy(aboutCamera.position);
      (aboutSkyMesh.material as THREE.ShaderMaterial).uniforms.uTime.value =
        time;

      // Camera position with text framing
      cameraRig.updateFlightCamera(
        _camPos,
        _camLookAt,
        s.isExploring,
        s.hasEnded,
        closestTextItem.positionOffset?.x ?? 1.0,
        eFactor,
      );

      // Sky dome follows camera
      skyMesh.position.copy(camera.position);
      skyMaterial.uniforms.uTime.value = time;
      skyMaterial.uniforms.uGradientMixer.value = Am / 0.95;
      skyMesh.rotation.x = 0;

      // 5. Update Reusable Speed Lines / Wind Particles
      const scrollDelta = Math.abs(s.scrollerDeltaY - s.scrollerCurrentY);
      const forwardGlide = Math.abs(s.completion - s.Am) * 20.0;
      speedLines.updateSpeedLines(
        flightCurve,
        Am,
        curveSizeFactor,
        _camLookAt,
        airplane.flightGroup.rotation.y,
        s.isExploring,
        s.hasEnded,
        scrollDelta,
        forwardGlide,
      );

      // Contrail visibility and smooth opacity
      trailMesh.visible =
        s.isExploring && (!s.hasEnded || trailMat.opacity > 0.001);
      if (s.isExploring && !s.hasEnded) {
        trailMat.opacity = THREE.MathUtils.lerp(trailMat.opacity, 0.55, 0.05);
      }

      // 6. Update Reusable Atmospheric Lighting
      lighting.updateLighting(Am);

      // 7. Update Reusable 3D Clouds
      clouds.updateClouds(
        camera.position,
        s.isExploring,
        s.introCloudAlpha.value,
      );

      // 8. Update Reusable 3D Elephant Easter Egg
      elephant.updateElephant(
        time,
        camera.position,
        s.isExploring,
        s.introCloudAlpha.value,
      );

      // 9. Update Reusable 3D Sky Texts
      skyTexts.updateSkyTexts(camera.position, s.isExploring);

      // 10. Dual-scene waveclip transition & grain rendering
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
        renderer.setRenderTarget(rtFlight);
        renderer.render(scene, camera);

        renderer.setRenderTarget(rtAbout);
        renderer.render(aboutScene, aboutCamera);

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
        renderer.setRenderTarget(rtAbout);
        renderer.render(aboutScene, aboutCamera);

        renderer.setRenderTarget(rtFlight);
        renderer.render(scene, camera);

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

      // Progress reporting for UI / scrollbar
      if (Date.now() - lastProgressReportTime > 30) {
        lastProgressReportTime = Date.now();
        onProgressChange(Am, s.completion);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      stateRef.current.aboutXPosition = window.innerWidth > 1000 ? -0.4 : 0;
      cameraRig.handleResize(window.innerWidth, window.innerHeight);
      updateSkyYCompression();

      const currentDpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(currentDpr);

      rtFlight.setSize(
        window.innerWidth * currentDpr,
        window.innerHeight * currentDpr,
      );
      rtAbout.setSize(
        window.innerWidth * currentDpr,
        window.innerHeight * currentDpr,
      );
      rtTransition.setSize(
        window.innerWidth * currentDpr,
        window.innerHeight * currentDpr,
      );

      grainMat.uniforms.uXCount.value =
        window.innerWidth / (window.devicePixelRatio || 1);
      grainMat.uniforms.uYCount.value =
        window.innerHeight / (window.devicePixelRatio || 1);
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
