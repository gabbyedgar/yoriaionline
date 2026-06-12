/* Shared gating for the cinematic intro — used by both the site chrome
   (to hold reveal animations until the intro hands over) and the homepage
   (to decide whether to load the intro chunk at all).

   The cinematic plays on EVERY load of the homepage (by design — a reload
   takes you back through the gateway). Only prefers-reduced-motion opts out. */

export function introPending(): boolean {
  try {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/* index.html sets html.intro-boot before first paint so the page can never
   flash before the overlay mounts. Every path that takes over the screen
   (or bails) must lift it. */
export function clearIntroBoot(): void {
  document.documentElement.classList.remove('intro-boot');
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
  clearIntroBoot();
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
