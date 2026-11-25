import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/*
  A medium-voltage power cable, built layer by layer, laid out as a "stepped cutaway"
  (every inner layer sticks out a little further than the one wrapping it).
  setProgress(0..1) strips the layers one after another, driven by the page scroll.
*/

const LAYERS = [
  // key, radius (outer), thickness, material
  { key: 'core', r: 0.36 },
  { key: 'semicon', r: 0.40, color: 0x141416, rough: 0.55, metal: 0.0 },
  { key: 'xlpe', r: 0.62, color: 0xe9e4d8, rough: 0.32, metal: 0.0, clear: 0.6 },
  { key: 'semicon2', r: 0.66, color: 0x18181a, rough: 0.6, metal: 0.0 },
  { key: 'screen', r: 0.70, color: 0xc8773e, rough: 0.28, metal: 1.0 },
  { key: 'bedding', r: 0.76, color: 0x2a2b2f, rough: 0.8, metal: 0.0 },
  { key: 'armour', r: 0.86 },
  { key: 'sheath', r: 0.98, color: 0x8c0a12, rough: 0.5, metal: 0.0, clear: 0.45 },
];

// which layers disappear at each of the 5 story stages (outer → inner)
export const STAGE_STRIP = [['sheath'], ['armour', 'bedding'], ['screen', 'semicon2'], ['xlpe', 'semicon'], []];

const LENGTH = 9;      // total cable length
const STEP = 0.75;     // how much each inner layer sticks out in the cutaway

function helix(radius, turns, length, phase) {
  const pts = [];
  const n = 160;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = phase + t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(t * length, Math.cos(a) * radius, Math.sin(a) * radius));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function tubeLayer(r, inner, length, material) {
  // a hollow cylinder along +X starting at x=0 with flat annular end caps
  const shape = new THREE.Shape();
  shape.absarc(0, 0, r, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 72 });
  geo.rotateY(Math.PI / 2);
  return new THREE.Mesh(geo, material);
}

export function createCableScene(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // lights: warm key, red rim, cool fill
  const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
  key.position.set(4, 6, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff2a36, 3.2);
  rim.position.set(-6, 2, -5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x8fb4ff, 0.6);
  fill.position.set(-3, -4, 5);
  scene.add(fill);

  const cable = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.add(cable);
  scene.add(pivot);

  const copper = new THREE.MeshPhysicalMaterial({ color: 0xd98a4e, metalness: 1, roughness: 0.22, clearcoat: 0.4 });
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xb9bcc2, metalness: 1, roughness: 0.3 });

  const layerObjs = {};
  const count = LAYERS.length;

  LAYERS.forEach((layer, i) => {
    // inner layers stick out further to the right
    const exposed = (count - 1 - i) * STEP;
    const len = LENGTH - (LAYERS.length - 1) * STEP + exposed;
    const obj = new THREE.Group();

    if (layer.key === 'core') {
      // 1 + 6 + 12 stranded copper conductor
      const sr = 0.072;
      const centre = new THREE.Mesh(new THREE.CylinderGeometry(sr, sr, len, 24).rotateZ(Math.PI / 2).translate(len / 2, 0, 0), copper);
      obj.add(centre);
      [[6, sr * 2, 1.6], [12, sr * 4, -1.1]].forEach(([n, rad, turns]) => {
        for (let k = 0; k < n; k++) {
          const curve = helix(rad, turns * (len / LENGTH) * 3, len, (k / n) * Math.PI * 2);
          obj.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 220, sr, 10, false), copper));
        }
      });
    } else if (layer.key === 'armour') {
      const n = 46;
      const wr = 0.042;
      for (let k = 0; k < n; k++) {
        const curve = helix(layer.r - wr, 1.1 * (len / LENGTH) * 3, len, (k / n) * Math.PI * 2);
        obj.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 200, wr, 8, false), steel));
      }
    } else {
      const prev = LAYERS[i - 1];
      const mat = new THREE.MeshPhysicalMaterial({
        color: layer.color,
        roughness: layer.rough,
        metalness: layer.metal,
        clearcoat: layer.clear || 0,
        clearcoatRoughness: 0.25,
      });
      obj.add(tubeLayer(layer.r, prev ? prev.r - 0.004 : 0, len, mat));
    }
    obj.userData = { len, key: layer.key };
    layerObjs[layer.key] = obj;
    cable.add(obj);
  });

  // centre the cable on its own length
  cable.position.x = -LENGTH / 2;

  // stage state: per layer visibility 0..1 (1 = present)
  const presence = Object.fromEntries(LAYERS.map((l) => [l.key, 1]));
  let progress = 0;
  let intro = 1;
  let fixedView = null;
  let introS = 1;
  let pointer = { x: 0, y: 0 };
  let smooth = { x: 0, y: 0 };
  let width = 1;
  let height = 1;
  let raf = 0;
  let running = true;
  const clock = new THREE.Clock();

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function applyPresence() {
    Object.entries(layerObjs).forEach(([k, obj]) => {
      const v = presence[k];
      // stripped layers slide back to the left and shrink out of view
      obj.scale.x = Math.max(0.0001, 0.15 + 0.85 * v);
      obj.visible = v > 0.01;
      obj.position.x = 0;
    });
  }

  function setProgress(p) {
    progress = Math.min(1, Math.max(0, p));
    // 5 stages, stage s spans [s/5,(s+1)/5]; layers of stage s are stripped across that window
    STAGE_STRIP.forEach((keys, s) => {
      const local = Math.min(1, Math.max(0, (progress * 5 - s - 0.35) / 0.55));
      keys.forEach((k) => {
        presence[k] = 1 - local;
      });
    });
    applyPresence();
  }

  function onPointer(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }

  function render() {
    const t = clock.getElapsedTime();
    smooth.x += (pointer.x - smooth.x) * 0.05;
    smooth.y += (pointer.y - smooth.y) * 0.05;

    const mobile = width < 760;
    introS += (intro - introS) * 0.08;
    // camera dolly: start wide and cinematic, push in toward the stepped end as we strip
    const p = progress;
    if (fixedView) {
      camera.position.set(...fixedView.pos);
      camera.lookAt(...fixedView.look);
      pivot.rotation.set(0, fixedView.orbit ? Math.sin(t * 0.25) * fixedView.orbit : 0, fixedView.tilt || 0);
      cable.rotation.x = fixedView.spin ?? t * 0.18;
      pivot.position.y = 0;
      renderer.render(scene, camera);
      if (running) raf = requestAnimationFrame(render);
      return;
    }
    const dist = (mobile ? 17 : 13.5) - p * (mobile ? 4 : 4.2) + introS * (mobile ? 3 : 1.5);
    camera.position.set(Math.sin(-0.55 + p * 0.5) * dist, 2.2 - p * 1.1 + smooth.y * -0.6, Math.cos(-0.55 + p * 0.5) * dist);
    camera.lookAt(p * 1.6 - introS * (mobile ? 0 : 6.2), (mobile ? -0.6 : 0) + introS * (mobile ? 1.6 : 0.6), 0);

    pivot.rotation.z = -0.22 + smooth.y * 0.04;
    pivot.rotation.y = 0.35 - p * 0.6 + smooth.x * 0.12;
    cable.rotation.x = reducedMotion ? 0 : t * 0.18;
    pivot.position.y = Math.sin(t * 0.8) * 0.05;

    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(render);
  }

  resize();
  setProgress(0);
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  raf = requestAnimationFrame(render);

  const visibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      raf = requestAnimationFrame(render);
    }
  };
  document.addEventListener('visibilitychange', visibility);

  return {
    setProgress,
    setView(v) { fixedView = v; },
    setIntro(v) { intro = Math.min(1, Math.max(0, v)); },
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (!running) { running = true; raf = requestAnimationFrame(render); } },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', visibility);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose?.();
      });
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
