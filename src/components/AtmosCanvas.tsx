import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { Text } from 'troika-three-text'
import gsap from 'gsap'
import { ATMOS_FACTS, CLOUD_CONFIGS } from '../data/atmosData'

interface AtmosCanvasProps {
  isExploring: boolean
  isAboutOpen: boolean
  mousePos: { x: number; y: number }
  seekRatio?: number | null
  onProgressChange: (progress: number, completion: number) => void
  onExploreStart: () => void
  onEndReached: () => void
}

const SKY_VERTEX_SHADER = `
varying vec3 vPos;
varying vec2 vUv;

void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  vPos = position;
  vUv = uv;
}
`

const SKY_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uGradientMixer;
uniform float uYCompression;

varying vec3 vPos;
varying vec2 vUv;

vec4 permute(vec4 x) {
  return mod(((x*34.0)+1.0)*x, 289.0);
}

vec2 fade(vec2 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

vec3 rgb(int r, int g, int b) {
  return vec3(float(r) / 255.0, float(g) / 255.0, float(b) / 255.0);
}

vec3 gradient(vec3 colorTop, vec3 colorBottom, vec3 colorNoise, float yFactor, float noise) {
  vec3 vertical_gradient = mix(colorTop, colorBottom, yFactor);
  return mix(vertical_gradient, colorNoise, noise * (1.0 - yFactor));
}

vec3 gradientMultimix(vec3 elements[8], float v) {
  lowp int i1 = int(v);
  float completion = mod(v, 1.0);

  if (i1 == 0) return mix(elements[0], elements[1], completion);
  else if (i1 == 1) return mix(elements[1], elements[2], completion);
  else if (i1 == 2) return mix(elements[2], elements[3], completion);
  else if (i1 == 3) return mix(elements[3], elements[4], completion);
  else if (i1 == 4) return mix(elements[4], elements[5], completion);
  else if (i1 == 5) return mix(elements[5], elements[6], completion);
  else if (i1 == 6) return mix(elements[6], elements[7], completion);
  return elements[7];
}

void main() {
  float yFactor = clamp(0.5 - (vPos.y * uYCompression) / 2.0, 0.0, 1.0);
  float speed = 0.2;
  float noise = cnoise(vPos.xy * 0.025 + uTime * speed);
  noise += cnoise(vPos.xy * 0.025 - uTime * speed);
  noise = clamp(noise, 0.0, 1.0);

  vec3 gradients[8];
  gradients[0] = gradient(rgb(8, 37, 198), rgb(196, 203, 244), rgb(0, 27, 181), yFactor, noise);
  gradients[1] = gradient(rgb(116, 136, 234), rgb(255, 192, 148), rgb(116, 136, 234), yFactor, noise);
  gradients[2] = gradient(rgb(255, 192, 148), rgb(222, 229, 253), rgb(136, 162, 247), yFactor, noise);
  gradients[3] = gradient(rgb(136, 162, 247), rgb(222, 229, 253), rgb(136, 162, 247), yFactor, noise);
  gradients[4] = gradient(rgb(136, 162, 247), rgb(222, 229, 253), rgb(255, 192, 148), yFactor, noise);
  gradients[5] = gradient(rgb(253, 175, 120), rgb(255, 230, 213), rgb(253, 175, 120), yFactor, noise);
  gradients[6] = gradient(rgb(253, 175, 120), rgb(197, 211, 254), rgb(90, 108, 216), yFactor, noise);
  gradients[7] = gradient(rgb(90, 108, 216), rgb(197, 211, 254), rgb(90, 108, 216), yFactor, noise);

  float gradientLength = 8.0;
  vec3 color = gradientMultimix(gradients, clamp(uGradientMixer, 0.0, 0.999) * (gradientLength - 1.0));

  gl_FragColor = vec4(color, 1.0);
}
`

export const AtmosCanvas: React.FC<AtmosCanvasProps> = ({
  isExploring,
  isAboutOpen,
  mousePos,
  seekRatio,
  onProgressChange,
  onExploreStart,
  onEndReached
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroller & Flight State (Exact replica of Atmos virtual scroller)
  const stateRef = useRef({
    scrollerRange: 13000 * 2.5, // 32500 virtual units
    scrollerDeltaY: 0,
    scrollerCurrentY: 0,
    completion: 0,
    progressAmp: 1.0,
    Am: 0.0001,
    introPosition: new THREE.Vector3(0, -2, 17.5),
    aboutLerp: 0,
    mouseLerp: { x: 0, y: 0 },
    isExploring: false,
    isAboutOpen: false,
    hasEnded: false
  })

  // Synchronize flags
  useEffect(() => {
    stateRef.current.isAboutOpen = isAboutOpen
  }, [isAboutOpen])

  useEffect(() => {
    if (seekRatio !== undefined && seekRatio !== null) {
      const targetY = THREE.MathUtils.clamp(seekRatio, 0, 1) * stateRef.current.scrollerRange
      stateRef.current.scrollerDeltaY = targetY
      stateRef.current.scrollerCurrentY = targetY
    }
  }, [seekRatio])

  useEffect(() => {
    stateRef.current.isExploring = isExploring
    if (isExploring) {
      if (stateRef.current.scrollerDeltaY === 0) {
        stateRef.current.scrollerDeltaY = 350
      }
      gsap.to(stateRef.current.introPosition, {
        y: 0,
        z: 0,
        duration: 3.0,
        ease: 'power2.out'
      })
    } else {
      gsap.to(stateRef.current.introPosition, {
        y: -2,
        z: 17.5,
        duration: 1.5,
        ease: 'power2.out'
      })
    }
  }, [isExploring])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene & Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x5a6cd8, 1.5)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2)
    dirLight.position.set(-10, 15, 10)
    scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0xb0caff, 1.0)
    fillLight.position.set(10, -5, -5)
    scene.add(fillLight)

    // Sky Dome Mesh
    const skyGeo = new THREE.SphereGeometry(300, 32, 16)
    const skyMaterial = new THREE.ShaderMaterial({
      vertexShader: SKY_VERTEX_SHADER,
      fragmentShader: SKY_FRAGMENT_SHADER,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uGradientMixer: { value: 0 },
        uYCompression: { value: 0.05 }
      }
    })
    const skyMesh = new THREE.Mesh(skyGeo, skyMaterial)
    scene.add(skyMesh)

    // Flight Curve (CatmullRomCurve3 with curve_size_factor = 2.5)
    const curveSizeFactor = 2.5
    const dir = 1
    const curvePoints = [
      new THREE.Vector3(0, 0, 0).multiplyScalar(curveSizeFactor),
      new THREE.Vector3(0, 0, -20).multiplyScalar(curveSizeFactor),
      new THREE.Vector3(5 * dir, 0, -40).multiplyScalar(curveSizeFactor),
      new THREE.Vector3(-5 * dir, 0, -60).multiplyScalar(curveSizeFactor),
      new THREE.Vector3(5 * dir, 0, -80).multiplyScalar(curveSizeFactor),
      new THREE.Vector3(0, 0, -100).multiplyScalar(curveSizeFactor),
      new THREE.Vector3(0, 0, -120).multiplyScalar(curveSizeFactor)
    ]
    const flightCurve = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5)

    // Contrail / Smoke Trail (TubeGeometry)
    const trailGeo = new THREE.TubeGeometry(
      flightCurve,
      Math.round(200 * curveSizeFactor),
      0.022,
      6,
      false
    )
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    })
    const trailMesh = new THREE.Mesh(trailGeo, trailMat)
    trailMesh.position.y = -0.5
    scene.add(trailMesh)

    // Airplane Group
    const planeGroup = new THREE.Group()
    scene.add(planeGroup)

    const placeholderGeo = new THREE.ConeGeometry(0.3, 1.4, 16)
    placeholderGeo.rotateX(Math.PI / 2)
    const placeholderPlane = new THREE.Mesh(
      placeholderGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    )
    planeGroup.add(placeholderPlane)

    // Setup GLTF & Draco Loaders
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)

    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.32,
      metalness: 0.05,
      transparent: true,
      opacity: 1
    })

    let planeMesh: THREE.Object3D | null = null
    gltfLoader.load(
      '/models/planeur.glb',
      (gltf) => {
        planeGroup.remove(placeholderPlane)
        planeMesh = gltf.scene

        planeMesh.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.material = planeMat
            mesh.castShadow = true
            mesh.receiveShadow = true
          }
        })

        planeMesh.scale.set(0.65, 0.65, 0.65)
        planeGroup.add(planeMesh)
      },
      undefined,
      (err) => console.error('Error loading planeur.glb:', err)
    )

    // -------------------------------------------------------------
    // SPEED LINES / WIND PARTICLES - EXACT AUTHENTIC ATMOS FORMULA
    // OctahedronGeometry(0.012, 0) stretched by (0.5, 30, 0.5)
    // Opacity strictly clamped between 0 and 0.04 (ultra-subtle, elegant vapor!)
    // -------------------------------------------------------------
    const windCount = 120
    const windGeo = new THREE.OctahedronGeometry(0.012, 0)
    const windMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    })
    const windMesh = new THREE.InstancedMesh(windGeo, windMat, windCount)
    const dummy = new THREE.Object3D()
    const windScale = new THREE.Vector3(0.5, 30, 0.5)

    for (let i = 0; i < windCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 3.2 + Math.random() * 1.6 // Periphery framing wings
      const pos = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        Math.random() * 80 - 40
      )
      const rot = new THREE.Euler(
        0.5 * Math.PI,
        Math.random() * Math.PI * 2,
        0
      )

      dummy.position.copy(pos)
      dummy.rotation.copy(rot)
      dummy.scale.copy(windScale)
      dummy.updateMatrix()
      windMesh.setMatrixAt(i, dummy.matrix)
    }
    windMesh.instanceMatrix.needsUpdate = true
    scene.add(windMesh)

    // -------------------------------------------------------------
    // 3D TROIKA TEXTS IN THE SKY - WITH EXACT ROTATION (NO REFLECTION!)
    // In Troika, text glyphs face +Z. Calling lookAt points -Z towards target.
    // Adding rotateY(Math.PI) flips local +Z towards the oncoming camera so
    // text is 100% normal, unmirrored, and crisp left-to-right!
    // -------------------------------------------------------------
    interface TextItem {
      group: THREE.Group
      sup?: Text
      title?: Text
      body: Text
      progress: number
      align: 'left' | 'right'
      alignFactor: number
      position: THREE.Vector3
      pre_position: THREE.Vector3
    }

    const textItems: TextItem[] = []

    const orientTextToCamera = (group: THREE.Group, prog: number) => {
      const lookPt = flightCurve.getPointAt(Math.max(0, prog - 0.025))
      lookPt.y = group.position.y
      group.lookAt(lookPt)
    }

    // 1. Welcome announcement at progress = 0.1
    const welcomeGroup = new THREE.Group()
    const welcomeBody = new Text()
    welcomeBody.text = "Hello passengers and welcome aboard. Please sit back, relax, and enjoy the view while we tell you some of our favourite facts about the aviation world."
    welcomeBody.font = '/fonts/font2.ttf'
    welcomeBody.fontSize = 0.26
    welcomeBody.maxWidth = 3.2
    welcomeBody.lineHeight = 1.3
    welcomeBody.color = 0xffffff
    welcomeBody.textAlign = 'left'
    welcomeBody.anchorX = 'left'
    welcomeBody.material.transparent = true
    welcomeBody.material.opacity = 0
    welcomeBody.sync()
    welcomeGroup.add(welcomeBody)

    const welcomeOffset = new THREE.Vector3(1, 2.8, 0)
    const welcomeCurvePt = flightCurve.getPointAt(0.1)
    welcomeGroup.position.copy(welcomeCurvePt).add(welcomeOffset)
    orientTextToCamera(welcomeGroup, 0.1)
    scene.add(welcomeGroup)

    const welcomePrePos = flightCurve.getPointAt(0.1 - 0.015).add(welcomeOffset)
    textItems.push({
      group: welcomeGroup,
      body: welcomeBody,
      progress: 0.1,
      align: 'left',
      alignFactor: 1.0,
      position: welcomeGroup.position,
      pre_position: welcomePrePos
    })

    ;(window as any).__scene = scene
    ;(window as any).__textItems = textItems
    ;(window as any).__welcomeGroup = welcomeGroup

    // 2. The 8 aviation facts spaced evenly at 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9
    const FACT_CONFIGS = [
      { factIdx: 0, progress: 0.2, align: 'left' as const, offset: new THREE.Vector3(1, 1, 0) },
      { factIdx: 1, progress: 0.3, align: 'left' as const, offset: new THREE.Vector3(1, 1, 0) },
      { factIdx: 2, progress: 0.4, align: 'right' as const, offset: new THREE.Vector3(-1, 1, 0) },
      { factIdx: 3, progress: 0.5, align: 'left' as const, offset: new THREE.Vector3(1, 1, 0) },
      { factIdx: 4, progress: 0.6, align: 'right' as const, offset: new THREE.Vector3(-1, 1, 0) },
      { factIdx: 5, progress: 0.7, align: 'left' as const, offset: new THREE.Vector3(1, 1, 0) },
      { factIdx: 6, progress: 0.8, align: 'right' as const, offset: new THREE.Vector3(-0.5, 1, 0) },
      { factIdx: 7, progress: 0.9, align: 'left' as const, offset: new THREE.Vector3(1, 1, 0) }
    ]

    FACT_CONFIGS.forEach((cfg) => {
      const fact = ATMOS_FACTS[cfg.factIdx % ATMOS_FACTS.length]
      const group = new THREE.Group()

      const sup = new Text()
      sup.text = fact.sup
      sup.font = '/fonts/font2.ttf'
      sup.fontSize = 0.18
      sup.position.y = 0.25
      sup.color = 0xffffff
      sup.textAlign = cfg.align
      sup.anchorX = cfg.align
      sup.material.transparent = true
      sup.material.opacity = 0
      sup.sync()
      group.add(sup)

      const title = new Text()
      title.text = fact.title
      title.font = '/fonts/font1.woff'
      title.fontSize = 0.50
      title.position.y = -0.055
      title.color = 0xffffff
      title.maxWidth = 2.5
      title.lineHeight = 1.05
      title.textAlign = cfg.align
      title.anchorX = cfg.align
      title.material.transparent = true
      title.material.opacity = 0
      title.sync()
      group.add(title)

      const body = new Text()
      body.text = fact.body
      body.font = '/fonts/font2.ttf'
      body.fontSize = 0.18
      body.position.y = -1.2
      body.maxWidth = 3.0
      body.lineHeight = 1.35
      body.color = 0xffffff
      body.textAlign = cfg.align
      body.anchorX = cfg.align
      body.material.transparent = true
      body.material.opacity = 0
      body.sync()
      group.add(body)

      const curvePt = flightCurve.getPointAt(cfg.progress)
      group.position.copy(curvePt).add(cfg.offset)
      orientTextToCamera(group, cfg.progress)
      scene.add(group)

      const prePos = flightCurve.getPointAt(cfg.progress - 0.015).add(cfg.offset)
      textItems.push({
        group,
        sup,
        title,
        body,
        progress: cfg.progress,
        align: cfg.align,
        alignFactor: cfg.align === 'right' ? -1.0 : 1.0,
        position: group.position,
        pre_position: prePos
      })
    })

    // -------------------------------------------------------------
    // 3D CLOUDS (Atmospheric scenery along the path)
    // -------------------------------------------------------------
    const cloudsList: { mesh: THREE.Mesh; pos: THREE.Vector3 }[] = []
    let cloudGeo1: THREE.BufferGeometry | null = null
    let cloudGeo2: THREE.BufferGeometry | null = null

    const spawnClouds = () => {
      CLOUD_CONFIGS.forEach((cfg) => {
        const geo = cfg.type === 1 && cloudGeo1 ? cloudGeo1 : cloudGeo2 ? cloudGeo2 : new THREE.SphereGeometry(1.5, 12, 12)
        const mat = new THREE.MeshStandardMaterial({
          color: 0xf5f8ff,
          roughness: 0.9,
          metalness: 0.0,
          transparent: true,
          opacity: 0.8
        })
        const mesh = new THREE.Mesh(geo, mat)

        const curvePt = flightCurve.getPointAt(cfg.progress)
        const tangent = flightCurve.getTangentAt(cfg.progress).normalize()
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()
        const pos = curvePt.clone().add(normal.multiplyScalar(cfg.pos[0])).add(new THREE.Vector3(0, cfg.pos[1], 0))

        mesh.position.copy(pos)
        mesh.scale.setScalar(cfg.scale || 1.2)
        if (cfg.rotY) mesh.rotation.y = cfg.rotY

        scene.add(mesh)
        cloudsList.push({ mesh, pos })
      })
    }

    gltfLoader.load('/models/cloud_11.glb', (g1) => {
      g1.scene.traverse((c) => {
        if ((c as THREE.Mesh).isMesh && !cloudGeo1) cloudGeo1 = (c as THREE.Mesh).geometry
      })
      gltfLoader.load('/models/cloud_22.glb', (g2) => {
        g2.scene.traverse((c) => {
          if ((c as THREE.Mesh).isMesh && !cloudGeo2) cloudGeo2 = (c as THREE.Mesh).geometry
        })
        spawnClouds()
      }, undefined, () => spawnClouds())
    }, undefined, () => spawnClouds())

    // 3D Elephant Easter egg
    gltfLoader.load('/models/elephant.glb', (gltf) => {
      const elephant = gltf.scene
      elephant.scale.set(0.65, 0.65, 0.65)
      const elPt = flightCurve.getPointAt(0.42)
      elephant.position.copy(elPt).add(new THREE.Vector3(-6, 2, 0))
      elephant.rotation.y = Math.PI / 4

      const elMat = new THREE.MeshStandardMaterial({
        color: 0xe8efff,
        roughness: 0.6,
        transparent: true,
        opacity: 0.85
      })
      elephant.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = elMat
      })
      scene.add(elephant)
    })

    // -------------------------------------------------------------
    // VIRTUAL SCROLLER EVENT LISTENERS (EXACT ATMOS PARITY)
    // -------------------------------------------------------------
    const onWheel = (e: WheelEvent) => {
      const s = stateRef.current
      if (!s.isExploring) {
        if (e.deltaY > 5) {
          onExploreStart()
        }
        return
      }
      if (s.isAboutOpen || s.hasEnded) return

      e.preventDefault()
      const dpr = window.devicePixelRatio || 1
      let pixelY = e.deltaY
      if (e.deltaMode === 1) pixelY *= 33
      else if (e.deltaMode === 2) pixelY *= 600

      // Exact Atmos speed factor normalized for high-DPI displays
      const normalizedDelta = (pixelY / dpr) * 0.7
      s.scrollerDeltaY = THREE.MathUtils.clamp(s.scrollerDeltaY + normalizedDelta, 0, s.scrollerRange)
    }

    let touchStartY = 0
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      const s = stateRef.current
      if (e.touches.length === 0) return
      const curY = e.touches[0].clientY
      const delta = (touchStartY - curY) * 1.5
      touchStartY = curY

      if (!s.isExploring) {
        if (delta > 8) {
          onExploreStart()
        }
        return
      }
      if (s.isAboutOpen || s.hasEnded) return

      e.preventDefault()
      s.scrollerDeltaY = THREE.MathUtils.clamp(s.scrollerDeltaY + delta, 0, s.scrollerRange)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })

    // Vectors for loop
    const _camPos = new THREE.Vector3()
    const _camTangent = new THREE.Vector3()
    const _camLookAt = new THREE.Vector3()
    const _planeInitPos = new THREE.Vector3()
    const _planeLookAtPos = new THREE.Vector3()
    const _dummyMat = new THREE.Matrix4()
    const _dummyPos = new THREE.Vector3()
    const _lateralVec = new THREE.Vector3()

    const clock = new THREE.Clock()
    let animId: number
    let lastProgressReportTime = 0

    const render = () => {
      const time = clock.getElapsedTime()
      const s = stateRef.current

      // 1. Virtual Scroller Update (lerpAmount = 0.18)
      s.scrollerCurrentY = THREE.MathUtils.lerp(s.scrollerCurrentY, s.scrollerDeltaY, 0.18)
      s.completion = s.scrollerCurrentY / s.scrollerRange

      // -------------------------------------------------------------
      // EXACT ATMOS ENDING TRIGGER (Am >= 0.95)
      // Plane pitches up into the sky, contrails fade out,
      // Camera smoothly pans up into the pure atmosphere.
      // -------------------------------------------------------------
      if (s.Am >= 0.95 && !s.hasEnded && s.isExploring) {
        s.hasEnded = true

        // Plane ascends away into the distance
        gsap.to(planeGroup.position, {
          z: '-=20',
          y: '+=5',
          duration: 2.0,
          ease: 'power2.in'
        })
        gsap.to(planeGroup.rotation, {
          x: '+=0.3',
          duration: 2.0,
          ease: 'power2.in'
        })
        gsap.to([planeMat, trailMat], {
          opacity: 0,
          duration: 2.0,
          ease: 'power2.in'
        })

        // Camera tilts up towards the infinite sky
        gsap.to(camera.position, {
          y: '+=5',
          duration: 3.5,
          ease: 'power2.inOut'
        })
        gsap.to(camera.rotation, {
          x: '+=0.2',
          duration: 3.5,
          ease: 'power2.inOut'
        })

        // Reveal outro screen after 2.0s
        setTimeout(() => {
          onEndReached()
        }, 2000)
      }

      // -------------------------------------------------------------
      // DYNAMIC SPEED ON SCROLL (EXACT ATMOS DECELERATION NEAR FACTS)
      // Uses Em(e) closest fact selection and drops progressAmp to 0.02
      // -------------------------------------------------------------
      let closestTextItem = textItems[0]
      let minProgDiff = 9999
      for (let i = 0; i < textItems.length; i++) {
        const diff = Math.abs(s.Am - textItems[i].progress)
        if (diff < minProgDiff) {
          minProgDiff = diff
          closestTextItem = textItems[i]
        }
      }

      const closestDist = camera.position.distanceTo(closestTextItem.pre_position)
      let eFactor = THREE.MathUtils.clamp(1 - closestDist / (5 * curveSizeFactor), 0, 1)
      eFactor = Math.pow(eFactor, 3)
      s.progressAmp = Math.max(1 - 1.2 * eFactor, 0.02)

      // Flight progression interpolation (0.025 * progressAmp)
      s.Am = THREE.MathUtils.lerp(s.Am, s.completion, 0.025 * s.progressAmp)
      const Am = THREE.MathUtils.clamp(s.Am, 0.0001, 0.9999)

      const targetAbout = s.isAboutOpen ? 1 : 0
      s.aboutLerp = THREE.MathUtils.lerp(s.aboutLerp, targetAbout, 0.08)

      // 1. Camera along flight path
      flightCurve.getPointAt(Am, _camPos)
      flightCurve.getTangentAt(Am, _camTangent)
      _camLookAt.copy(_camPos).add(_camTangent)

      // 2. Airplane sampled ahead along path
      const planeLeadT = Math.min(Am + 0.05 / curveSizeFactor, 1.0)
      const lookAtLeadT = Math.min(Am + 0.1 / curveSizeFactor, 1.0)
      flightCurve.getPointAt(planeLeadT, _planeInitPos)
      flightCurve.getPointAt(lookAtLeadT, _planeLookAtPos)

      if (s.aboutLerp > 0.01) {
        // ABOUT MODAL: Plane banks 90 degrees to side profile on the left
        const sideOffset = new THREE.Vector3(-2.2, 0.2 + Math.sin(time * 1.5) * 0.06, -5.2)
        sideOffset.applyQuaternion(camera.quaternion)
        const targetSidePos = camera.position.clone().add(sideOffset)
        planeGroup.position.lerp(targetSidePos, 0.1)

        const sideEuler = new THREE.Euler(0, Math.PI / 2 + 0.1, -0.05, 'YXZ')
        const sideQuat = new THREE.Quaternion().setFromEuler(sideEuler)
        planeGroup.quaternion.slerp(sideQuat, 0.1)
      } else if (!s.hasEnded) {
        // NORMAL FLIGHT MODE: Exact Atmos smooth flight curve tracking & gentle aerodynamic bob
        const flightX = _planeInitPos.x + 0.1 * (-0.5 + Math.sin(0.5 * time))
        const flightY = _planeInitPos.y + 0.2 * Math.sin(time) + s.introPosition.y
        const flightZ = _planeInitPos.z + s.introPosition.z

        planeGroup.position.set(flightX, flightY, flightZ)
        planeGroup.lookAt(_planeLookAtPos)

        const turnRoll = 0.15 * (_planeLookAtPos.x - planeGroup.position.x)
        planeGroup.rotation.z += turnRoll
      }

      // Camera position with text framing (Atmos signature framing)
      if (s.isExploring && !s.hasEnded) {
        camera.position.set(_camPos.x, _camPos.y, _camPos.z)
        camera.lookAt(_camLookAt.x, _camLookAt.y, _camLookAt.z)

        // Lateral camera offset factor based on aspect ratio (Atmos exact responsive logic)
        const cameraOffsetFactor = THREE.MathUtils.clamp(
          THREE.MathUtils.mapLinear(camera.aspect, 1.6, 0.6, 0, 1),
          0,
          1
        )
        const tOffset = eFactor * (closestTextItem.alignFactor || 1.0) * 2.5 * cameraOffsetFactor
        if (Math.abs(tOffset) > 0.001) {
          _lateralVec.set(1, 0, 0).applyQuaternion(camera.quaternion)
          camera.position.add(_lateralVec.multiplyScalar(tOffset))
          camera.rotation.y += 0.08 * -tOffset
        }
      } else if (!s.isExploring) {
        camera.position.set(0, 0, 8)
        camera.lookAt(0, 0, -20)
      }

      // Sky dome follows camera
      skyMesh.position.copy(camera.position)
      skyMaterial.uniforms.uTime.value = time
      skyMaterial.uniforms.uGradientMixer.value = Am / 0.95

      // -------------------------------------------------------------
      // SPEED LINES / WIND PARTICLES (EXACT ATMOS COCKPIT SLIPSTREAM)
      // Max 0.035 opacity (3.5%), ultra-subtle aerodynamic vapor streaks!
      // -------------------------------------------------------------
      flightCurve.getPointAt(Math.min(Am + 0.01 / curveSizeFactor, 1.0), windMesh.position)
      windMesh.lookAt(_camLookAt)

      for (let i = 0; i < windCount; i++) {
        windMesh.getMatrixAt(i, _dummyMat)
        _dummyPos.setFromMatrixPosition(_dummyMat)
        _dummyPos.z += 0.25 * (1 + (i % 5))
        _dummyPos.z = ((_dummyPos.z + 40) % 80) - 40
        _dummyMat.setPosition(_dummyPos)
        windMesh.setMatrixAt(i, _dummyMat)
      }
      windMesh.instanceMatrix.needsUpdate = true

      // Forward scroll velocity driven (only when scrolling forward)
      const forwardDelta = Math.max(0, s.scrollerDeltaY - s.scrollerCurrentY) * 0.0003
      const targetWindOpacity = (s.isExploring && !s.hasEnded) ? Math.min(forwardDelta, 0.035) : 0
      windMat.opacity = THREE.MathUtils.lerp(windMat.opacity, targetWindOpacity, 0.06)

      // 3D TROIKA TEXTS DISTANCE FADING
      textItems.forEach(({ group, sup, title, body }) => {
        const dist = camera.position.distanceTo(group.position)
        let alpha = THREE.MathUtils.clamp(1 - dist / 30, 0, 1)
        alpha = 2.0 * Math.pow(alpha, 2)
        alpha = Math.min(alpha, 1.0)

        if (sup) sup.material.opacity = alpha
        if (title) title.material.opacity = alpha
        body.material.opacity = alpha
      })

      // Clouds distance-based fading
      cloudsList.forEach(({ mesh, pos }) => {
        const dist = camera.position.distanceTo(pos)
        let alpha = THREE.MathUtils.clamp(1 - dist / 35, 0, 1)
        alpha = 1.8 * Math.pow(alpha, 2)
        ;(mesh.material as THREE.MeshStandardMaterial).opacity = Math.min(alpha, 0.85)
      })

      renderer.render(scene, camera)

      // Notify parent of progress & completion for HUD/scrollbar
      if (Date.now() - lastProgressReportTime > 30) {
        lastProgressReportTime = Date.now()
        onProgressChange(Am, s.completion)
      }

      animId = requestAnimationFrame(render)
    }

    render()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      cancelAnimationFrame(animId)
      renderer.dispose()
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}

export default AtmosCanvas
