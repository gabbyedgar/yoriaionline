/* ============================================================
   YORIAI — cinematic opening (Three.js)

   1  approach: red torii in mist, lanterns, drifting sakura
   2  portal: through the gate, dreamlike glimpses of local life
   3  origami birth: fragments + petals fold into a paper crane
   4  the camera follows the crane
   5  the world transforms: lanterns → interface lights,
      streets → UI grid, architecture → glass panels
   6  the homepage constructs itself behind the dissolving scene
   7  the crane circles once and lands on the hero
   8  camera settles front-facing; the crane stays, alive

   No hard cuts — every transition is carried by the crane.
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { toriiSVG } from '../lib/torii';
import { clearIntroBoot, signalIntroDone, signalCraneLand } from '../lib/introGate';
import { createCraneRig, makeAssembly, setWings, type CraneRig, type Assembly } from './craneModel';
import { createAudio, type IntroAudio } from './audio';
import { glowTex, petalTex, vigTex, paperTex, panelTex } from './textures';

const GATE_URL = `${import.meta.env.BASE_URL}models/torii.glb`;

/* ---- timeline (seconds) ---- */
const T = {
  cap1: [3.4, 8.4],
  cap2: [10.2, 14.2],
  gather: [13.6, 15.8], // fragments + petals converge
  fold: [14.4, 17.2], // crane facets fold into place
  flightEnd: 21.6,
  transform: [18.0, 22.6], // world → interface
  alphaOut: [21.2, 23.4], // scene background dissolves, DOM shows through
  navIn: 21.4,
  heroIn: 22.2,
  circle: [21.6, 23.8],
  land: [23.8, 25.2],
  craneLand: 25.0,
  done: 25.55,
} as const;
const BELLS = [3.5, 9.6, 14.9, 21.3, 24.7];
const BIRTH = new THREE.Vector3(0, 4.7, -21);
const REST_POS = new THREE.Vector3(0, 4.8, -27);
const LAND_DEPTH = 8;
const DARK = new THREE.Color(0x050403);
const WASHI = new THREE.Color(0xfaf7f4);
const PERCH_FOLD = 0.95;
const PERCH_YAW = -0.55;

const sm = (a: number, b: number, x: number): number => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

let started = false;

export function runIntro(): void {
  if (started) return;
  started = true;
  if (!window.WebGLRenderingContext) {
    document.body.classList.remove('intro-lock');
    signalCraneLand();
    signalIntroDone(); // also lifts the boot cover
    return;
  }

  // start fetching the models immediately — ready by the time play begins
  const gatePromise: Promise<GLTF | null> = new GLTFLoader().loadAsync(GATE_URL).catch(() => null);
  const cranePromise = createCraneRig();

  // ---------- overlay DOM ----------
  const css = `
    #introOverlay{position:fixed;inset:0;z-index:9999;background:#050403;overflow:hidden}
    #introOverlay.lift{background:transparent}
    #introOverlay canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
    .intro-start{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:6;background:#050403;transition:opacity 1s var(--ease)}
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
      background:radial-gradient(120% 90% at 50% 44%, #FFF3E2 0%, #FAF7F4 60%, #FAF7F4 100%)}
    body.intro-lock{overflow:hidden}
    body.intro-stage .nav{opacity:0;transform:translateY(-16px)}
    body.intro-stage .nav.in{opacity:1;transform:none;transition:opacity 1s var(--ease),transform 1s var(--ease)}
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
      <div class="hint">a 25-second welcome · skippable anytime</div>
    </div>
    <button class="intro-skip" id="inSkip">Skip intro →</button>
    <div class="intro-cap" id="cap1">Pass through the gateway.</div>
    <div class="intro-cap" id="cap2">Meet the people behind Japan.</div>
    <div class="intro-flash" id="inFlash"></div>`;
  document.body.appendChild(ov);
  document.body.classList.add('intro-lock', 'intro-stage');
  // the overlay now owns the screen — retire the pre-paint cover beneath it
  clearIntroBoot();

  // ---------- scene state ----------
  let renderer: THREE.WebGLRenderer | undefined;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let fog: THREE.FogExp2;
  let raf: number | null = null;
  let audio: IntroAudio | null = null;
  let doneFlag = false;
  let bellIdx = 0;
  let navDone = false;
  let heroDone = false;

  const gateMats: THREE.MeshStandardMaterial[] = [];
  let fireMat: THREE.MeshStandardMaterial | null = null;
  let lan1: THREE.Sprite, lan2: THREE.Sprite;
  let pl1: THREE.PointLight, pl2: THREE.PointLight;
  let ambient: THREE.AmbientLight, moon: THREE.DirectionalLight;
  let groundMat: THREE.MeshStandardMaterial;
  const fogSprites: THREE.Sprite[] = [];
  const vigs: THREE.Mesh[] = [];

  let petals: THREE.Points, petalMat: THREE.PointsMaterial;
  let petalData: Array<{ s: number; ph: number; f: number }> = [];
  let dust: THREE.Points, dustMat: THREE.PointsMaterial;

  let frags: THREE.Points, fragMat: THREE.PointsMaterial;
  let fragHome: Float32Array, fragTarget: Float32Array, fragDelay: Float32Array;
  const FRAGN = 300;

  let rig: CraneRig | null = null;
  let assembly: Assembly | null = null;
  let craneGlow: THREE.Sprite, craneLight: THREE.PointLight;
  const craneVel = new THREE.Vector3(0, 0, -1);
  const cranePrev = new THREE.Vector3();
  const landPos = new THREE.Vector3();
  let landScale = 1.6;

  let latSpread = 1; // lateral compression for portrait framing
  let grid: THREE.LineSegments, gridMat: THREE.LineBasicMaterial;
  const panels: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; delay: number; y0: number }> = [];
  const iLights: Array<{ s: THREE.Sprite; delay: number }> = [];

  function adoptGate(gltf: GLTF | null): void {
    if (!gltf) return; // mist and lanterns carry the scene if the gate fails
    gltf.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
        m.transparent = true;
        if (!gateMats.includes(m)) gateMats.push(m);
        if (m.name === 'LanternFire') fireMat = m;
      }
    });
    scene.add(gltf.scene);
  }

  function adoptCrane(r: CraneRig | null): void {
    if (!r) return;
    rig = r;
    rig.material.opacity = 0;
    rig.material.emissive = new THREE.Color(0xfff0dc);
    rig.material.emissiveIntensity = 0;
    rig.root.position.copy(BIRTH);
    rig.root.scale.setScalar(1.2);
    cranePrev.copy(BIRTH);
    assembly = makeAssembly(rig);
    scene.add(rig.root);
  }

  function buildScene(): void {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(DARK, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0;
    ov.insertBefore(renderer.domElement, ov.firstChild);

    scene = new THREE.Scene();
    fog = new THREE.FogExp2(DARK.clone(), 0.02);
    scene.fog = fog;
    camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
    applyFov();
    // narrow portrait screens see a thin slice of the world — pull the side
    // dressing (vignettes, panels, light rows) inward so it stays in frame
    latSpread = Math.min(1, Math.max(0.55, innerWidth / innerHeight / 1.5));

    gatePromise.then(adoptGate);
    cranePromise.then(adoptCrane);

    // ground
    groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0807, roughness: 1, transparent: true });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(70, 48), groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // lights
    ambient = new THREE.AmbientLight(0xffe8d0, 0.3);
    scene.add(ambient);
    moon = new THREE.DirectionalLight(0xcbd4e8, 0.22);
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

    // volumetric-feeling mist
    const ft = glowTex('210,200,190');
    for (let k = 0; k < 8; k++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: ft, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      s.position.set((Math.random() - 0.5) * 32, Math.random() * 3 + 0.5, (Math.random() - 0.5) * 30 - 4);
      const sc = 14 + Math.random() * 16;
      s.scale.set(sc, sc * 0.5, 1);
      s.userData = { vx: (Math.random() - 0.5) * 0.22, o: 0.03 + Math.random() * 0.03 };
      fogSprites.push(s);
      scene.add(s);
    }

    // sakura
    const PN = 260;
    petalData = [];
    const pgeo = new THREE.BufferGeometry();
    const ppos = new Float32Array(PN * 3);
    for (let k = 0; k < PN; k++) {
      ppos[k * 3] = (Math.random() - 0.5) * 36;
      ppos[k * 3 + 1] = Math.random() * 14;
      ppos[k * 3 + 2] = (Math.random() - 0.5) * 60 - 6;
      petalData.push({ s: 0.4 + Math.random() * 0.5, ph: Math.random() * Math.PI * 2, f: 0.5 + Math.random() * 0.7 });
    }
    pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
    petalMat = new THREE.PointsMaterial({ size: 0.34, map: petalTex(), transparent: true, opacity: 0, depthWrite: false, color: 0xf6cdd8, sizeAttenuation: true });
    petals = new THREE.Points(pgeo, petalMat);
    scene.add(petals);

    // ambient dust / fireflies
    const DN = 160;
    const dgeo = new THREE.BufferGeometry();
    const dpos = new Float32Array(DN * 3);
    for (let k = 0; k < DN; k++) {
      dpos[k * 3] = (Math.random() - 0.5) * 40;
      dpos[k * 3 + 1] = Math.random() * 10;
      dpos[k * 3 + 2] = (Math.random() - 0.5) * 70 - 10;
    }
    dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    dustMat = new THREE.PointsMaterial({ size: 0.12, map: glowTex('230,190,140'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    dust = new THREE.Points(dgeo, dustMat);
    scene.add(dust);

    // paper fragments that will become the crane
    const fgeo = new THREE.BufferGeometry();
    const fpos = new Float32Array(FRAGN * 3);
    fragHome = new Float32Array(FRAGN * 3);
    fragTarget = new Float32Array(FRAGN * 3);
    fragDelay = new Float32Array(FRAGN);
    const dir = new THREE.Vector3();
    for (let k = 0; k < FRAGN; k++) {
      dir.randomDirection().multiplyScalar(2.5 + Math.random() * 5.5);
      fragHome[k * 3] = BIRTH.x + dir.x;
      fragHome[k * 3 + 1] = Math.max(0.4, BIRTH.y + dir.y * 0.8);
      fragHome[k * 3 + 2] = BIRTH.z + dir.z;
      dir.randomDirection().multiplyScalar(Math.random() * 0.6);
      fragTarget[k * 3] = BIRTH.x + dir.x;
      fragTarget[k * 3 + 1] = BIRTH.y + dir.y;
      fragTarget[k * 3 + 2] = BIRTH.z + dir.z;
      fragDelay[k] = Math.random() * 0.55;
      fpos[k * 3] = fragHome[k * 3];
      fpos[k * 3 + 1] = fragHome[k * 3 + 1];
      fpos[k * 3 + 2] = fragHome[k * 3 + 2];
    }
    fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
    fragMat = new THREE.PointsMaterial({ size: 0.2, map: paperTex(), transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true });
    frags = new THREE.Points(fgeo, fragMat);
    scene.add(frags);

    // crane birth glow + travelling light
    craneGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex('255,243,226'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    craneGlow.position.copy(BIRTH);
    craneGlow.scale.set(8, 8, 1);
    scene.add(craneGlow);
    craneLight = new THREE.PointLight(0xfff0dc, 0, 30, 1.5);
    craneLight.position.copy(BIRTH);
    scene.add(craneLight);

    // dreamlike vignettes beyond the gate
    const VIG: Array<[string, string, string, string, number, number, number]> = [
      ['locals cooking together', '食', '#26120B', 'rgba(212,120,90,.22)', -5.6, 4.4, -5.5],
      ['friends sharing food', '宴', '#1E150E', 'rgba(232,165,82,.20)', 5.4, 4.9, -7.4],
      ['neighborhood streets', '街', '#141915', 'rgba(122,158,114,.18)', -6.3, 4.1, -9.3],
      ['hidden alleyways', '路', '#151823', 'rgba(107,127,192,.18)', 6.0, 5.2, -11.2],
      ['community gatherings', '集', '#1E1B18', 'rgba(216,174,152,.18)', -5.4, 4.6, -13.0],
      ['cultural exchange', '交', '#23110C', 'rgba(212,120,90,.22)', 5.6, 4.3, -14.6],
    ];
    VIG.forEach((v) => {
      const m = new THREE.MeshBasicMaterial({ map: vigTex(v[0], v[1], v[2], v[3]), transparent: true, opacity: 0, fog: false, side: THREE.DoubleSide });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.26), m);
      p.position.set(v[4] * latSpread, v[5], v[6]);
      p.userData = { bob: Math.random() * Math.PI * 2 };
      vigs.push(p);
      scene.add(p);
    });

    // ---- the interface world the scene transforms into ----
    // streets → grid lines
    const gv: number[] = [];
    for (let x = -12; x <= 12.01; x += 1.5) gv.push(x, 0.02, -20, x, 0.02, -48);
    for (let z = -20; z >= -48.01; z -= 1.5) gv.push(-12, 0.02, z, 12, 0.02, z);
    const ggeo = new THREE.BufferGeometry();
    ggeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gv), 3));
    gridMat = new THREE.LineBasicMaterial({ color: 0xc9744e, transparent: true, opacity: 0, fog: false });
    grid = new THREE.LineSegments(ggeo, gridMat);
    scene.add(grid);

    // architecture → glass panels
    const ptex = panelTex();
    for (let i = 0; i < 7; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const mat = new THREE.MeshBasicMaterial({ map: ptex, transparent: true, opacity: 0, fog: false, side: THREE.DoubleSide, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.2), mat);
      const y0 = 3.4 + (i % 3) * 1.3;
      mesh.position.set(side * (4.2 + (i % 3) * 0.9) * latSpread, y0, -25 - i * 3);
      mesh.rotation.y = -side * 0.5;
      panels.push({ mesh, mat, delay: 18.4 + i * 0.35, y0 });
      scene.add(mesh);
    }

    // lanterns → interface lights
    const warm = glowTex('232,165,82');
    const cool = glowTex('159,180,232');
    for (let i = 0; i < 28; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: i % 3 === 0 ? cool : warm, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
      );
      const side = i % 2 === 0 ? -1 : 1;
      s.position.set(side * 2.7 * latSpread, 0.35, -22.5 - Math.floor(i / 2) * 1.8);
      const sc = 0.55 + Math.random() * 0.3;
      s.scale.set(sc, sc, 1);
      iLights.push({ s, delay: 18.6 + Math.random() * 2.2 });
      scene.add(s);
    }
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: i % 2 === 0 ? warm : cool, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
      );
      s.position.set((Math.random() - 0.5) * 14 * latSpread, 2 + Math.random() * 5, -26 - Math.random() * 16);
      const sc = 0.4 + Math.random() * 0.4;
      s.scale.set(sc, sc, 1);
      iLights.push({ s, delay: 19 + Math.random() * 2.5 });
      scene.add(s);
    }

    window.addEventListener('resize', onResize);
  }

  /* Portrait phones: a fixed 50° vertical fov leaves a sliver of horizontal
     view — widen it so the gate and crane stay framed (capped to avoid
     fisheye). Landing size math reads camera.fov, so it adapts too. */
  function applyFov(): void {
    const a = innerWidth / Math.max(1, innerHeight);
    camera.fov =
      a < 1 ? Math.min(78, (2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(21)) / a) * 180) / Math.PI) : 50;
    camera.aspect = a;
    camera.updateProjectionMatrix();
  }

  function onResize(): void {
    if (!renderer) return;
    applyFov();
    renderer.setSize(innerWidth, innerHeight);
  }

  /* Where the crane lands: the hero perch, unprojected into the scene at a
     depth chosen so its on-screen size matches the page-side crane. */
  function computeLanding(): void {
    const el = document.getElementById('cranePerch');
    const r = el?.getBoundingClientRect();
    let cx = r && r.width > 4 ? r.left + r.width / 2 : innerWidth * 0.72;
    let cy = r && r.height > 4 ? r.top + r.height * 0.52 : innerHeight * 0.42;
    const h = r && r.height > 4 ? Math.min(r.height, innerHeight * 0.6) : innerHeight * 0.45;
    // on small screens the perch may sit below the fold — keep the landing
    // inside the viewport so the crane never flies off-screen
    cx = Math.min(Math.max(cx, innerWidth * 0.15), innerWidth * 0.85);
    cy = Math.min(Math.max(cy, innerHeight * 0.16), innerHeight * 0.72);
    const ndc = new THREE.Vector3((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1, 0.5);
    const restCam = camera.clone();
    restCam.position.copy(REST_POS);
    restCam.lookAt(REST_POS.x, REST_POS.y, REST_POS.z - 12);
    restCam.updateMatrixWorld();
    ndc.unproject(restCam).sub(REST_POS).normalize();
    landPos.copy(REST_POS).addScaledVector(ndc, LAND_DEPTH / Math.max(0.2, -ndc.z));
    // match the apparent size of the perched crane (fov 36, distance ~4.45, scale 1.12)
    const heroFrac = 1.12 / (4.45 * Math.tan((36 / 2) * (Math.PI / 180)));
    landScale = heroFrac * (h / innerHeight) * LAND_DEPTH * Math.tan((camera.fov / 2) * (Math.PI / 180));
    landScale = Math.min(2.6, Math.max(0.9, landScale));
  }

  const lookTmp = new THREE.Vector3();
  const qTmp = new THREE.Quaternion();
  const eTmp = new THREE.Euler();

  function craneFlight(t: number): void {
    if (!rig) return;
    const pos = rig.root.position;

    if (t < T.flightEnd) {
      // hover at birth, then accelerate forward
      const d = 14.5 * sm(17.2, T.flightEnd, t);
      const weave = sm(17.2, 18.4, t) * (1 - sm(20.6, T.flightEnd, t));
      pos.set(
        Math.sin((t - 17.2) * 0.85) * 1.25 * weave * latSpread,
        BIRTH.y + Math.sin(t * 2.6) * 0.22 * weave + Math.sin(t * 1.3) * 0.08,
        BIRTH.z - d,
      );
    } else if (t < T.circle[1]) {
      // one slow circle above the forming page (starts/ends where flight ended)
      const th = sm(T.circle[0], T.circle[1], t) * Math.PI * 2;
      const rad = 2.4 * Math.max(0.7, latSpread); // keep the loop in frame on portrait
      pos.set(Math.sin(th) * rad, BIRTH.y + 0.6 + Math.sin(th * 2) * 0.3, -33.1 - Math.cos(th) * 2.4);
    } else if (t < T.land[1]) {
      const e = sm(T.land[0], T.land[1], t);
      computeLanding();
      const y0 = BIRTH.y + 0.6;
      pos.set(
        landPos.x * e,
        y0 + (landPos.y - y0) * e + Math.sin(e * Math.PI) * 0.6,
        -35.5 + (landPos.z + 35.5) * e,
      );
      rig.root.scale.setScalar(1.2 + (landScale - 1.2) * e);
    } else {
      // landed: idle in place, matching the page crane for the crossfade
      pos.copy(landPos);
      pos.y += Math.sin(t * 1.15) * 0.035 * landScale;
      rig.root.scale.setScalar(landScale);
    }

    // heading from velocity (model faces -Z), with banking; while hovering the
    // velocity is just bob, so hold a steady forward heading until takeoff
    craneVel.copy(pos).sub(cranePrev);
    cranePrev.copy(pos);
    if (t < 17.35) {
      rig.root.rotation.set(Math.sin(t * 1.3) * 0.03, 0, Math.sin(t * 0.9) * 0.04);
    } else if (craneVel.lengthSq() > 1e-8) {
      lookTmp.copy(pos).sub(craneVel.clone().normalize());
      rig.root.lookAt(lookTmp);
      const bank = THREE.MathUtils.clamp(-craneVel.x * 14, -0.5, 0.5) * sm(17.4, 18.2, t) * (1 - sm(T.land[0], T.land[0] + 0.9, t));
      rig.root.rotateZ(bank);
    }
    // blend to the final perched orientation while landing
    const settle = sm(T.land[0] + 0.4, T.land[1], t);
    if (settle > 0) {
      qTmp.setFromEuler(eTmp.set(0, PERCH_YAW, 0));
      rig.root.quaternion.slerp(qTmp, settle);
    }

    // wings: spread at birth → flap in flight → fold on landing
    const flapAmp = 0.5 * sm(16.9, 17.8, t) * (1 - sm(T.land[0], T.land[1] - 0.2, t));
    const flap = Math.sin(t * 7.2) * flapAmp;
    const fold = PERCH_FOLD * sm(T.land[1] - 0.8, T.land[1], t);
    setWings(rig, flap + fold + (t > T.land[1] ? Math.sin(t * 1.15 + 0.7) * 0.045 : 0));

    // birth glow / light follow
    craneGlow.position.copy(pos);
    craneLight.position.set(pos.x, pos.y + 0.9, pos.z + 1.2);
  }

  function update(t: number): void {
    renderer!.toneMappingExposure = 1.08 * sm(0, 1.8, t);

    // ---- camera ----
    const drift = 1 - sm(15.5, 18, t);
    let cz: number;
    if (t < 10) cz = 30 - sm(0, 10, t) * 29.5;
    else cz = 0.5 - sm(10, 17, t) * 14;
    let cx = Math.sin(t * 0.2) * 0.5 * drift;
    let cy = 4.6 + Math.sin(t * 0.13) * 0.22 * drift;

    if (rig && t >= 17.2) {
      const follow = sm(17.2, 18.6, t);
      const p = rig.root.position;
      cz = cz * (1 - follow) + (p.z + 7.2) * follow;
      cx = cx * (1 - follow) + p.x * 0.55 * follow;
      cy = cy * (1 - follow) + (p.y + 0.35) * follow;
    }
    const toRest = sm(T.circle[0], 23.2, t);
    cx = cx * (1 - toRest) + REST_POS.x * toRest;
    cy = cy * (1 - toRest) + REST_POS.y * toRest;
    cz = cz * (1 - toRest) + REST_POS.z * toRest;
    camera.position.set(cx, cy, cz);

    const ahead = lookTmp.set(cx * 0.3, 5, cz - 12);
    if (rig && t >= 13.8 && toRest < 1) {
      const w = sm(13.8, 14.6, t) * (1 - toRest);
      ahead.lerp(rig.root.position, w);
      ahead.x = ahead.x * (1 - toRest) + REST_POS.x * toRest;
      ahead.y = ahead.y * (1 - toRest) + REST_POS.y * toRest;
      ahead.z = ahead.z * (1 - toRest) + (REST_POS.z - 12) * toRest;
    } else if (toRest >= 1) {
      ahead.set(REST_POS.x, REST_POS.y, REST_POS.z - 12);
    }
    camera.lookAt(ahead);

    // ---- gate, lanterns, mist ----
    const gateOp = 1 - sm(18.5, 21, t);
    gateMats.forEach((m) => (m.opacity = gateOp));
    const li = sm(0.4, 3.4, t) * gateOp;
    const flick = 1 + Math.sin(t * 7.3) * 0.06 + Math.sin(t * 11.7) * 0.04;
    pl1.intensity = pl2.intensity = li * 42 * flick;
    lan1.material.opacity = lan2.material.opacity = li * 0.5 + Math.sin(t * 2.3) * 0.04 * li;
    if (fireMat) fireMat.emissiveIntensity = 4 * li * flick;
    groundMat.opacity = 1 - sm(19, 21.5, t);
    fogSprites.forEach((s) => {
      s.position.x += (s.userData.vx as number) * 0.016;
      if (s.position.x > 20) s.position.x = -20;
      if (s.position.x < -20) s.position.x = 20;
      s.material.opacity = (s.userData.o as number) * sm(0.5, 3.5, t) * (1 - sm(18.5, 21.5, t));
    });

    // ---- sakura: drift, then some gather into the birth ----
    petalMat.opacity = sm(1, 4, t) * 0.85 * (1 - sm(24.4, 25.5, t));
    const pp = petals.geometry.attributes.position.array as Float32Array;
    const pull = sm(T.gather[0], T.gather[1], t) * (1 - sm(15.8, 16.6, t));
    for (let k = 0; k < petalData.length; k++) {
      const pd = petalData[k];
      pp[k * 3 + 1] -= pd.s * 0.016;
      pp[k * 3] += Math.sin(t * pd.f + pd.ph) * 0.012;
      if (pp[k * 3 + 1] < 0) pp[k * 3 + 1] = 14;
      if (pull > 0 && k % 3 === 0) {
        const dx = BIRTH.x - pp[k * 3];
        const dy = BIRTH.y - pp[k * 3 + 1];
        const dz = BIRTH.z - pp[k * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < 120) {
          pp[k * 3] += dx * 0.045 * pull;
          pp[k * 3 + 1] += dy * 0.045 * pull;
          pp[k * 3 + 2] += dz * 0.045 * pull;
        }
      }
    }
    petals.geometry.attributes.position.needsUpdate = true;

    // ---- dust ----
    dustMat.opacity = sm(1, 4, t) * 0.4 * (1 - sm(18, 20, t));

    // ---- vignettes ----
    const vGlobal = sm(8.6, 10.4, t) * (1 - sm(14.4, 15.6, t));
    vigs.forEach((v) => {
      const d = camera.position.z - v.position.z;
      const o = sm(4, 14, d) * (1 - sm(-1.5, 2.2, -d)) * vGlobal;
      (v.material as THREE.MeshBasicMaterial).opacity = o * 0.92;
      v.position.y += Math.sin(t * 0.7 + (v.userData.bob as number)) * 0.0012;
      v.lookAt(camera.position.x, v.position.y, camera.position.z);
    });

    // ---- origami birth ----
    const gatherE = sm(T.gather[0], T.gather[1], t);
    if (t > 12.4 && t < 17) {
      fragMat.opacity = sm(12.6, 14, t) * 0.95 * (1 - sm(15.4, 16.5, t));
      const fp = frags.geometry.attributes.position.array as Float32Array;
      for (let k = 0; k < FRAGN; k++) {
        const e = sm(0, 1, (gatherE - fragDelay[k]) / 0.45);
        const sw = Math.sin(t * 2 + k) * 0.18 * (1 - e);
        fp[k * 3] = fragHome[k * 3] + (fragTarget[k * 3] - fragHome[k * 3]) * e + sw;
        fp[k * 3 + 1] = fragHome[k * 3 + 1] + (fragTarget[k * 3 + 1] - fragHome[k * 3 + 1]) * e + Math.cos(t * 1.7 + k) * 0.14 * (1 - e);
        fp[k * 3 + 2] = fragHome[k * 3 + 2] + (fragTarget[k * 3 + 2] - fragHome[k * 3 + 2]) * e + sw;
      }
      frags.geometry.attributes.position.needsUpdate = true;
    }
    if (rig && assembly) {
      const foldE = sm(T.fold[0], T.fold[1], t);
      if (foldE > 0) {
        rig.material.opacity = Math.min(1, foldE * 2.5);
        assembly.update(foldE);
        craneFlight(t);
      }
      rig.material.emissiveIntensity = 1.4 * sm(14.2, 15.2, t) * (1 - sm(16.5, 17.8, t)) + 0.05 * sm(14.2, 15.2, t);
    }
    const glowPulse = sm(14.0, 15.2, t) * (1 - sm(16.6, 18.2, t));
    craneGlow.material.opacity = glowPulse * (0.55 + Math.sin(t * 3.1) * 0.1);
    craneLight.intensity = glowPulse * 26 + sm(15, 16, t) * (1 - sm(22.5, 24.5, t)) * 9;

    // ---- world transformation ----
    const tf = sm(T.transform[0], T.transform[1], t);
    const out = sm(23.6, 25.2, t);
    gridMat.opacity = 0.16 * tf * (1 - out);
    panels.forEach((p) => {
      p.mat.opacity = 0.85 * sm(p.delay, p.delay + 1.3, t) * (1 - out);
      p.mesh.position.y = p.y0 + Math.sin(t * 0.6 + p.y0) * 0.12;
    });
    iLights.forEach((l) => {
      l.s.material.opacity = (0.5 + Math.sin(t * 2 + l.delay * 7) * 0.12) * sm(l.delay, l.delay + 1.1, t) * (1 - sm(24, 25.4, t));
    });
    ambient.intensity = 0.3 + tf * 0.6;
    moon.intensity = 0.22 + tf * 0.25;

    // background dissolves to washi, then to the real page
    const bgMix = sm(19, 22.5, t);
    fog.color.lerpColors(DARK, WASHI, bgMix);
    fog.density = 0.02 - bgMix * 0.013;
    const alpha = 1 - sm(T.alphaOut[0], T.alphaOut[1], t);
    renderer!.setClearColor(fog.color, alpha);
    if (alpha < 1 && !ov.classList.contains('lift')) ov.classList.add('lift');

    // ---- the page constructs itself ----
    if (!navDone && t >= T.navIn) {
      navDone = true;
      document.querySelector('header.nav')?.classList.add('in');
    }
    if (!heroDone && t >= T.heroIn) {
      heroDone = true;
      document.querySelectorAll<HTMLElement>('.hero .reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('in'), i * 130);
      });
    }
    if (t >= T.craneLand) signalCraneLand();

    // captions + bells
    cap1El.classList.toggle('show', t > T.cap1[0] && t < T.cap1[1]);
    cap2El.classList.toggle('show', t > T.cap2[0] && t < T.cap2[1]);
    if (audio && bellIdx < BELLS.length && t >= BELLS[bellIdx]) {
      audio.bell();
      bellIdx++;
    }

    if (t >= T.done && !doneFlag) finishReveal();
  }

  // ---------- run loop ----------
  let tAcc = 0;
  let lastNow = 0;
  function loop(now: number): void {
    if (!lastNow) lastNow = now;
    const dt = Math.min((now - lastNow) / 1000, 0.06);
    lastNow = now;
    tAcc += dt;
    update(tAcc);
    renderer!.render(scene, camera);
    if (!doneFlag || tAcc < T.done + 1.4) raf = requestAnimationFrame(loop);
  }

  // ---------- finish / skip ----------
  function constructInstant(): void {
    document.querySelector('header.nav')?.classList.add('in');
    document.querySelectorAll('.hero .reveal').forEach((el) => el.classList.add('in'));
  }

  function finishReveal(): void {
    if (doneFlag) return;
    doneFlag = true;
    if (audio) audio.end();
    constructInstant();
    signalCraneLand();
    signalIntroDone();
    document.body.classList.remove('intro-lock');
    ov.style.transition = 'opacity 1.1s ease';
    requestAnimationFrame(() => {
      ov.style.opacity = '0';
    });
    setTimeout(() => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      try {
        renderer?.dispose();
      } catch {
        /* context already lost */
      }
      ov.remove();
      document.body.classList.remove('intro-stage');
    }, 1200);
  }

  function skip(): void {
    if (doneFlag) return;
    flashEl.style.transition = 'opacity .45s ease';
    flashEl.style.opacity = '1';
    setTimeout(() => {
      finishReveal();
      flashEl.style.opacity = '0';
    }, 460);
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
      document.body.classList.remove('intro-lock', 'intro-stage');
      signalCraneLand();
      signalIntroDone();
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
