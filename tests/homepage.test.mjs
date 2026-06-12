/* Smoke test for the built homepage (jsdom — no browser needed).
 *
 * Guards the regressions that shipped once:
 *  1. feed cards must render and never be left hidden
 *  2. on a cinematic load (every visit now) the reveals are HELD while the
 *     intro owns the screen, and play once it dispatches `yoriai:intro-done`
 *  3. with prefers-reduced-motion the cinematic is skipped and the page
 *     shows normally
 *
 * Run after `npm run build`:
 *   node tests/homepage.test.mjs reduced     # reduced motion (no intro)
 *   node tests/homepage.test.mjs cinematic   # cinematic load (intro gating)
 */
import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync } from 'node:fs';

const run = async (cinematicLoad) => {
  const html = readFileSync('index.html', 'utf8').replace(/<script type="module"[^>]*><\/script>/, '');
  const dom = new JSDOM(html, { url: 'http://localhost/index.html', pretendToBeVisual: true });
  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;
  for (const k of ['location', 'sessionStorage', 'CustomEvent', 'HTMLElement', 'Node']) globalThis[k] = window[k];
  globalThis.MutationObserver = window.MutationObserver;
  globalThis.fetch = () => new Promise(() => {}); // GLB fetch never resolves — irrelevant here
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  // the cinematic plays on every load unless reduced motion is requested
  window.matchMedia = globalThis.matchMedia = (q) => ({
    matches: q.includes('prefers-reduced-motion: reduce') ? !cinematicLoad : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  });

  const entry = readdirSync('dist/assets').find((f) => f.startsWith('index-') && f.endsWith('.js'));
  await import(`../dist/assets/${entry}`);

  await new Promise((r) => setTimeout(r, 400));
  const cards = document.querySelectorAll('#feedGrid .acard').length;
  const hiddenEarly = document.querySelectorAll('.reveal:not(.in)').length;
  const total = document.querySelectorAll('.reveal').length;

  if (cinematicLoad) {
    // reveals must be HELD while the intro owns the screen
    console.log(`cinematic load: cards=${cards} held=${hiddenEarly}/${total} lock=${document.body.classList.contains('intro-lock')}`);
    if (hiddenEarly !== total) return false;
    window.dispatchEvent(new window.CustomEvent('yoriai:intro-done')); // intro hands over
  } else {
    console.log(`reduced motion: cards=${cards} hiddenEarly=${hiddenEarly}/${total}`);
    // the pre-paint cover must never survive a non-cinematic load
    if (document.documentElement.classList.contains('intro-boot')) return false;
  }
  await new Promise((r) => setTimeout(r, 3300)); // reveal start + 2.6s safety net
  const hiddenLate = document.querySelectorAll('.reveal:not(.in)').length;
  console.log(`  after handover/settle: hidden=${hiddenLate}, nav=${!!document.querySelector('header.nav')}, foot=${!!document.querySelector('footer.foot')}`);
  return cards === 6 && hiddenLate === 0 && !!document.querySelector('header.nav');
};

const ok = await run(process.argv[2] === 'cinematic');
console.log(ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
