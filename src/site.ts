/* ============================================================
   YORIAI — shared site behaviors + chrome injection
   ============================================================ */
import './styles/yoriai.css';
import { toriiSVG } from './lib/torii';

const NAV: Array<[string, string]> = [
  ['How it works', 'how-it-works.html'],
  ['Browse', 'browse.html'],
  ['Safety', 'safety.html'],
];
const ABOUT_MENU: Array<[string, string]> = [
  ['Our mission', 'about.html'],
  ['For travelers', 'travelers.html'],
  ['For hosts', 'hosts.html'],
];

function page(): string {
  const p = location.pathname.split('/').pop() ?? '';
  return p === '' ? 'index.html' : p;
}

function buildNav(): void {
  const here = page();
  const aboutActive = ABOUT_MENU.some(([, h]) => h === here);
  const links =
    NAV.map(([t, h]) => `<a href="${h}" class="${h === here ? 'active' : ''}">${t}</a>`).join('') +
    `<div class="nav-drop ${aboutActive ? 'active-group' : ''}">
      <a href="about.html" class="nav-drop-trigger ${aboutActive ? 'active' : ''}" aria-haspopup="true">About <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l4 4 4-4"></path></svg></a>
      <div class="nav-drop-menu">
        ${ABOUT_MENU.map(([t, h]) => `<a href="${h}" class="${h === here ? 'active' : ''}">${t}</a>`).join('')}
      </div>
    </div>`;
  const mlinks = NAV.concat(ABOUT_MENU, [['FAQ', 'faq.html']])
    .map(([t, h]) => `<a href="${h}">${t}</a>`)
    .join('');
  const el = document.createElement('header');
  el.className = 'nav';
  el.innerHTML = `
    <div class="nav-inner">
      <a class="brand" href="index.html" aria-label="Yoriai home">
        ${toriiSVG(30)}
        <span class="word">Yoriai</span>
      </a>
      <nav class="nav-links">${links}</nav>
      <div class="nav-cta">
        <a class="btn btn-ghost btn-sm" href="hosts.html#apply">Become a host</a>
        <a class="btn btn-primary btn-sm" href="index.html#waitlist">Join the waitlist</a>
        <button class="nav-toggle" aria-label="Menu" data-sheet="open">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
        </button>
      </div>
    </div>
    <div class="msheet" id="msheet">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <a class="brand" href="index.html">${toriiSVG(28)}<span class="word">Yoriai</span></a>
        <button class="nav-toggle" aria-label="Close" data-sheet="close">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      ${mlinks}
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:12px;padding-top:24px">
        <a class="btn btn-ghost btn-lg" href="hosts.html#apply">Become a host</a>
        <a class="btn btn-primary btn-lg" href="index.html#waitlist">Join the waitlist</a>
      </div>
    </div>`;
  document.body.prepend(el);

  const sheet = el.querySelector<HTMLElement>('#msheet')!;
  el.querySelectorAll<HTMLButtonElement>('[data-sheet]').forEach((b) =>
    b.addEventListener('click', () => sheet.classList.toggle('open', b.dataset.sheet === 'open')),
  );
  const onScroll = () => el.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function buildFoot(): void {
  const f = document.createElement('footer');
  f.className = 'foot';
  f.innerHTML = `
    <div class="wrap-wide">
      <div class="foot-grid">
        <div>
          <a class="brand" href="index.html" style="margin-bottom:18px">
            ${toriiSVG(34, '#F5F0EB')}
            <span class="word">Yoriai</span>
          </a>
          <p style="max-width:300px;color:#8C857E;margin-top:6px">Join the everyday life of Japan — morning walks, market breakfasts, kissaten afternoons — hosted by the locals who live it.</p>
          <div class="jp" style="color:#5A534D;font-size:22px;margin-top:14px">より合い</div>
        </div>
        <div>
          <h5>Explore</h5>
          <ul>
            <li><a href="how-it-works.html">How it works</a></li>
            <li><a href="browse.html">Browse activities</a></li>
            <li><a href="travelers.html">For travelers</a></li>
            <li><a href="hosts.html">For hosts</a></li>
          </ul>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li><a href="about.html">About</a></li>
            <li><a href="safety.html">Safety &amp; trust</a></li>
            <li><a href="faq.html">FAQ</a></li>
            <li><a href="index.html#waitlist">Join waitlist</a></li>
          </ul>
        </div>
        <div>
          <h5>Osaka · 大阪</h5>
          <ul>
            <li><a href="browse.html">Live this week</a></li>
            <li><a href="hosts.html#apply">Founding hosts</a></li>
            <li><a href="#">Instagram</a></li>
            <li><a href="#">Press kit</a></li>
          </ul>
        </div>
      </div>
      <div class="foot-bottom">
        <span>© 2026 Yoriai · Made in Osaka, Japan</span>
        <span style="display:flex;gap:22px"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Community guidelines</a></span>
      </div>
    </div>`;
  document.body.appendChild(f);
}

function reveals(): void {
  const els = [...document.querySelectorAll<HTMLElement>('.reveal')];
  if (!els.length) return;
  function check(): void {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    for (let i = els.length - 1; i >= 0; i--) {
      const r = els[i].getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) {
        els[i].classList.add('in');
        els.splice(i, 1);
      }
    }
  }
  check();
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  // safety net: never leave content hidden
  setTimeout(() => els.forEach((e) => e.classList.add('in')), 2600);
}

/* Renders the brand mark into any element with data-torii="size[,ink[,terra]]" */
function marks(): void {
  document.querySelectorAll<HTMLElement>('[data-torii]').forEach((el) => {
    const [size, ink, terra] = (el.dataset.torii ?? '48').split(',');
    el.innerHTML = toriiSVG(Number(size) || 48, ink || undefined, terra || undefined);
  });
}

function init(): void {
  buildNav();
  if (!document.body.hasAttribute('data-nofoot')) buildFoot();
  marks();
  reveals();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export { toriiSVG };
