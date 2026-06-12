import '../site';
import { toriiSVG } from '../lib/torii';
import { introPending, signalIntroDone } from '../lib/introGate';
import { ACTIVITIES, activityCard } from '../data/activities';

// ---- cinematic intro (loaded lazily; only on first visit per session) ----
if (introPending()) {
  document.body.classList.add('intro-lock');
  import('../intro/intro')
    .then((m) => m.runIntro())
    .catch(() => {
      // chunk failed to load — release the page and let reveals run
      document.body.classList.remove('intro-lock');
      signalIntroDone();
    });
}

// ---- hero avatars ----
const tones = ['', 'matcha', 'dusk', 'stone'];
const heroAv = document.getElementById('heroAvatars')!;
['H', 'K', 'Y', 'S', 'R'].forEach((l, i) => {
  const s = document.createElement('span');
  s.className = 'av ' + tones[i % 4];
  s.textContent = l;
  s.style.cssText = 'width:34px;height:34px;font-size:14px;margin-left:' + (i ? '-10px' : '0');
  heroAv.appendChild(s);
});

// ---- marquee ----
const words = [
  'Morning market walks', 'Standing-bar hops', 'Kissaten & vinyl', 'Sento etiquette',
  'River cycles', 'Okonomiyaki nights', 'Kintsugi repair', 'Language exchange',
  'Castle-park tai-chi', 'Ramen alley crawls',
];
const track = document.getElementById('marqueeTrack')!;
track.innerHTML = [...words, ...words]
  .map((w) => `<span class="mq">${w}</span><span class="mq-sep">${toriiSVG(15)}</span>`)
  .join('');

// ---- feed preview cards ----
const feat = ['kuromon', 'nakanoshima', 'okonomiyaki', 'kissaten', 'yodogawa', 'sento'];
const grid = document.getElementById('feedGrid')!;
feat.forEach((id, i) => {
  const a = ACTIVITIES.find((x) => x.id === id)!;
  const el = document.createElement('a');
  el.href = 'activity.html?id=' + a.id;
  el.className = 'acard reveal d' + ((i % 3) + 1);
  el.innerHTML = activityCard(a);
  grid.appendChild(el);
});

// ---- live ticker ----
const events = [
  'Mei just opened "Minoo Falls hike" · Sun 9:00',
  "Anna from 🇩🇪 joined Haruka's market crawl",
  "Ren's kissaten afternoon filled — 1 spot reopened",
  'Daiki added a sunset river cycle · Wed',
  'Luca from 🇮🇹 left Yuki ★★★★★ "unreal night"',
  "Tomo's late-night ramen walk · 2 spots left",
];
let ti = 0;
const tt = document.getElementById('tickerText')!;
function tick(): void {
  tt.style.opacity = '0';
  setTimeout(() => {
    tt.textContent = events[ti % events.length];
    tt.style.opacity = '1';
    ti++;
  }, 300);
}
tick();
setInterval(tick, 3400);

// ---- waitlist ----
const seg = document.getElementById('roleSeg')!;
let role = 'traveler';
seg.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.seg-btn');
  if (!b) return;
  seg.querySelectorAll('.seg-btn').forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
  role = b.dataset.role ?? 'traveler';
});
const form = document.getElementById('wlForm') as HTMLFormElement;
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const em = document.getElementById('wlEmail') as HTMLInputElement;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)) {
    em.focus();
    em.style.borderColor = 'var(--terra)';
    return;
  }
  form.innerHTML = `<div class="wl-success">
    ${toriiSVG(48)}
    <h3 class="h3" style="margin-top:14px">You're on the list.</h3>
    <p class="muted" style="margin-top:8px">We'll email <b style="color:var(--ink)">${em.value}</b> the moment Osaka opens for ${role === 'local' ? 'hosts' : 'travelers'}. ${role === 'local' ? 'Watch for your Founding Host invite.' : ''}</p>
    <div class="jp" style="color:var(--terra);font-size:24px;margin-top:16px">ありがとう</div>
  </div>`;
});

// ---- 3D: hero parallax tilt ----
const fineMotion =
  window.matchMedia('(prefers-reduced-motion: no-preference)').matches &&
  window.matchMedia('(pointer: fine)').matches;
const stage = document.getElementById('heroStage');
const art = document.getElementById('heroArt');
if (fineMotion && stage && art) {
  let tx = 0, ty = 0, cx = 0, cy = 0;
  let raf: number | null = null;
  const step = (): void => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    stage.style.transform = `rotateY(${(cx * 7).toFixed(2)}deg) rotateX(${(-cy * 5).toFixed(2)}deg)`;
    if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(step);
    else raf = null;
  };
  const onMove = (e: MouseEvent): void => {
    const r = art.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    tx = Math.max(-1, Math.min(1, nx));
    ty = Math.max(-1, Math.min(1, ny));
    if (!raf) raf = requestAnimationFrame(step);
  };
  const onLeave = (): void => {
    tx = 0;
    ty = 0;
    if (!raf) raf = requestAnimationFrame(step);
  };
  const hero = document.querySelector<HTMLElement>('.hero')!;
  hero.addEventListener('mousemove', onMove);
  hero.addEventListener('mouseleave', onLeave);
}

// ---- 3D: feed card tilt on hover ----
if (fineMotion) {
  grid.addEventListener('mousemove', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.acard');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    card.style.transform = `perspective(900px) rotateY(${(nx * 3.5).toFixed(2)}deg) rotateX(${(-ny * 3).toFixed(2)}deg) translateY(-4px)`;
  });
  grid.addEventListener('mouseout', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.acard');
    if (card && !card.contains(e.relatedTarget as Node)) card.style.transform = '';
  });
}
