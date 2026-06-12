/* Shared gating for the cinematic intro — used by both the site chrome
   (to hold reveal animations until the intro hands over) and the homepage
   (to decide whether to load the intro chunk at all).
   sessionStorage can throw in sandboxed/private contexts; treat that as "no intro". */

export function introPending(): boolean {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    const seen = sessionStorage.getItem('yoriai_intro_done');
    return !seen || location.hash === '#intro';
  } catch {
    return false;
  }
}

export function markIntroDone(): void {
  try {
    sessionStorage.setItem('yoriai_intro_done', '1');
  } catch {
    /* storage unavailable — intro will simply replay next visit */
  }
}

/** Fired when the intro finishes, is skipped, or bails — reveals start here. */
export const INTRO_DONE_EVENT = 'yoriai:intro-done';

let done = false;

/** True once the intro has handed over (covers signals fired before listeners attach). */
export function introHandedOver(): boolean {
  return done;
}

export function signalIntroDone(): void {
  done = true;
  window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));
}

/** Fired when the intro's crane reaches its perch — the page-side crane mounts here. */
export const CRANE_LAND_EVENT = 'yoriai:crane-land';

let landed = false;

export function craneLanded(): boolean {
  return landed;
}

export function signalCraneLand(): void {
  if (landed) return;
  landed = true;
  window.dispatchEvent(new CustomEvent(CRANE_LAND_EVENT));
}
