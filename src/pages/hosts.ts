import '../site';
import { toriiSVG } from '../lib/torii';

document.querySelector('.fh-badge')!.innerHTML = toriiSVG(30, '#F5F0EB') + '<span class="jp">創</span>';

const seg = document.getElementById('hoodSeg')!;
seg.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.seg-btn');
  if (!b) return;
  seg.querySelectorAll('.seg-btn').forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
});

const f = document.getElementById('applyForm') as HTMLFormElement;
f.addEventListener('submit', (e) => {
  e.preventDefault();
  const nm = document.getElementById('aName') as HTMLInputElement;
  const em = document.getElementById('aEmail') as HTMLInputElement;
  if (!nm.value.trim()) {
    nm.focus();
    nm.style.borderColor = 'var(--terra)';
    return;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)) {
    em.focus();
    em.style.borderColor = 'var(--terra)';
    return;
  }
  f.innerHTML = `<div class="wl-success">${toriiSVG(48)}
    <h3 class="h3" style="margin-top:14px">Welcome, ${nm.value.trim()}.</h3>
    <p class="muted" style="margin-top:8px">You're in the founding-host queue. We'll reach out personally to <b style="color:var(--ink)">${em.value}</b> to get you set up before Osaka opens.</p>
    <div class="jp" style="color:var(--terra);font-size:24px;margin-top:16px">よろしくお願いします</div></div>`;
});
