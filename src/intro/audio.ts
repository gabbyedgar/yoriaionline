/* Generative soundscape for the intro: filtered wind, a low drone, temple bells. */

export interface IntroAudio {
  bell(): void;
  end(): void;
}

export function createAudio(): IntroAudio | null {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // wind — brownian noise through a lowpass
  const len = 4 * ctx.sampleRate;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  lp.Q.value = 0.5;
  const wg = ctx.createGain();
  wg.gain.value = 0.55;
  src.connect(lp);
  lp.connect(wg);
  wg.connect(master);
  src.start();

  // beating drone
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const pg = ctx.createGain();
  o1.frequency.value = 82.4;
  o2.frequency.value = 82.95;
  pg.gain.value = 0.045;
  o1.connect(pg);
  o2.connect(pg);
  pg.connect(master);
  o1.start();
  o2.start();

  function bell(): void {
    const t = ctx.currentTime;
    const f = [220, 261.6, 293.7, 329.6, 392][Math.floor(Math.random() * 5)];
    ([[1, 0.16], [2.76, 0.05], [5.4, 0.02]] as const).forEach(([m, a]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f * m;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(a, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 4.2);
    });
  }

  master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3);
  return {
    bell,
    end() {
      try {
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
        setTimeout(() => ctx.close().catch(() => {}), 2200);
      } catch {
        /* already closed */
      }
    },
  };
}
