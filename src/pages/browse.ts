import '../site';
import { ACTIVITIES, CATEGORIES, activityCard } from '../data/activities';

const grid = document.getElementById('grid')!;
const empty = document.getElementById('empty') as HTMLElement;
let activeCat = 'All';
let sort = 'soon';
let q = '';

document.getElementById('liveCount')!.textContent = String(ACTIVITIES.length);

// chips
const chipWrap = document.getElementById('chips')!;
CATEGORIES.forEach((c) => {
  const b = document.createElement('button');
  b.className = 'chip' + (c === 'All' ? ' active' : '');
  b.textContent = c;
  b.dataset.cat = c;
  b.onclick = () => {
    activeCat = c;
    [...chipWrap.children].forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    render();
  };
  chipWrap.appendChild(b);
});

// sort
const sortSeg = document.getElementById('sortSeg')!;
sortSeg.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.seg-btn');
  if (!b) return;
  sortSeg.querySelectorAll('.seg-btn').forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
  sort = b.dataset.sort ?? 'soon';
  render();
});

const search = document.getElementById('search') as HTMLInputElement;
search.addEventListener('input', () => {
  q = search.value.toLowerCase().trim();
  render();
});

function clearFilters(): void {
  activeCat = 'All';
  q = '';
  search.value = '';
  [...chipWrap.children].forEach((x) => x.classList.toggle('active', (x as HTMLElement).dataset.cat === 'All'));
  render();
}
document.getElementById('clearBtn')!.addEventListener('click', clearFilters);

function dayWeight(w: string): number {
  const order = ['Tonight', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const i = order.indexOf(w.split(' ')[0]);
  return i < 0 ? 99 : i;
}

function render(): void {
  const list = ACTIVITIES.filter((a) => {
    const catOk = activeCat === 'All' || a.cat === activeCat;
    const qOk = !q || (a.title + ' ' + a.host + ' ' + a.area + ' ' + a.cat).toLowerCase().includes(q);
    return catOk && qOk;
  });
  if (sort === 'rated') list.sort((a, b) => b.rating - a.rating);
  else if (sort === 'popular') list.sort((a, b) => b.reviews - a.reviews);
  else list.sort((a, b) => dayWeight(a.when) - dayWeight(b.when));

  grid.innerHTML = '';
  empty.hidden = list.length > 0;
  list.forEach((a, i) => {
    const el = document.createElement('a');
    el.href = 'activity.html?id=' + a.id;
    el.className = 'acard';
    el.style.animation = `rise .5s ${Math.min(i * 0.04, 0.4)}s var(--ease) both`;
    el.innerHTML = activityCard(a, { blurb: true });
    grid.appendChild(el);
  });
}
render();
