/* Smoke test for the built homepage (jsdom — no browser needed).
 *
 * Guards the two regressions that shipped once:
 *  1. feed cards created after site init must still be revealed
 *     (reveals live-query the DOM instead of snapshotting it)
 *  2. on a first visit the reveals are HELD while the intro owns the
 *     screen, and play once it dispatches `yoriai:intro-done`
 *
 * Run after `npm run build`:
 *   node tests/homepage.test.mjs return   # returning visitor (no intro)
 *   node tests/homepage.test.mjs first    # first visit (intro gating)
 */
import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync } from 'node:fs';

const run = async (firstVisit) => {
  const html = readFileSync('index.html', 'utf8').replace(/<script type="module"[^>]*><\/script>/, '');
  const dom = new JSDOM(html, { url: 'http://localhost/index.html', pretendToBeVisual: true });
  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;
  for (const k of ['location', 'sessionStorage', 'CustomEvent', 'HTMLElement', 'Node']) globalThis[k] = window[k];
  globalThis.MutationObserver = window.MutationObserver;
  globalThis.fetch = () => new Promise(() => {}); // GLB fetch never resolves — irrelevant here
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  window.matchMedia = globalThis.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} });
  if (!firstVisit) window.sessionStorage.setItem('yoriai_intro_done', '1');

  const entry = readdirSync('dist/assets').find((f) => f.startsWith('index-') && f.endsWith('.js'));
  await import(`../dist/assets/${entry}`);

  await new Promise((r) => setTimeout(r, 400));
  const cards = document.querySelectorAll('#feedGrid .acard').length;
  const hiddenEarly = document.querySelectorAll('.reveal:not(.in)').length;
  const total = document.querySelectorAll('.reveal').length;

  if (firstVisit) {
    // reveals must be HELD while the intro owns the screen
    console.log(`first visit: cards=${cards} held=${hiddenEarly}/${total} lock=${document.body.classList.contains('intro-lock')}`);
    if (hiddenEarly !== total) return false;
    window.dispatchEvent(new window.CustomEvent('yoriai:intro-done')); // intro hands over
  } else {
    console.log(`return visit: cards=${cards} hiddenEarly=${hiddenEarly}/${total}`);
  }
  await new Promise((r) => setTimeout(r, 3300)); // reveal start + 2.6s safety net
  const hiddenLate = document.querySelectorAll('.reveal:not(.in)').length;
  console.log(`  after handover/settle: hidden=${hiddenLate}, nav=${!!document.querySelector('header.nav')}, foot=${!!document.querySelector('footer.foot')}`);
  return cards === 6 && hiddenLate === 0 && !!document.querySelector('header.nav');
};

const ok = await run(process.argv[2] === 'first');
console.log(ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
