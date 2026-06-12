/* ============================================================
   YORIAI — cinematic opening sequence (Three.js)
   particles → torii (Blender-authored GLB) → lanterns → sakura
   → through the gate → glimpses of local life → warm light →
   seamless settle onto the page
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { toriiSVG } from '../lib/torii';
import { createAudio, type IntroAudio } from './audio';
import { glowTex, petalTex, vigTex } from './textures';

const END = 21.6;
const BELL_MARKS = [6, 10.5, 14.5, 17.6];

/* The gate model is authored in Blender (blender/torii_gate.py) and sized so
   it registers exactly with the particle torii assembled from the brand mark. */
const MODEL_URL = `${import.meta.env.BASE_URL}models/torii.glb`;

let started = false;

export function runIntro(): void {
  if (started || !window.WebGLRenderingContext) return;
  started = true;

  // start fetching the gate immediately — it's ready by the time play begins
  const gatePromise: Promise<GLTF | null> = new GLTFLoader()
    .loadAsync(MODEL_URL)
    .catch(() => null);

  // ---------- overlay DOM ----------
  const css = `
    #introOverlay{position:fixed;inset:0;z-index:9999;background:#050403;overflow:hidden}
    #introOverlay canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
    .intro-start{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;z-index:6;background:#050403;transition:opacity 1s var(--ease)}
    .intro-start.gone{opacity:0;pointer-events:none}
    .intro-start .word{font-family:var(--font-word);text-transform:uppercase;letter-spacing:.4em;font-size:22px;color:#F5F0EB;padding-left:.4em;margin-top:26px}
    .intro-start .jpw{font-family:var(--font-jp);color:#D4785A;font-size:17px;margin-top:10px}
    .intro-start .rule{width:30px;height:1px;background:#3A322B;margin:26px 0}
    .intro-btns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
    .intro-btn{font-family:var(--font-sans);font-weight:600;font-size:14.5px;padding:13px 24px;border-radius:100px;cursor:pointer;transition:all .25s var(--ease);white-space:nowrap}
    .intro-btn.snd{background:var(--terra);color:#fff;border:1px solid transparent}
    .intro-btn.snd:hover{background:#D4785A;transform:translateY(-1px)}
    .intro-btn.quiet{background:transparent;color:#B7AFA8;border:1px solid #2E2823}
    .intro-btn.quiet:hover{border-color:#8C857E;color:#F5F0EB}
    .intro-start .hint{font-family:var(--font-mono);font-size:11px;color:#5A534D;margin-top:22px;letter-spacing:.04em}
    .intro-skip{position:absolute;right:22px;bottom:20px;z-index:7;font-family:var(--font-mono);font-size:12px;color:#8C857E;background:rgba(5,4,3,.4);border:1px solid #2A2520;border-radius:100px;padding:8px 18px;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .6s,color .2s,border-color .2s}
    .intro-skip.show{opacity:1;pointer-events:auto}
    .intro-skip:hover{color:#F5F0EB;border-color:#8C857E}
    .intro-cap{position:absolute;left:24px;right:24px;bottom:15vh;text-align:center;font-family:var(--font-serif);font-style:italic;font-size:clamp(22px,3.2vw,36px);color:#EFE8E0;opacity:0;transform:translateY(14px);transition:opacity 1.2s var(--ease),transform 1.2s var(--ease);z-index:5;text-shadow:0 2px 40px rgba(0,0,0,.7);pointer-events:none}
    .intro-cap.show{opacity:1;transform:none}
    .intro-flash{position:absolute;inset:0;opacity:0;pointer-events:none;z-index:8;
      background:radial-gradient(120% 90% at 50% 44%, #FFF3E2 0%, #FBF2E8 38%, #FAF7F4 72%, #FAF7F4 100%)}
    body.intro-lock{overflow:hidden}
    @keyframes pageSettle{from{opacity:.3;filter:blur(11px) brightness(1.09)}60%{filter:blur(2px) brightness(1.02)}to{opacity:1;filter:blur(0) brightness(1)}}
    body.intro-settle > :not(#introOverlay){animation:pageSettle 1.6s var(--ease) both}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const ov = document.createElement('div');
  ov.id = 'introOverlay';
  ov.innerHTML = `
    <div class="intro-start" id="inStart">
      ${toriiSVG(56, '#F5F0EB', '#B85C38')}
      <div class="word">Yoriai</div>
      <div class="jpw">より合い</div>
      <div class="rule"></div>
      <div class="intro-btns">
        <button class="intro-btn snd" id="inSnd">Enter with sound</button>
        <button class="intro-btn quiet" id="inQuiet">Enter quietly</button>
      </div>
      <div class="hint">a 20-second welcome · skippable anytime</div>
    </div>
    <button class="intro-skip" id="inSkip">Skip intro →</button>
    <div class="intro-cap" id="cap1">Cross from tourist to local.</div>
    <div class="intro-cap" id="cap2">Discover Japan through people, not places.</div>
    <div class="intro-flash" id="inFlash"></div>`;
  document.body.appendChild(ov);
  document.body.classList.add('intro-lock');

  // ---------- scene state ----------
  let renderer: THREE.WebGLRenderer | undefined;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let raf: number | null = null;
  let audio: IntroAudio | null = null;
  let doneFlag = false;
  let flashOn = false;
  let bellIdx = 0;

  // particles
  let pts: THREE.Points;
  let posAttr: THREE.BufferAttribute;
  let startA: Float32Array, targetA: Float32Array, delayA: Float32Array, durA: Float32Array;
  let N = 0;

  // gate + props
  const gateMats: Array<THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial> = [];
  let fireMat: THREE.MeshStandardMaterial | null = null;
  let dotMesh: THREE.Mesh, dotGlow: THREE.Sprite;
  let lan1: THREE.Sprite, lan2: THREE.Sprite;
  let pl1: THREE.PointLight, pl2: THREE.PointLight;
  const fogSprites: THREE.Sprite[] = [];
  const vigs: THREE.Mesh[] = [];
  let lightPt: THREE.Sprite;
  let petals: THREE.Points;
  let petalMat: THREE.PointsMaterial;
  let petalData: Array<{ s: number; ph: number; f: number }> = [];

  function adoptGate(gltf: GLTF | null): void {
    if (!gltf) {
      buildFallbackGate();
      return;
    }
    const gate = gltf.scene;
    gate.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        const m = mesh.material as THREE.MeshStandardMaterial;
        m.transparent = true;
        m.opacity = 0;
        if (!gateMats.includes(m)) gateMats.push(m);
        if (m.name === 'LanternFire') fireMat = m;
      }
    });
    scene.add(gate);
  }

  function buildFallbackGate(): void {
    // box approximation, used only if the GLB fails to load
    const group = new THREE.Group();
    const box = (w: number, h: number, d: number, x: number, y: number) => {
      const m = new THREE.MeshStandardMaterial({
        color: 0x7e2a1a, roughness: 0.5, metalness: 0.06, emissive: 0x2a0c06,
        transparent: true, opacity: 0,
      });
      gateMats.push(m);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y, 0);
      group.add(b);
    };
    box(13.45, 1.6, 1.5, 0, 12.0);
    box(1.44, 10.88, 1.44, -4.72, 5.44);
    box(1.44, 10.88, 1.44, 4.72, 5.44);
    box(10.9, 1.12, 1.1, 0, 8.4);
    box(1.6, 1.12, 1.6, -6.56, 11.44);
    box(1.6, 1.12, 1.6, 6.56, 11.44);
    scene.add(group);
  }

  function buildScene(): void {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x050403, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    ov.insertBefore(renderer.domElement, ov.firstChild);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050403, 0.02);
    camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);

    // --- particles assembling the torii (logo geometry, viewBox 60 → world ×.32) ---
    const SEGS = [
      { x0: 13, x1: 17.5, y0: 18, y1: 52, d: 0.7, n: 1700 },
      { x0: 42.5, x1: 47, y0: 18, y1: 52, d: 0.7, n: 1700 },
      { x0: 7, x1: 53, y0: 12, y1: 17, d: 0.85, n: 2300 },
      { x0: 13, x1: 47, y0: 24, y1: 27.5, d: 0.55, n: 900 },
    ];
    const DOTN = 320;
    N = SEGS.reduce((s, x) => s + x.n, 0) + DOTN;
    startA = new Float32Array(N * 3);
    targetA = new Float32Array(N * 3);
    delayA = new Float32Array(N);
    durA = new Float32Array(N);
    const colA = new Float32Array(N * 3);
    const col = new THREE.Color();
    let i = 0;
    const put = (tx: number, ty: number, tz: number, isDot: boolean) => {
      const r = 14 + Math.random() * 16;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      startA[i * 3] = r * Math.sin(ph) * Math.cos(th);
      startA[i * 3 + 1] = 5 + r * Math.cos(ph) * 0.7;
      startA[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      targetA[i * 3] = tx;
      targetA[i * 3 + 1] = ty;
      targetA[i * 3 + 2] = tz;
      if (isDot) {
        delayA[i] = 5.2 + Math.random() * 1.4;
        col.setHSL(0.075, 0.78, 0.58 + Math.random() * 0.12);
      } else {
        delayA[i] = 0.6 + (1 - ty / 13) * 2.2 + Math.random() * 2.0;
        col.setHSL(0.03 + Math.random() * 0.022, 0.68, 0.4 + Math.random() * 0.2);
      }
      durA[i] = 2.6 + Math.random() * 1.6;
      colA[i * 3] = col.r;
      colA[i * 3 + 1] = col.g;
      colA[i * 3 + 2] = col.b;
      i++;
    };
    SEGS.forEach((s) => {
      for (let k = 0; k < s.n; k++) {
        const x = s.x0 + Math.random() * (s.x1 - s.x0);
        const y = s.y0 + Math.random() * (s.y1 - s.y0);
        put((x - 30) * 0.32, (52 - y) * 0.32, (Math.random() - 0.5) * 2 * s.d, false);
      }
    });
    for (let k = 0; k < DOTN; k++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * 3.5;
      put((30 + Math.cos(a) * rr - 30) * 0.32, (52 - (41 + Math.sin(a) * rr)) * 0.32, (Math.random() - 0.5) * 0.7, true);
    }
    const geo = new THREE.BufferGeometry();
    posAttr = new THREE.BufferAttribute(new Float32Array(startA), 3);
    geo.setAttribute('position', posAttr);
    geo.setAttribute('color', new THREE.BufferAttribute(colA, 3));
    pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.17, map: glowTex('230,110,70'), vertexColors: true, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      }),
    );
    scene.add(pts);

    // --- solid gate, modelled in Blender — fades in as lanterns rise ---
    gatePromise.then((gltf) => adoptGate(gltf));

    // human dot — gold sphere + glow
    const dm = new THREE.MeshStandardMaterial({
      color: 0xe8a552, emissive: 0xc97b2e, emissiveIntensity: 1.4, transparent: true, opacity: 0,
    });
    gateMats.push(dm);
    dotMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 20), dm);
    dotMesh.position.set(0, 3.52, 0);
    scene.add(dotMesh);
    dotGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex('232,165,82'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    dotGlow.position.copy(dotMesh.position);
    dotGlow.scale.set(2.6, 2.6, 1);
    scene.add(dotGlow);

    // ground
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x0a0807, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // lights
    scene.add(new THREE.AmbientLight(0xffe8d0, 0.3));
    const moon = new THREE.DirectionalLight(0xcbd4e8, 0.22);
    moon.position.set(-6, 18, 8);
    scene.add(moon);
    pl1 = new THREE.PointLight(0xe8a552, 0, 34, 1.6);
    pl1.position.set(-7.5, 2.0, 0.2);
    scene.add(pl1);
    pl2 = new THREE.PointLight(0xe8a552, 0, 34, 1.6);
    pl2.position.set(7.5, 2.0, 0.2);
    scene.add(pl2);
    const mkLan = (x: number) => {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glowTex('232,165,82'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      s.position.set(x, 1.9, -0.6);
      s.scale.set(3.4, 3.4, 1);
      scene.add(s);
      return s;
    };
    lan1 = mkLan(-7.5);
    lan2 = mkLan(7.5);

    // fog sprites
    const ft = glowTex('210,200,190');
    for (let k = 0; k < 7; k++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: ft, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      s.position.set((Math.random() - 0.5) * 30, Math.random() * 3 + 0.5, (Math.random() - 0.5) * 24 - 2);
      const sc = 14 + Math.random() * 16;
      s.scale.set(sc, sc * 0.5, 1);
      s.userData = { vx: (Math.random() - 0.5) * 0.22, o: 0.028 + Math.random() * 0.03 };
      fogSprites.push(s);
      scene.add(s);
    }

    // sakura petals
    const PN = 240;
    petalData = [];
    const pgeo = new THREE.BufferGeometry();
    const ppos = new Float32Array(PN * 3);
    for (let k = 0; k < PN; k++) {
      ppos[k * 3] = (Math.random() - 0.5) * 34;
      ppos[k * 3 + 1] = Math.random() * 14;
      ppos[k * 3 + 2] = (Math.random() - 0.5) * 44 + 4;
      petalData.push({ s: 0.4 + Math.random() * 0.5, ph: Math.random() * Math.PI * 2, f: 0.5 + Math.random() * 0.7 });
    }
    pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
    petalMat = new THREE.PointsMaterial({
      size: 0.34, map: petalTex(), transparent: true, opacity: 0, depthWrite: false, color: 0xf6cdd8, sizeAttenuation: true,
    });
    petals = new THREE.Points(pgeo, petalMat);
    scene.add(petals);

    // vignettes of local life beyond the gate
    const VIG: Array<[string, string, string, string, number, number, number]> = [
      ['locals cooking together', '食', '#26120B', 'rgba(212,120,90,.22)', -5.6, 4.4, -6],
      ['friends sharing food', '宴', '#1E150E', 'rgba(232,165,82,.20)', 5.4, 4.9, -8.6],
      ['neighborhood streets', '街', '#141915', 'rgba(122,158,114,.18)', -6.3, 4.1, -11.2],
      ['hidden alleyways', '路', '#151823', 'rgba(107,127,192,.18)', 6.0, 5.2, -13.8],
      ['community gatherings', '集', '#1E1B18', 'rgba(216,174,152,.18)', -5.4, 4.6, -16.4],
      ['cultural exchange', '交', '#23110C', 'rgba(212,120,90,.22)', 5.6, 4.3, -19],
    ];
    VIG.forEach((v) => {
      const m = new THREE.MeshBasicMaterial({
        map: vigTex(v[0], v[1], v[2], v[3]), transparent: true, opacity: 0, fog: false, side: THREE.DoubleSide,
      });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.26), m);
      p.position.set(v[4], v[5], v[6]);
      p.userData = { bob: Math.random() * Math.PI * 2 };
      vigs.push(p);
      scene.add(p);
    });

    // the light at the end
    lightPt = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex('255,244,230'), transparent: true, opacity: 0, fog: false, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    lightPt.position.set(0, 4.6, -27);
    lightPt.scale.set(0.5, 0.5, 1);
    scene.add(lightPt);

    window.addEventListener('resize', onResize);
  }

  function onResize(): void {
    if (!renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  const sm = (a: number, b: number, x: number): number => {
    const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };

  function update(t: number): void {
    // particles
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < N; i++) {
      const e = sm(0, 1, (t - delayA[i]) / durA[i]);
      const i3 = i * 3;
      if (e <= 0) {
        arr[i3] = startA[i3];
        arr[i3 + 1] = startA[i3 + 1];
        arr[i3 + 2] = startA[i3 + 2];
        continue;
      }
      let x = startA[i3] + (targetA[i3] - startA[i3]) * e;
      let y = startA[i3 + 1] + (targetA[i3 + 1] - startA[i3 + 1]) * e;
      let z = startA[i3 + 2] + (targetA[i3 + 2] - startA[i3 + 2]) * e;
      if (e >= 1) {
        const w = Math.sin(t * 2.1 + i * 1.7) * 0.018;
        x += w;
        y += Math.cos(t * 1.7 + i) * 0.018;
        z += w;
      }
      arr[i3] = x;
      arr[i3 + 1] = y;
      arr[i3 + 2] = z;
    }
    posAttr.needsUpdate = true;
    (pts.material as THREE.PointsMaterial).opacity = 1 - sm(18.2, 20.2, t) * 0.9;

    // gate solidifies
    const go = sm(7, 10.5, t) * 0.96;
    gateMats.forEach((m) => (m.opacity = go));
    (dotMesh.material as THREE.MeshStandardMaterial).opacity = sm(6.4, 8, t);
    const nearDot = Math.max(0, 1 - Math.max(0, 3.5 - Math.abs(camera.position.z - dotMesh.position.z)) / 3.5);
    dotGlow.material.opacity = sm(6.4, 8.5, t) * 0.8 * nearDot;

    // lanterns
    const li = sm(5, 9.5, t);
    const flick = 1 + Math.sin(t * 7.3) * 0.06 + Math.sin(t * 11.7) * 0.04;
    pl1.intensity = pl2.intensity = li * 42 * flick;
    lan1.material.opacity = lan2.material.opacity = li * 0.5 + Math.sin(t * 2.3) * 0.04 * li;
    if (fireMat) fireMat.emissiveIntensity = 4 * li * flick;

    // fog drift
    fogSprites.forEach((s) => {
      s.position.x += (s.userData.vx as number) * 0.016;
      if (s.position.x > 20) s.position.x = -20;
      if (s.position.x < -20) s.position.x = 20;
      s.material.opacity = (s.userData.o as number) * sm(1, 4, t);
    });

    // petals
    petalMat.opacity = sm(6, 9, t) * 0.85 * (1 - sm(19, 20.5, t));
    const pp = petals.geometry.attributes.position.array as Float32Array;
    for (let k = 0; k < petalData.length; k++) {
      const pd = petalData[k];
      pp[k * 3 + 1] -= pd.s * 0.016;
      pp[k * 3] += Math.sin(t * pd.f + pd.ph) * 0.012;
      if (pp[k * 3 + 1] < 0) pp[k * 3 + 1] = 14;
    }
    petals.geometry.attributes.position.needsUpdate = true;

    // camera
    const drift = 1 - sm(15.5, 18.5, t);
    const z = 34 - sm(0, 8, t) * 3 - sm(8, 19.5, t) * 46; // 34 → 31 → -15
    camera.position.set(Math.sin(t * 0.21) * 0.55 * drift, 4.6 + Math.sin(t * 0.13) * 0.22 * drift, z);
    camera.lookAt(0, 5.0, z - 12);

    // vignettes
    const vGlobal = sm(9.5, 11.5, t) * (1 - sm(19, 20, t));
    vigs.forEach((v) => {
      const d = camera.position.z - v.position.z;
      const o = sm(4, 14, d) * (1 - sm(-1.5, 2.2, -d)) * vGlobal; // fade in approaching, out when passed
      (v.material as THREE.MeshBasicMaterial).opacity = o * 0.92;
      v.position.y += Math.sin(t * 0.7 + (v.userData.bob as number)) * 0.0012;
      v.lookAt(camera.position.x, v.position.y, camera.position.z);
    });

    // the light ahead
    const lo = sm(14.5, 19.2, t);
    lightPt.material.opacity = lo;
    const ls = 0.5 + lo * lo * 46;
    lightPt.scale.set(ls, ls, 1);

    // captions
    cap1El.classList.toggle('show', t > 9.6 && t < 13.2);
    cap2El.classList.toggle('show', t > 13.8 && t < 17.2);

    // bells
    if (audio && bellIdx < BELL_MARKS.length && t >= BELL_MARKS[bellIdx]) {
      audio.bell();
      bellIdx++;
    }

    // the bloom dissolves continuously into the page's washi background —
    // no hard flash; the light simply becomes the paper the site sits on
    if (!flashOn) flashEl.style.opacity = String(sm(19.0, 20.5, t));
    if (t >= 20.45 && !doneFlag) finishReveal();
  }

  // ---------- run loop (dt-accumulated: pauses when tab hidden) ----------
  let tAcc = 0;
  let lastNow = 0;
  function loop(now: number): void {
    if (!lastNow) lastNow = now;
    const dt = Math.min((now - lastNow) / 1000, 0.06);
    lastNow = now;
    tAcc += dt;
    update(tAcc);
    renderer!.render(scene, camera);
    if (!doneFlag || tAcc < END + 1) raf = requestAnimationFrame(loop);
  }

  // ---------- finish / skip ----------
  function finishReveal(): void {
    if (doneFlag) return;
    doneFlag = true;
    flashOn = true;
    sessionStorage.setItem('yoriai_intro_done', '1');
    if (audio) audio.end();
    document.body.classList.remove('intro-lock');
    document.body.classList.add('intro-settle');
    flashEl.style.opacity = '1';
    ov.style.transition = 'opacity 1.4s ease';
    requestAnimationFrame(() => {
      ov.style.opacity = '0';
    });
    window.dispatchEvent(new CustomEvent('yoriai:intro-done'));
    setTimeout(() => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      try {
        renderer?.dispose();
      } catch {
        /* context already lost */
      }
      ov.remove();
      setTimeout(() => document.body.classList.remove('intro-settle'), 1800);
    }, 1450);
  }

  function skip(): void {
    if (doneFlag) return;
    flashOn = true;
    flashEl.style.transition = 'opacity .45s ease';
    flashEl.style.opacity = '1';
    setTimeout(finishReveal, 460);
  }

  // ---------- start ----------
  const startEl = document.getElementById('inStart')!;
  const skipEl = document.getElementById('inSkip')!;
  const flashEl = document.getElementById('inFlash')!;
  const cap1El = document.getElementById('cap1')!;
  const cap2El = document.getElementById('cap2')!;

  function begin(withSound: boolean): void {
    try {
      buildScene();
    } catch {
      ov.remove();
      document.body.classList.remove('intro-lock');
      return;
    }
    if (withSound) {
      try {
        audio = createAudio();
      } catch {
        audio = null;
      }
    }
    startEl.classList.add('gone');
    setTimeout(() => skipEl.classList.add('show'), 2000);
    raf = requestAnimationFrame(loop);
  }
  document.getElementById('inSnd')!.addEventListener('click', () => begin(true));
  document.getElementById('inQuiet')!.addEventListener('click', () => begin(false));
  skipEl.addEventListener('click', skip);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') skip();
  });

  // debug/seek hooks
  (window as unknown as Record<string, unknown>).__introSeek = (t: number) => {
    tAcc = t;
  };
  (window as unknown as Record<string, unknown>).__introRender = (t: number) => {
    if (!renderer) return 'no renderer';
    update(t);
    renderer.render(scene, camera);
    return 'rendered ' + t;
  };
}
