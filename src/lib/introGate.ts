/* Shared gating for the cinematic intro — used by both the site chrome
   (to hold reveal animations until the intro hands over) and the homepage
   (to decide whether to load the intro chunk at all).

   The cinematic plays on reloads and fresh entries to the homepage; moving
   around inside the site (or returning via back/forward) must NOT replay it.
   prefers-reduced-motion always opts out. `#intro` always forces a replay.

   NOTE: index.html's inline boot script mirrors this logic — keep in sync. */

export function introPending(): boolean {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (location.hash === '#intro') return true;
    const nav = (performance.getEntriesByType?.('navigation') ?? [])[0] as
      | PerformanceNavigationTiming
      | undefined;
    const type = nav?.type ?? 'navigate';
    if (type === 'back_forward') return false;
    if (type !== 'reload' && document.referrer) {
      try {
        // arriving from another page of this site — don't replay
        if (new URL(document.referrer).origin === location.origin) return false;
      } catch {
        /* malformed referrer — treat as external */
      }
    }
    return true;
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
