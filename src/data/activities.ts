/* Yoriai — sample Osaka activities (shared by home feed, browse, detail) */

export type Tint = 't-terra' | 't-matcha' | 't-dusk' | 't-stone';
export type AvatarTone = '' | 'matcha' | 'dusk' | 'stone';

export interface Activity {
  id: string;
  title: string;
  cat: string;
  tint: Tint;
  host: string;
  hostAv: string;
  hostTone: AvatarTone;
  area: string;
  when: string;
  dur: string;
  rating: number;
  reviews: number;
  seats: number;
  cap: number;
  price: string;
  tag: string;
  ph: string;
  blurb: string;
}

export const CATEGORIES = [
  'All',
  'Food & Drink',
  'Walks',
  'Outdoors',
  'Culture',
  'Craft',
  'Nightlife',
  'Community',
] as const;

export const ACTIVITIES: Activity[] = [
  { id: 'kuromon', title: 'Breakfast crawl through Kuromon Market', cat: 'Food & Drink', tint: 't-terra',
    host: 'Haruka', hostAv: 'H', hostTone: '', area: 'Chuo · Nipponbashi', when: 'Tomorrow · 8:00', dur: '2 hr',
    rating: 4.9, reviews: 38, seats: 4, cap: 6, price: 'Free', tag: 'Soon',
    ph: 'kuromon market · uni & tamago', blurb: 'I do my weekly shopping here. Come taste-test your way through — grilled scallops, fresh uni, tamago on a stick.' },
  { id: 'nakanoshima', title: 'Slow morning walk along Nakanoshima', cat: 'Walks', tint: 't-matcha',
    host: 'Kenji', hostAv: 'K', hostTone: 'matcha', area: 'Kita · Nakanoshima', when: 'Sat · 7:00', dur: '90 min',
    rating: 4.8, reviews: 24, seats: 5, cap: 8, price: 'Free', tag: 'Weekend',
    ph: 'river island · rose garden', blurb: 'My everyday jog route between the rivers. We walk slow, watch the city wake up, and end with a vending-machine coffee.' },
  { id: 'okonomiyaki', title: 'Cook okonomiyaki at my apartment', cat: 'Food & Drink', tint: 't-terra',
    host: 'Yuki', hostAv: 'Y', hostTone: '', area: 'Naniwa · Shinsekai', when: 'Fri · 18:30', dur: '2.5 hr',
    rating: 5.0, reviews: 51, seats: 2, cap: 5, price: 'Free', tag: 'Almost full',
    ph: 'home kitchen · the flip', blurb: 'Osaka soul food, made on my own teppan. You flip your own — it counts even if it falls apart.' },
  { id: 'tachinomi', title: 'Standing-bar hop in Tenma', cat: 'Nightlife', tint: 't-stone',
    host: 'Sora', hostAv: 'S', hostTone: 'stone', area: 'Kita · Tenma', when: 'Fri · 20:00', dur: '3 hr',
    rating: 4.7, reviews: 29, seats: 3, cap: 6, price: 'Free', tag: 'Soon',
    ph: 'tachinomi alley · lanterns', blurb: 'Three tiny standing bars, one alley, zero tourists. We drink where the salarymen drink.' },
  { id: 'sento', title: 'First-timer’s guide to a neighborhood sento', cat: 'Culture', tint: 't-dusk',
    host: 'Aiko', hostAv: 'A', hostTone: 'dusk', area: 'Abeno', when: 'Sun · 16:00', dur: '90 min',
    rating: 4.9, reviews: 18, seats: 4, cap: 5, price: 'Free', tag: 'Weekend',
    ph: 'sento mural · mt. fuji tiles', blurb: 'I’ll walk you through the etiquette so you can relax, not stress. The best bath in my neighborhood, 470 yen.' },
  { id: 'kissaten', title: 'Kissaten & vinyl afternoon in Shinsaibashi', cat: 'Culture', tint: 't-stone',
    host: 'Ren', hostAv: 'R', hostTone: 'stone', area: 'Chuo · Shinsaibashi', when: 'Sat · 14:00', dur: '2 hr',
    rating: 4.8, reviews: 33, seats: 3, cap: 4, price: 'Free', tag: 'Weekend',
    ph: 'retro kissaten · cream soda', blurb: 'Old-Showa coffee shops and a record store I’ve dug through for ten years. Bring ears, leave with a 7-inch.' },
  { id: 'yodogawa', title: 'Sunset cycle along the Yodo River', cat: 'Outdoors', tint: 't-matcha',
    host: 'Daiki', hostAv: 'D', hostTone: 'matcha', area: 'Yodogawa', when: 'Wed · 17:00', dur: '2 hr',
    rating: 4.9, reviews: 21, seats: 6, cap: 8, price: 'Free', tag: 'Popular',
    ph: 'riverbank path · golden hour', blurb: 'Borrow a mamachari, ride the embankment as the sky goes orange. We stop where the baseball kids practice.' },
  { id: 'minoo', title: 'Minoo Falls forest hike & momiji tempura', cat: 'Outdoors', tint: 't-matcha',
    host: 'Mei', hostAv: 'M', hostTone: 'matcha', area: 'Minoo', when: 'Sun · 9:00', dur: '4 hr',
    rating: 5.0, reviews: 14, seats: 5, cap: 8, price: 'Free', tag: 'Weekend',
    ph: 'forest trail · waterfall', blurb: 'An easy mountain trail 30 min from the city. We finish with fried maple leaves — yes, you eat the leaves.' },
  { id: 'tenjinbashi', title: 'Language-exchange coffee, Tenjinbashi', cat: 'Community', tint: 't-dusk',
    host: 'Nao', hostAv: 'N', hostTone: 'dusk', area: 'Kita · Tenjinbashi', when: 'Thu · 19:00', dur: '90 min',
    rating: 4.7, reviews: 42, seats: 4, cap: 8, price: 'Free', tag: 'Weekly',
    ph: 'corner cafe · long table', blurb: 'Half Japanese, half English, all low-pressure. I host this every Thursday — regulars and first-timers both welcome.' },
  { id: 'kintsugi', title: 'Kintsugi: mend a bowl the old way', cat: 'Craft', tint: 't-terra',
    host: 'Yumiko', hostAv: 'Y', hostTone: '', area: 'Tennoji', when: 'Sat · 13:00', dur: '2.5 hr',
    rating: 5.0, reviews: 11, seats: 2, cap: 4, price: 'Free', tag: 'Almost full',
    ph: 'broken bowl · gold seams', blurb: 'Repair a cracked cup with lacquer and gold. The flaw becomes the most beautiful part — that’s the whole idea.' },
  { id: 'ramen', title: 'Late-night ramen alley walk, Namba', cat: 'Food & Drink', tint: 't-stone',
    host: 'Tomo', hostAv: 'T', hostTone: 'stone', area: 'Chuo · Namba', when: 'Fri · 22:30', dur: '90 min',
    rating: 4.8, reviews: 27, seats: 4, cap: 6, price: 'Free', tag: 'Night',
    ph: 'neon alley · steam & broth', blurb: 'After the bars, before the trains — the bowl that tastes best at midnight. I know which counter.' },
  { id: 'castle', title: 'Osaka Castle Park morning tai-chi & tea', cat: 'Walks', tint: 't-matcha',
    host: 'Hiro', hostAv: 'H', hostTone: 'matcha', area: 'Chuo · Osakajo', when: 'Sun · 7:30', dur: '2 hr',
    rating: 4.6, reviews: 16, seats: 7, cap: 10, price: 'Free', tag: 'Weekend',
    ph: 'castle moat · plum blossom', blurb: 'The retirees do tai-chi by the moat every morning. We join in, badly, then drink tea from a thermos.' },
];

export function findActivity(id: string | null): Activity {
  return ACTIVITIES.find((a) => a.id === id) ?? ACTIVITIES[0];
}

/** Card markup shared by the home feed, browse grid and "more this week". */
export function activityCard(a: Activity, opts: { blurb?: boolean; extraClass?: string } = {}): string {
  const seatsColor = a.seats <= 2 ? 'var(--terra-deep)' : 'var(--muted)';
  return `
    <div class="ph ${a.tint} acard-img"><span class="ph-lab">${a.ph}</span>
      <span class="acard-badge">${a.tag}</span></div>
    <div class="acard-body">
      <div class="acard-meta mono">${a.area} · ${a.when}${opts.blurb ? ' · ' + a.dur : ''}</div>
      <h3 class="acard-title">${a.title}</h3>
      ${opts.blurb ? `<p class="acard-blurb">${a.blurb}</p>` : ''}
      <div class="acard-foot">
        <span class="acard-host"><span class="av ${a.hostTone}" style="width:26px;height:26px;font-size:12px">${a.hostAv}</span>${a.host}</span>
        <span class="acard-rate"><span class="stars">★</span> ${a.rating} · <span style="color:${seatsColor}">${a.seats} left</span></span>
      </div>
    </div>`;
}
