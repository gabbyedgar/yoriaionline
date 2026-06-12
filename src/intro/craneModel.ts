/* Shared origami-crane rig (Blender-authored GLB, see blender/origami_crane.py).
   Used by both the cinematic intro and the persistent hero perch. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = `${import.meta.env.BASE_URL}models/crane.glb`;

export interface CraneRig {
  root: THREE.Group;
  wingL: THREE.Object3D;
  wingR: THREE.Object3D;
  meshes: THREE.Mesh[];
  material: THREE.MeshStandardMaterial;
}

let scenePromise: Promise<THREE.Group | null> | null = null;

function loadScene(): Promise<THREE.Group | null> {
  scenePromise ??= new GLTFLoader()
    .loadAsync(MODEL_URL)
    .then((g) => g.scene)
    .catch(() => null);
  return scenePromise;
}

/** Independent instance: cloned hierarchy, cloned geometries (the intro mutates
    vertices during the fold-in), one shared paper material per rig. */
export async function createCraneRig(): Promise<CraneRig | null> {
  const src = await loadScene();
  if (!src) return null;
  const root = src.clone(true);
  const material = new THREE.MeshStandardMaterial({
    color: 0xf6f2ea,
    roughness: 0.55,
    metalness: 0.0,
    side: THREE.DoubleSide,
    flatShading: true,
    transparent: true,
  });
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      const m = o as THREE.Mesh;
      m.geometry = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      m.material = material;
      meshes.push(m);
    }
  });
  const wingL = root.getObjectByName('WingL');
  const wingR = root.getObjectByName('WingR');
  if (!wingL || !wingR) return null;
  return { root, wingL, wingR, meshes, material };
}

/** Wing flap/fold. angle 0 = spread flat; positive = folded/raised. */
export function setWings(rig: CraneRig, angle: number): void {
  rig.wingL.rotation.z = -angle;
  rig.wingR.rotation.z = angle;
}

/* ---------------- origami birth: facets fold in from scattered fragments --- */

interface TriState {
  offset: THREE.Vector3;
  axis: THREE.Vector3;
  angle: number;
  delay: number; // 0..1 within the assembly window
  dur: number;
}

export interface Assembly {
  /** e: global progress 0..1. Returns true once fully assembled. */
  update(e: number): boolean;
}

export function makeAssembly(rig: CraneRig, scatter = 4.5): Assembly {
  const parts = rig.meshes.map((mesh) => {
    const pos = mesh.geometry.attributes.position;
    const orig = new Float32Array(pos.array as Float32Array);
    const tris: TriState[] = [];
    for (let t = 0; t < pos.count / 3; t++) {
      tris.push({
        offset: new THREE.Vector3()
          .randomDirection()
          .multiplyScalar(scatter * (0.45 + Math.random() * 0.55)),
        axis: new THREE.Vector3().randomDirection(),
        angle: Math.PI * (1 + Math.random()),
        delay: Math.random() * 0.5,
        dur: 0.4 + Math.random() * 0.25,
      });
    }
    return { mesh, orig, tris };
  });

  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const c = new THREE.Vector3();
  let settled = false;

  return {
    update(e: number): boolean {
      if (settled) return true;
      if (e >= 1) {
        // snap to the authored geometry once and stop touching vertices
        parts.forEach(({ mesh, orig }) => {
          (mesh.geometry.attributes.position.array as Float32Array).set(orig);
          mesh.geometry.attributes.position.needsUpdate = true;
        });
        settled = true;
        return true;
      }
      parts.forEach(({ mesh, orig, tris }) => {
        const arr = mesh.geometry.attributes.position.array as Float32Array;
        tris.forEach((tri, t) => {
          let u = (e - tri.delay) / tri.dur;
          u = Math.min(1, Math.max(0, u));
          const ease = u * u * (3 - 2 * u);
          const i9 = t * 9;
          c.set(
            (orig[i9] + orig[i9 + 3] + orig[i9 + 6]) / 3,
            (orig[i9 + 1] + orig[i9 + 4] + orig[i9 + 7]) / 3,
            (orig[i9 + 2] + orig[i9 + 5] + orig[i9 + 8]) / 3,
          );
          q.setFromAxisAngle(tri.axis, tri.angle * (1 - ease));
          const drift = (1 - ease) * (1 - ease);
          for (let k = 0; k < 3; k++) {
            v.set(orig[i9 + k * 3], orig[i9 + k * 3 + 1], orig[i9 + k * 3 + 2])
              .sub(c)
              .applyQuaternion(q)
              .add(c)
              .addScaledVector(tri.offset, drift);
            arr[i9 + k * 3] = v.x;
            arr[i9 + k * 3 + 1] = v.y;
            arr[i9 + k * 3 + 2] = v.z;
          }
        });
        mesh.geometry.attributes.position.needsUpdate = true;
      });
      return false;
    },
  };
}
