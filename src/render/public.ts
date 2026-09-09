import { store, ui } from '../state';
import { esc, escAttr, money, byId, optById } from '../lib/utils';
import { isWished, toggleWishlist as toggleWishlistStorage, getWishlist, removeFromWishlist } from '../lib/wishlist';
import type { Place } from '../types';

export const PLACES: Place[] = [
  { name: 'Tea Country Estates', elev: '1,900M', desc: 'Walk through misty tea estates.', cls: 'l2' },
  { name: 'Gregory Lake', elev: '1,880M', desc: 'Relax, cycle or enjoy the view.', cls: 'l1' },
  { name: 'Hakgala Gardens', elev: '1,700M', desc: 'Cool mountain gardens and trails.', cls: 'l4' },
  { name: 'Ramboda Falls', elev: '1,050M', desc: 'A scenic waterfall stop.', cls: 'l3' }
];

export function applySettingsToPage(): void {
  document.title = store.settings.site_name + ' — Nuwara Eliya Travel';
  document.querySelectorAll<HTMLElement>('.brand-word').forEach(el => {
    if (el.childNodes[0]) el.childNodes[0].textContent = store.settings.site_name.split(' ')[0] + ' ';
  });
}

export function renderProperties(): void {
  const q = (optById<HTMLInputElement>('searchPlace')?.value ?? '').toLowerCase().trim();
  const filtered = store.properties.filter(p => {
    const matchesCat = ui.stayFilter === 'all' || p.cat === ui.stayFilter;
    const matchesQ = !q || p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });
  const grid = byId('stayGrid');
  grid.innerHTML = filtered.map(p => `
    <article class="card stay">
      <div class="photo ${p.photo}">
        ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}
        <button class="fav-btn ${isWished('stay', p.id) ? 'on' : ''}" onclick="toggleWishlistUI('stay','${p.id}','${escAttr(p.name)}',${p.price},this)">♥</button>
      </div>
      <div class="card-body">
        <div class="row"><h3>${esc(p.name)}</h3><span>★ ${p.rating}</span></div>
        <p>${esc(p.area)}</p>
        <div class="price">${esc(store.settings.currency)} ${money(p.price)} <small>/ night</small></div>
        <button class="small-btn" onclick="bookStay('${p.id}')">Book now</button>
      </div>
    </article>`).join('');
  byId('stayEmpty').hidden = filtered.length !== 0;
}

export function filterStays(cat: string, btn: HTMLElement): void {
  ui.stayFilter = cat;
  document.querySelectorAll('#stayFilterTabs .filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProperties();
}

export function searchStays(): void {
  byId('stays').scrollIntoView({ behavior: 'smooth' });
  renderProperties();
}

export function renderTours(): void {
  const list = store.tours.filter(t => ui.tourFilter === 'all' || String(t.days) === ui.tourFilter);
  byId('tourGrid').innerHTML = list.map(t => `
    <article class="tour">
      <div class="tour-img ${t.photo}">
        <button class="fav-btn ${isWished('tour', t.id) ? 'on' : ''}" onclick="toggleWishlistUI('tour','${t.id}','${escAttr(t.name)}',${t.price},this)">♥</button>
      </div>
      <div>
        <span class="pill">${t.days} DAY${t.days > 1 ? 'S' : ''}</span>
        <h3>${esc(t.name)}</h3><p>${esc(t.description)}</p>
        <div class="tour-bottom">
          <div><b>${esc(store.settings.currency)} ${money(t.price)} <small>/ group</small></b><br><span class="elev-tag">Peak elevation ${esc(t.elevation)}</span></div>
          <button onclick="bookTour('${t.id}')">Choose</button>
        </div>
      </div>
    </article>`).join('');
}

export function filterTours(days: string, btn: HTMLElement): void {
  ui.tourFilter = days;
  document.querySelectorAll('#tourFilterTabs .filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTours();
}

export function renderVehicles(): void {
  byId('vehicleGrid').innerHTML = store.vehicles.map(v => `
    <div class="vehicle">
      <div class="car-icon">${v.icon}</div>
      <div><h3>${esc(v.name)}</h3><p>${esc(v.description)}</p></div>
      <b>From ${esc(store.settings.currency)} ${money(v.price)}/day</b>
      <button class="fav-btn ${isWished('vehicle', v.id) ? 'on' : ''}" style="position:static;width:32px;height:32px;flex-shrink:0" onclick="toggleWishlistUI('vehicle','${v.id}','${escAttr(v.name)}',${v.price},this)">♥</button>
      <button onclick="bookVehicle('${v.id}')">Request</button>
    </div>`).join('');
}

export function renderPlaces(): void {
  const sorted = [...PLACES].sort((a, b) => parseInt(b.elev) - parseInt(a.elev));
  byId('placeGrid').innerHTML = sorted.map(p => `
    <div class="place">
      <div class="place-img ${p.cls}"><span class="elev-tag">${p.elev}</span></div>
      <h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
    </div>`).join('');
}

export function renderReviews(): void {
  const list = store.reviews.slice().reverse();
  const avgNum = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
  const avg = list.length ? avgNum.toFixed(1) : '—';
  byId('reviewSummary').innerHTML = `
    <div class="big-score">${avg}</div>
    <div><div class="stars">${'★'.repeat(Math.round(avgNum))}${'☆'.repeat(5 - Math.round(avgNum))}</div>
    <div class="count">${list.length} traveler review${list.length === 1 ? '' : 's'}</div></div>`;
  byId('reviewGrid').innerHTML = list.slice(0, 6).map(r => `
    <div class="review-card">
      <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <p>"${esc(r.text)}"</p>
      <div class="rv-meta"><span>${esc(r.author)}</span><span>${esc(r.item_name)}</span></div>
    </div>`).join('') || '<p class="empty-note">No reviews yet — be the first to share your trip.</p>';
}

export function renderAllPublicSections(): void {
  applySettingsToPage();
  renderProperties();
  renderTours();
  renderVehicles();
  renderPlaces();
  renderReviews();
  renderWishlistCounts();
}

/* ---------------- WISHLIST (device-local, no login required) ---------------- */
export function toggleWishlistUI(type: 'stay' | 'tour' | 'vehicle', id: string, name: string, price: number, btn?: HTMLElement): void {
  const nowWished = toggleWishlistStorage({ type, id, name, price });
  if (btn) btn.classList.toggle('on', nowWished);
  renderWishlistCounts();
  if (byId('wishlistModal').classList.contains('open')) renderWishlistModal();
}

export function renderWishlistCounts(): void {
  const n = getWishlist().length;
  const a = optById('wishlistCount'); if (a) a.textContent = String(n);
  const b = optById('wishlistCountMobile'); if (b) b.textContent = String(n);
}

export function renderWishlistModal(): void {
  const list = getWishlist();
  byId('wishlistList').innerHTML = list.map(w => `
    <div class="wishlist-item">
      <div><b>${esc(w.name)}</b><span>${esc(store.settings.currency)} ${money(w.price)} • ${w.type}</span></div>
      <button onclick="removeWishlistItem('${w.type}','${w.id}')">Remove</button>
    </div>`).join('') || '<p class="empty-note">Tap the ♥ on any stay, tour or vehicle to save it here.</p>';
}

export function removeWishlistItem(type: 'stay' | 'tour' | 'vehicle', id: string): void {
  removeFromWishlist(type, id);
  renderWishlistCounts();
  renderWishlistModal();
  renderProperties();
  renderTours();
  renderVehicles();
}
