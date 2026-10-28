import * as THREE from "three";
import { Text } from "troika-three-text";
import { ATMOS_FACTS } from "../data/facts";

export interface TextItem {
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

export interface SkyTextsManager {
  textItems: TextItem[];
  welcomeGroup: THREE.Group;
  updateSkyTexts: (cameraPosition: THREE.Vector3, isExploring: boolean) => void;
}

/**
 * Creates and manages the floating 3D aviation facts in the sky (Troika text).
 */
export const createSkyTexts = (
  scene: THREE.Scene,
  flightCurve: THREE.CatmullRomCurve3,
  curveSizeFactor = 2.5,
): SkyTextsManager => {
  const textItems: TextItem[] = [];

  // 1. Welcome announcement at progress = 0.1 (exact Atmos om[0])
  const welcomeGroup = new THREE.Group();
  const welcomeBody = new Text();
  welcomeBody.text =
    "Hello passengers and welcome aboard. Please sit back, relax, and enjoy the view while we tell you some of our favourite facts about the aviation world.";
  welcomeBody.font = "/fonts/font2.ttf";
  welcomeBody.fontSize = 0.3;
  welcomeBody.maxWidth = 3.2;
  welcomeBody.lineHeight = 1.35;
  welcomeBody.position.y = -1.2;
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
    sup.fontSize = 0.18;
    sup.position.y = 0.25;
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
    title.fontSize = 0.5;
    title.position.y = -0.055;
    title.color = 0xffffff;
    title.outlineWidth = 0;
    title.strokeWidth = 0;
    title.maxWidth = fact.titleMaxWidth || 2.5;
    title.lineHeight = 1.05;
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
    body.fontSize = fact.bodyMaxWidth ? 0.18 : fact.bodyFontSize || 0.18;
    body.position.y = -1.2;
    body.maxWidth = fact.bodyMaxWidth || 3.0;
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

  const updateSkyTexts = (cameraPosition: THREE.Vector3, isExploring: boolean) => {
    textItems.forEach(({ group, sup, title, body }) => {
      if (!isExploring) {
        group.visible = false;
        return;
      }
      const dist = cameraPosition.distanceTo(group.position);
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
  };

  return {
    textItems,
    welcomeGroup,
    updateSkyTexts,
  };
};
