/* Torii brand mark (ported from the brand system) */
export function toriiSVG(size: number, ink = '#1C1917', terra = '#B85C38'): string {
  return `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <rect x="13" y="18" width="4.5" height="34" rx="2.25" fill="${ink}"/>
    <rect x="42.5" y="18" width="4.5" height="34" rx="2.25" fill="${ink}"/>
    <rect x="9" y="12" width="42" height="5" rx="2.5" fill="${ink}"/>
    <rect x="7" y="14.5" width="5" height="3.5" rx="1.75" fill="${ink}"/>
    <rect x="48" y="14.5" width="5" height="3.5" rx="1.75" fill="${ink}"/>
    <circle cx="30" cy="41" r="3.5" fill="${terra}"/>
    <rect x="15.25" y="51" width="29.5" height="1.25" rx="0.625" fill="${ink}" opacity="0.2"/>
  </svg>`;
}
