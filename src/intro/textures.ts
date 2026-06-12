import * as THREE from 'three';

export function glowTex(rgb: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},1)`);
  gr.addColorStop(0.4, `rgba(${rgb},.45)`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function petalTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.translate(32, 32);
  g.rotate(0.6);
  const gr = g.createRadialGradient(0, -4, 2, 0, 0, 26);
  gr.addColorStop(0, 'rgba(255,228,236,.95)');
  gr.addColorStop(0.7, 'rgba(242,184,198,.8)');
  gr.addColorStop(1, 'rgba(242,184,198,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.ellipse(0, 0, 13, 22, 0, 0, Math.PI * 2);
  g.fill();
  return new THREE.CanvasTexture(c);
}

export function vigTex(label: string, kanji: string, bg: string, glow: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 340;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 340);
  const rg = g.createRadialGradient(256, 160, 30, 256, 170, 300);
  rg.addColorStop(0, glow);
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 512, 340);
  g.strokeStyle = 'rgba(255,255,255,.035)';
  g.lineWidth = 2;
  for (let x = -340; x < 512; x += 16) {
    g.beginPath();
    g.moveTo(x, 340);
    g.lineTo(x + 340, 0);
    g.stroke();
  }
  g.fillStyle = 'rgba(232,201,185,.16)';
  g.font = '150px "Noto Serif JP", serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(kanji, 256, 162);
  g.font = '15px "JetBrains Mono", monospace';
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.fillStyle = 'rgba(216,174,152,.9)';
  g.fillText(label, 22, 316);
  g.strokeStyle = 'rgba(216,174,152,.3)';
  g.lineWidth = 2;
  g.strokeRect(4, 4, 504, 332);
  return new THREE.CanvasTexture(c);
}

/** Tiny soft-edged white square — a drifting paper fragment. */
export function paperTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  g.translate(16, 16);
  g.rotate(0.4);
  const gr = g.createRadialGradient(0, 0, 2, 0, 0, 15);
  gr.addColorStop(0, 'rgba(252,248,240,.95)');
  gr.addColorStop(0.75, 'rgba(248,242,232,.75)');
  gr.addColorStop(1, 'rgba(248,242,232,0)');
  g.fillStyle = gr;
  g.fillRect(-10, -10, 20, 20);
  return new THREE.CanvasTexture(c);
}

/** Translucent rounded "glass" UI card with placeholder content bars. */
export function panelTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 256;
  const g = c.getContext('2d')!;
  const r = 26;
  g.beginPath();
  g.roundRect(6, 6, 372, 244, r);
  g.fillStyle = 'rgba(255,255,255,.10)';
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,.55)';
  g.lineWidth = 2.5;
  g.stroke();
  // image area + text bars, like a ghost of an activity card
  g.fillStyle = 'rgba(255,255,255,.14)';
  g.beginPath();
  g.roundRect(26, 26, 332, 110, 14);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.34)';
  g.beginPath();
  g.roundRect(26, 156, 220, 16, 8);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.20)';
  g.beginPath();
  g.roundRect(26, 186, 290, 11, 5.5);
  g.fill();
  g.beginPath();
  g.roundRect(26, 208, 160, 11, 5.5);
  g.fill();
  return new THREE.CanvasTexture(c);
}
