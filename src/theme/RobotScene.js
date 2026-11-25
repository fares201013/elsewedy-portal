import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/*
  "Volt" — the procurement assistant robot.
  An orange TV-head robot that floats, blinks, follows the pointer,
  and bounces its eyes while it is "talking".
*/
export function createRobot(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xfff1e2, 2.2);
  key.position.set(3, 5, 6);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.6, 9.5);
  camera.lookAt(0, 0.2, 0);

  const orange = new THREE.MeshPhysicalMaterial({ color: 0xf08a3c, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const orangeDark = new THREE.MeshPhysicalMaterial({ color: 0xc0601f, roughness: 0.45 });
  const screen = new THREE.MeshPhysicalMaterial({ color: 0x121214, roughness: 0.15, metalness: 0.2, clearcoat: 1 });
  const eyeM = new THREE.MeshBasicMaterial({ color: 0xfff3dc });
  const bulbM = new THREE.MeshBasicMaterial({ color: 0xfff1c8 });

  const robot = new THREE.Group();
  scene.add(robot);

  // head
  const head = new THREE.Group();
  head.position.y = 0.9;
  robot.add(head);
  head.add(new THREE.Mesh(new RoundedBoxGeometry(2.6, 2.1, 1.9, 6, 0.35), orange));
  const face = new THREE.Mesh(new RoundedBoxGeometry(2.1, 1.55, 0.2, 5, 0.22), screen);
  face.position.z = 0.88;
  head.add(face);
  const eyes = [-0.42, 0.42].map((x) => {
    const e = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.42, 0.05, 3, 0.06), eyeM);
    e.position.set(x, 0.05, 1.0);
    head.add(e);
    return e;
  });
  // eye glow
  const glow = new THREE.PointLight(0xffd9a0, 2.5, 4);
  glow.position.set(0, 0, 1.6);
  head.add(glow);
  // ears
  [-1.36, 1.36].forEach((x) => {
    const ear = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.7, 0.7, 3, 0.08), orangeDark);
    ear.position.set(x, 0, 0);
    head.add(ear);
  });
  // antenna
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12), new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.6, roughness: 0.4 }));
  stalk.position.y = 1.35;
  head.add(stalk);
  const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), bulbM);
  bulb.position.y = 1.72;
  head.add(bulb);
  const bulbLight = new THREE.PointLight(0xffe0a0, 2, 3);
  bulbLight.position.y = 1.75;
  head.add(bulbLight);

  // body + legs
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.0, 1.1, 4, 0.22), orangeDark);
  body.position.y = -0.85;
  robot.add(body);
  const legs = [-0.4, 0.4].map((x) => {
    const leg = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.6, 0.5, 3, 0.1), orange);
    leg.position.set(x, -1.6, 0.05);
    robot.add(leg);
    return leg;
  });

  // floor shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 48),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.05;
  scene.add(shadow);

  let pointer = { x: 0, y: 0 };
  let look = { x: 0, y: 0 };
  let talking = false;
  let nextBlink = 2;
  let raf = 0;
  let running = true;
  const clock = new THREE.Clock();

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    camera.aspect = Math.max(1, r.width) / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  }
  function onPointer(e) {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 2;
    pointer.y = ((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 2;
  }

  function frame() {
    const t = clock.getElapsedTime();
    look.x += (pointer.x - look.x) * 0.08;
    look.y += (pointer.y - look.y) * 0.08;
    robot.position.y = Math.sin(t * 1.6) * 0.12;
    shadow.scale.setScalar(1 - Math.sin(t * 1.6) * 0.06);
    head.rotation.y = THREE.MathUtils.clamp(look.x * 0.55, -0.6, 0.6);
    head.rotation.x = THREE.MathUtils.clamp(look.y * 0.35, -0.35, 0.35);
    head.rotation.z = Math.sin(t * 0.9) * 0.04;
    body.rotation.y = head.rotation.y * 0.3;
    legs[0].position.y = -1.6 + Math.max(0, Math.sin(t * 3.2)) * (talking ? 0.12 : 0.04);
    legs[1].position.y = -1.6 + Math.max(0, -Math.sin(t * 3.2)) * (talking ? 0.12 : 0.04);

    // blink
    let sy = 1;
    if (t > nextBlink) {
      const k = (t - nextBlink) / 0.16;
      sy = k < 1 ? Math.abs(1 - 2 * k) : 1;
      if (k >= 1) nextBlink = t + 2.2 + Math.random() * 2.5;
    }
    if (talking) sy *= 0.75 + Math.abs(Math.sin(t * 12)) * 0.45;
    eyes.forEach((e) => {
      e.scale.y = Math.max(0.08, sy);
    });
    const pulse = 0.6 + (Math.sin(t * (talking ? 9 : 2.5)) + 1) * 0.5;
    bulbLight.intensity = 1.2 + pulse * 1.5;
    bulb.scale.setScalar(0.9 + pulse * 0.12);

    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  raf = requestAnimationFrame(frame);

  return {
    setTalking(v) { talking = v; },
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (!running) { running = true; raf = requestAnimationFrame(frame); } },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
