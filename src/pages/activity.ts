import '../site';
import { toriiSVG } from '../lib/torii';
import { ACTIVITIES, findActivity, activityCard } from '../data/activities';

const a = findActivity(new URLSearchParams(location.search).get('id'));
document.title = a.title + ' — Yoriai';

// gallery
const gv = ['', '· detail', '· the spot', '· the people'];
document.getElementById('gallery')!.innerHTML = gv
  .map(
    (s, i) =>
      `<div class="ph ${i === 0 ? a.tint : ['t-stone', 't-matcha', 't-dusk', 't-terra'][i % 4]} g${i}"><span class="ph-lab">${a.ph} ${s}</span></div>`,
  )
  .join('');

// tags
document.getElementById('dTags')!.innerHTML =
  `<span class="tag live"><span class="dot"></span> ${a.tag}</span><span class="tag">${a.cat}</span><span class="tag">${a.dur}</span>`;
document.getElementById('dTitle')!.textContent = a.title;
document.getElementById('dMeta')!.textContent = `${a.area}  ·  ${a.when}  ·  ${a.dur}`;

// host
const hood = a.area.split('·').pop()!.trim();
document.getElementById('dHost')!.innerHTML = `
  <span class="av ${a.hostTone}" style="width:60px;height:60px;font-size:24px">${a.hostAv}</span>
  <div style="flex:1">
    <div class="mono" style="font-size:11px;color:var(--terra)">YOUR HOST</div>
    <div style="font-family:var(--font-serif);font-size:22px;margin:2px 0 4px">${a.host}</div>
    <div class="muted" style="font-size:14px"><span class="stars">★</span> ${a.rating} · ${a.reviews} reviews · Hosts in ${hood}</div>
  </div>
  <span class="tag">✓ Verified</span>`;

document.getElementById('dBlurb')!.textContent = a.blurb;
document.getElementById('dExtra')!.textContent =
  'Come as you are — no preparation needed. I keep groups small so it actually feels like hanging out, not a tour. We meet in public, and I’ll send you exactly where once you’re approved.';
document.getElementById('dMapLab')!.textContent = 'map · ' + a.area;

// facts
const facts: Array<[string, string]> = [
  ['When', a.when],
  ['Duration', a.dur],
  ['Group size', a.cap + ' max · ' + a.seats + ' spots left'],
  ['Language', 'Japanese & English'],
  ['Cost', a.price],
  ['Meeting point', 'Public · ' + hood],
];
document.getElementById('dFacts')!.innerHTML = facts
  .map((f) => `<div class="fact"><span class="mono">${f[0]}</span><b>${f[1]}</b></div>`)
  .join('');

// participants
const joined = a.cap - a.seats;
const names: Array<[string, string]> = [
  ['Anna', 'dusk'], ['Luca', 'matcha'], ['Sofia', ''], ['Tom', 'stone'], ['Mei', 'matcha'], ['Kim', 'dusk'],
];
let parts = '';
for (let i = 0; i < Math.max(joined, 1); i++) {
  const n = names[i % names.length];
  parts += `<div class="part"><span class="av ${n[1]}" style="width:40px;height:40px;font-size:16px">${n[0][0]}</span><span>${n[0]}</span></div>`;
}
for (let i = 0; i < a.seats; i++) {
  parts += `<div class="part open"><span class="av-open">+</span><span class="muted">Open</span></div>`;
}
document.getElementById('dParts')!.innerHTML = parts;

// reviews
document.getElementById('dRevSum')!.innerHTML =
  `<span class="stars" style="font-size:14px">★</span> ${a.rating} · ${a.reviews} reviews`;
const revs = [
  { n: 'Anna', t: 'dusk', d: 'Berlin', r: 'Exactly what I hoped Japan travel could feel like. Warm, easy, real. ' + a.host + ' made everyone comfortable in about thirty seconds.' },
  { n: 'Luca', t: 'matcha', d: 'Milan', r: 'I’ve done expensive tours that taught me less than this free morning. Cannot recommend enough.' },
  { n: 'Sofia', t: '', d: 'Lisbon', r: 'Small group, zero awkwardness, and I actually understand the neighborhood now. Already booked another.' },
];
document.getElementById('dReviews')!.innerHTML = revs
  .map(
    (v) => `
  <div class="review">
    <div class="rev-head"><span class="av ${v.t}" style="width:36px;height:36px;font-size:14px">${v.n[0]}</span>
      <div><b>${v.n}</b><span class="mono" style="font-size:11px;display:block">${v.d} · ★★★★★</span></div></div>
    <p>${v.r}</p>
  </div>`,
  )
  .join('');

// booking
document.getElementById('bPrice')!.textContent = a.price;
document.getElementById('bDur')!.textContent = a.dur;
document.getElementById('bWhen')!.textContent = a.when + ' · ' + a.area;
const fill = ((a.cap - a.seats) / a.cap) * 100;
document.getElementById('bSeats')!.innerHTML =
  `<div class="seatbar"><div class="seatbar-fill" style="width:${fill}%"></div></div>
   <div class="mono" style="font-size:12px;margin-top:8px"><b style="color:var(--ink)">${a.seats} of ${a.cap}</b> spots left</div>`;

const btn = document.getElementById('joinBtn')!;
btn.addEventListener(
  'click',
  () => {
    btn.outerHTML = `<div class="join-pending"><span class="dot pulse"></span> Request sent — waiting for ${a.host}</div>`;
    setTimeout(() => {
      const pend = document.getElementById('bookCard')!.querySelector('.join-pending');
      if (pend)
        pend.outerHTML = `<div class="join-ok">${toriiSVG(36)}<b>You're in!</b><span class="muted">${a.host} approved your request. Reminders at 24h &amp; 1h before. See you in ${hood}.</span></div>`;
    }, 2200);
  },
  { once: true },
);

// more
document.getElementById('more')!.innerHTML = ACTIVITIES.filter((x) => x.id !== a.id)
  .slice(0, 3)
  .map((m) => `<a href="activity.html?id=${m.id}" class="acard">${activityCard(m)}</a>`)
  .join('');
