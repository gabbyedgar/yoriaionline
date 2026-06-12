/* The crane that lives on the homepage hero — a small always-on renderer
   with subtle idle motion, so the interface feels alive after the intro.
   Mounted either when the intro's crane lands (continuity) or directly with
   a short fly-in on visits that skip the cinematic. */
import * as THREE from 'three';
import { createCraneRig, setWings, type CraneRig } from './craneModel';

export type CraneEntry = 'fly' | 'perch';

const PERCH_FOLD = 0.95; // resting wing fold (rad)

export async function mountHeroCrane(container: HTMLElement, entry: CraneEntry): Promise<void> {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return; // no WebGL — the hero simply stays quiet
  }
  const loaded = await createCraneRig();
  if (!loaded) {
    renderer.dispose();
    return;
  }
  const rig: CraneRig = loaded; // explicit type so the narrowing survives into closures

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .7s ease';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(0.25, 1.05, 4.4);
  camera.lookAt(0, 0.5, 0);

  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x9a8d80, 1.15));
  const key = new THREE.DirectionalLight(0xffefdc, 1.7);
  key.position.set(2.5, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc9d4ee, 0.55);
  rim.position.set(-3, 2, -2.5);
  scene.add(rim);

  const crane = rig.root;
  crane.scale.setScalar(1.12);
  scene.add(crane);

  const PERCH_POS = new THREE.Vector3(0, 0.42, 0);
  const PERCH_YAW = -0.55; // angled toward the hero copy

  function size(): void {
    const r = container.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  size();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(size).observe(container);

  // static pose for reduced motion: render one frame, no loop
  if (reduced) {
    crane.position.copy(PERCH_POS);
    crane.rotation.y = PERCH_YAW;
    setWings(rig, PERCH_FOLD);
    renderer.render(scene, camera);
    renderer.domElement.style.opacity = '1';
    return;
  }

  let visible = true;
  if (typeof IntersectionObserver !== 'undefined') {
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(container);
  }

  const FLY_DUR = 2.6;
  const sm = (a: number, b: number, x: number): number => {
    const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };

  let t = 0;
  let last = 0;
  function frame(now: number): void {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) {
      last = now;
      return;
    }
    if (!last) last = now;
    t += Math.min((now - last) / 1000, 0.05);
    last = now;

    if (entry === 'fly' && t < FLY_DUR + 0.9) {
      // one graceful arc in from the upper left, then fold and settle
      const e = sm(0, FLY_DUR, t);
      crane.position.set(
        -3.6 + 3.6 * e,
        2.3 - 1.88 * e + Math.sin(e * Math.PI) * 0.5,
        1.4 - 1.4 * e,
      );
      crane.position.y += (1 - e) * Math.sin(t * 9) * 0.05;
      crane.rotation.y = -1.5 + (1.5 + PERCH_YAW) * e;
      crane.rotation.z = Math.sin(e * Math.PI) * -0.22;
      crane.rotation.x = -0.18 * (1 - e);
      const flap = Math.sin(t * 9) * 0.5 * (1 - e * 0.8);
      setWings(rig, flap + PERCH_FOLD * sm(FLY_DUR - 0.5, FLY_DUR + 0.8, t));
    } else {
      // idle: breathing bob, micro wing settle, slow attentive head turns
      crane.position.set(0, PERCH_POS.y + Math.sin(t * 1.15) * 0.035, 0);
      crane.rotation.y = PERCH_YAW + Math.sin(t * 0.23) * 0.1 + Math.sin(t * 0.071) * 0.06;
      crane.rotation.x = Math.sin(t * 0.9) * 0.018;
      crane.rotation.z = Math.sin(t * 0.47) * 0.022;
      setWings(rig, PERCH_FOLD + Math.sin(t * 1.15 + 0.7) * 0.045);
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  requestAnimationFrame(() => (renderer.domElement.style.opacity = '1'));
}
