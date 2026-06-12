import '../site';

const FAQ: Record<string, Array<[string, string]>> = {
  Travelers: [
    ['Is Yoriai really free?', 'Yes — completely free during launch. We’re focused on building a thriving community in Osaka first. Optional tipping arrives later, and any future premium experiences will always be clearly priced and never required.'],
    ['What kind of activities can I join?', 'Everyday life, not tours: morning market crawls, riverside walks, home cooking, standing-bar hops, sento visits, kintsugi afternoons, language exchanges. If a local in Osaka does it, you can probably join it.'],
    ['Do I need to speak Japanese?', 'No. Most hosts speak some English, and every listing notes the languages spoken. Plenty of activities — walks, food, crafts — barely need words at all.'],
    ['How many people will be there?', 'Small groups by design: 2 to 10 people. It should feel like hanging out, not a guided tour.'],
    ['What if I need to cancel?', 'Cancel anytime from your dashboard with a quick reason. Your host and the other participants are notified automatically. Just give as much notice as you can.'],
  ],
  Hosts: [
    ['How much work is it to host?', 'Under two minutes to post. You’re not designing an experience — you’re sharing something you already do. Tap create, add a title, drop a map pin, set a time, add up to three photos, publish.'],
    ['Do I get paid?', 'Not in Phase 1 — hosting is about cultural exchange and meeting people. Optional tipping comes in Phase 2, and paid premium experiences in Year 2. Founding hosts get first access to all of it.'],
    ['Who can be a host?', 'Anyone who lives in Osaka, loves the city, and enjoys meeting people. No professional guiding experience needed — in fact, we prefer the opposite.'],
    ['Do I have to accept everyone?', 'Never. You review each traveler’s full profile and approve or decline. A decline always asks for a brief reason, kept private.'],
    ['What’s the Founding Host program?', 'The first 50 hosts in Osaka get a permanent Founding Host badge, featured placement at launch, first access to monetization, and a direct line to our team. We onboard you personally.'],
  ],
  Safety: [
    ['How do you keep meetings safe?', 'Verified profiles required to join, mutual host approval, public meeting points only, one-tap report and block, and a moderation team resolving reports in under 24 hours. Safety is built in from day one.'],
    ['What information is verified?', 'A photo, a real bio of at least 200 characters, and a verified email before anyone can participate. Incomplete profiles are blocked.'],
    ['What if someone makes me uncomfortable?', 'Block them in one tap — you become invisible to each other everywhere on Yoriai. Report them with a category, and our team investigates fast. Trust your instincts and leave any time; you owe no explanation.'],
    ['Where do activities take place?', 'Public spaces only. Community guidelines require it, and any listing with a private address is automatically flagged for review.'],
  ],
  Launch: [
    ['When does Yoriai launch?', 'We’re opening Osaka in private beta, inviting the waitlist in batches to keep the community healthy and supply-first. Join the list and we’ll let you in as activities go live around your dates.'],
    ['Why Osaka first?', 'Deep over wide. Osaka is warm, walkable, food-obsessed and endlessly social — the perfect place to prove that everyday connection scales. We saturate one city before opening the next.'],
    ['Is Yoriai only in Japan?', 'For now, entirely. Yoriai is built around Japanese everyday culture and the idea of <em>yori-ai</em> — coming together. We’ll expand city by city across Japan before looking further.'],
    ['How do I get an early invite?', 'Join the waitlist and tell us your travel dates. Hosts and early referrers move up the queue — every member gets an invite link to share.'],
  ],
};

const tabsEl = document.getElementById('faqTabs')!;
const listEl = document.getElementById('faqList')!;
const cats = Object.keys(FAQ);
let active = cats[0];

cats.forEach((c) => {
  const b = document.createElement('button');
  b.className = 'ftab' + (c === active ? ' active' : '');
  b.textContent = c;
  b.onclick = () => {
    active = c;
    [...tabsEl.children].forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    renderList();
  };
  tabsEl.appendChild(b);
});

function renderList(): void {
  listEl.innerHTML = '';
  FAQ[active].forEach((qa, i) => {
    const item = document.createElement('div');
    item.className = 'qa';
    item.style.animation = `rise .45s ${i * 0.05}s var(--ease) both`;
    item.innerHTML = `
      <button class="qa-q" aria-expanded="false">
        <span>${qa[0]}</span>
        <span class="qa-ico" aria-hidden="true">+</span>
      </button>
      <div class="qa-a"><div class="qa-a-inner"><p>${qa[1]}</p></div></div>`;
    const btn = item.querySelector<HTMLButtonElement>('.qa-q')!;
    const ans = item.querySelector<HTMLElement>('.qa-a')!;
    const ico = item.querySelector<HTMLElement>('.qa-ico')!;
    btn.onclick = () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      listEl.querySelectorAll('.qa-q[aria-expanded="true"]').forEach((o) => {
        o.setAttribute('aria-expanded', 'false');
        o.querySelector('.qa-ico')!.textContent = '+';
        o.nextElementSibling!.classList.remove('open');
      });
      if (!open) {
        btn.setAttribute('aria-expanded', 'true');
        ico.textContent = '–';
        ans.classList.add('open');
      }
    };
    listEl.appendChild(item);
  });
}
renderList();
