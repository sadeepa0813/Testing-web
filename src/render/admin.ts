import { store, ui } from '../state';
import { esc, money, byId, optById, toast } from '../lib/utils';
import * as api from '../lib/api';
import type { Booking, ItemType, Property, Vehicle, Tour } from '../types';
import { renderProperties, renderTours, renderVehicles } from './public';

/* ================= AUTH ================= */
export function quickFillAdmin(role: 'super' | 'staff'): void {
  const acc = role === 'staff'
    ? { email: 'staff@aroviayathra.demo' }
    : { email: 'admin@aroviayathra.demo' };
  (byId('adminEmail') as HTMLInputElement).value = acc.email;
}

export async function adminLogin(e: Event): Promise<void> {
  e.preventDefault();
  const email = (byId('adminEmail') as HTMLInputElement).value.trim().toLowerCase();
  const pass = (byId('adminPass') as HTMLInputElement).value;
  try {
    const profile = await api.adminSignIn(email, pass);
    ui.currentAdmin = profile;
    const { closeModal } = await import('./booking');
    closeModal('adminLoginModal');
    (e.target as HTMLFormElement).reset();

    byId('adminNameLabel').textContent = profile.name;
    byId('adminRoleLabel').textContent = profile.role;
    byId('adminAvatar').textContent = profile.avatar;
    byId('adminProfileBtn').textContent = profile.avatar;
    const adminApp = byId('adminApp');
    adminApp.classList.add('open');
    adminApp.classList.toggle('staff-mode', profile.role === 'Staff');
    document.body.style.overflow = 'hidden';

    // Bookings/reviews are RLS-gated to admins, so refetch now that we're signed in.
    const fresh = await api.fetchAll();
    store.bookings = fresh.bookings;
    store.reviews = fresh.reviews;

    renderAdminAll();
    toast(`Welcome, ${profile.name} (${profile.role})`);
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Incorrect credentials.');
  }
}

export async function logoutAdmin(): Promise<void> {
  await api.adminSignOut();
  ui.currentAdmin = null;
  byId('adminApp').classList.remove('open');
  document.body.style.overflow = '';
}

export function toggleAdminSide(): void {
  document.querySelector('.admin-sidebar')?.classList.toggle('open');
}

/* ================= TABS ================= */
export function adminTab(name: string, btn?: HTMLElement): void {
  document.querySelectorAll('.admin-nav button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll<HTMLElement>('.admin-panel').forEach(p => (p.hidden = true));
  byId('panel-' + name).hidden = false;
  byId('adminPageTitle').textContent = name;
  (byId('adminGlobalSearch') as HTMLInputElement).value = '';

  if (name === 'Overview') renderAdminOverview();
  if (name === 'Bookings') renderAllBookings();
  if (name === 'Properties') renderAdminGrid('property');
  if (name === 'Vehicles') renderAdminGrid('vehicle');
  if (name === 'Tours') renderAdminGrid('tour');
  if (name === 'Reviews') renderAdminReviews();
  if (name === 'Customers') renderCustomers();
  if (name === 'Settings') fillSettingsForm();
}

export function refreshAdminIfOpen(): void {
  if (byId('adminApp').classList.contains('open')) renderAdminAll();
}

export function renderAdminAll(): void {
  byId('navBookingCount').textContent = String(store.bookings.length);
  renderNotifPanel();
  const active = document.querySelector('.admin-nav button.active');
  const name = active?.querySelector('span')?.textContent ?? 'Overview';
  renderAdminOverview();
  if (name === 'Bookings') renderAllBookings();
  if (name === 'Properties') renderAdminGrid('property');
  if (name === 'Vehicles') renderAdminGrid('vehicle');
  if (name === 'Tours') renderAdminGrid('tour');
  if (name === 'Reviews') renderAdminReviews();
  if (name === 'Customers') renderCustomers();
}

/* ================= NOTIFICATIONS ================= */
function renderNotifPanel(): void {
  const bookings = store.bookings.filter(b => b.status === 'Pending').slice().reverse();
  byId('notifCount').textContent = String(bookings.length);
  byId('notifPanel').innerHTML = bookings.length
    ? bookings.slice(0, 8).map(b => `
        <div class="notif-item">
          <b>New request — ${esc(b.item_name)}</b>
          <small>${esc(b.customer)} • ${b.date || b.created_at}</small>
        </div>`).join('')
    : '<div class="notif-item"><small>No pending requests right now.</small></div>';
}
export function toggleNotifPanel(): void {
  const p = byId('notifPanel');
  p.hidden = !p.hidden;
}

/* ================= GLOBAL SEARCH ================= */
export function globalAdminSearch(q: string): void {
  q = q.trim().toLowerCase();
  if (!q) {
    byId('panel-Search').hidden = true;
    (document.querySelector('.admin-nav button.active') as HTMLElement)?.click();
    return;
  }
  document.querySelectorAll<HTMLElement>('.admin-panel').forEach(p => (p.hidden = true));
  byId('panel-Search').hidden = false;
  byId('adminPageTitle').textContent = 'Search';
  byId('searchQueryLabel').textContent = q;

  const hits: { cat: string; title: string; sub: string; go: string }[] = [];
  store.bookings.forEach(b => {
    if ((b.customer || '').toLowerCase().includes(q) || (b.item_name || '').toLowerCase().includes(q) || (b.phone || '').includes(q))
      hits.push({ cat: 'Booking', title: `${b.item_name} — ${b.customer}`, sub: `${b.status} • ${b.date || b.created_at}`, go: 'Bookings' });
  });
  store.properties.forEach(p => { if (p.name.toLowerCase().includes(q)) hits.push({ cat: 'Property', title: p.name, sub: p.area, go: 'Properties' }); });
  store.vehicles.forEach(v => { if (v.name.toLowerCase().includes(q)) hits.push({ cat: 'Vehicle', title: v.name, sub: v.description, go: 'Vehicles' }); });
  store.tours.forEach(t => { if (t.name.toLowerCase().includes(q)) hits.push({ cat: 'Tour', title: t.name, sub: t.description, go: 'Tours' }); });

  const custMap = new Map<string, string>();
  store.bookings.forEach(b => { if (b.phone) custMap.set(b.phone, b.customer); });
  custMap.forEach((name, phone) => {
    if (name.toLowerCase().includes(q) || phone.includes(q)) hits.push({ cat: 'Customer', title: name, sub: phone, go: 'Customers' });
  });

  byId('searchResultsList').innerHTML = hits.length
    ? hits.map(h => `
        <div class="search-hit" onclick="jumpToTab('${h.go}')">
          <div><span class="search-cat">${h.cat}</span><br>${esc(h.title)}<small>${esc(h.sub || '')}</small></div>
          <span>→</span>
        </div>`).join('')
    : '<p class="empty-note">No matches found.</p>';
}
export function jumpToTab(name: string): void {
  (byId('adminGlobalSearch') as HTMLInputElement).value = '';
  const btn = [...document.querySelectorAll<HTMLElement>('.admin-nav button')].find(b => b.querySelector('span')?.textContent === name);
  if (btn) adminTab(name, btn);
}

/* ================= CSV EXPORT ================= */
function downloadCSV(filename: string, rows: (string | number)[][]): void {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('CSV downloaded');
}
export function exportBookingsCSV(): void {
  const rows: (string | number)[][] = [['ID', 'Type', 'Item', 'Customer', 'Phone', 'Date', 'Guests', 'Price', 'Status', 'Created']];
  store.bookings.forEach(b => rows.push([b.id, b.type, b.item_name, b.customer, b.phone, b.date, b.guests, b.price, b.status, b.created_at]));
  downloadCSV('arovia-bookings.csv', rows);
}
export function exportCustomersCSV(): void {
  const map = new Map<string, { name: string; phone: string; count: number; spend: number }>();
  store.bookings.forEach(b => {
    if (!b.phone) return;
    const c = map.get(b.phone) ?? { name: b.customer, phone: b.phone, count: 0, spend: 0 };
    c.count++;
    if (b.status !== 'Cancelled') c.spend += b.price;
    map.set(b.phone, c);
  });
  const rows: (string | number)[][] = [['Customer', 'Phone', 'Bookings', 'Total spend']];
  map.forEach(c => rows.push([c.name, c.phone, c.count, c.spend]));
  downloadCSV('arovia-customers.csv', rows);
}

/* ================= OVERVIEW ================= */
function avgRating(): string {
  if (!store.reviews.length) return '—';
  return (store.reviews.reduce((s, r) => s + r.rating, 0) / store.reviews.length).toFixed(1);
}

function bookingRows(list: Booking[], withActions: boolean): string {
  if (!list.length) return '<p class="empty-note">No bookings yet.</p>';
  return `<div class="table-row table-head"><span>Customer</span><span>Service</span><span>Date</span><span>Status</span>${withActions ? '<span>Actions</span>' : ''}</div>` +
    list.map(b => `
      <div class="table-row">
        <span><b>${esc(b.customer)}</b><small>${esc(b.phone)}</small></span>
        <span>${esc(b.item_name)}</span>
        <span>${b.date || b.created_at || '—'}</span>
        <em class="${b.status.toLowerCase()}">${b.status}</em>
        ${withActions ? `<div class="row-actions">
            ${b.status !== 'Confirmed' ? `<button class="confirm-a" onclick="setBookingStatus('${b.id}','Confirmed')">Confirm</button>` : ''}
            ${b.status !== 'Cancelled' ? `<button class="cancel-a" onclick="setBookingStatus('${b.id}','Cancelled')">Cancel</button>` : ''}
            <button onclick="deleteBookingUI('${b.id}')">Delete</button>
          </div>` : ''}
      </div>`).join('');
}

function renderAdminOverview(): void {
  byId('adminDateLine').textContent =
    new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  const revenue = store.bookings.filter(b => b.status !== 'Cancelled').reduce((s, b) => s + b.price, 0);
  const custCount = new Set(store.bookings.map(b => b.phone)).size;

  byId('statsRow').innerHTML = `
    <div class="stat"><small>Total bookings</small><strong>${store.bookings.length}</strong><span class="up">↑ live</span><p>all time</p></div>
    <div class="stat"><small>Revenue</small><strong>${esc(store.settings.currency)} ${money(revenue)}</strong><span class="up">confirmed + pending</span><p>excludes cancelled</p></div>
    <div class="stat"><small>Properties</small><strong>${store.properties.length}</strong><span class="neutral">${store.vehicles.length} vehicles</span><p>active partners</p></div>
    <div class="stat"><small>Customers</small><strong>${custCount}</strong><span class="up">${store.reviews.length} reviews</span><p>unique phone numbers</p></div>`;

  byId('recentBookingsTable').innerHTML = bookingRows(store.bookings.slice(-3).reverse(), false);

  drawRevenueChart(store.bookings);
  drawStatusDonut(store.bookings);

  byId('activityGrid').innerHTML = `
    <div>🏠<b>${store.properties.length}</b><small>Properties</small></div>
    <div>🚐<b>${store.vehicles.length}</b><small>Vehicles</small></div>
    <div>🧭<b>${store.tours.length}</b><small>Tour packages</small></div>
    <div>⭐<b>${avgRating()}</b><small>Average rating</small></div>`;
}

/* ================= BOOKINGS TAB ================= */
function renderAllBookings(): void {
  const list = store.bookings.slice().reverse().filter(b => ui.bookingStatusFilter === 'all' || b.status === ui.bookingStatusFilter);
  byId('allBookingsTable').innerHTML = bookingRows(list, true);
}
export function filterBookings(status: string, btn: HTMLElement): void {
  ui.bookingStatusFilter = status;
  document.querySelectorAll('#bookingStatusFilter .filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAllBookings();
}
export async function setBookingStatus(id: string, status: Booking['status']): Promise<void> {
  try {
    await api.updateBookingStatus(id, status);
    const b = store.bookings.find(x => x.id === id);
    if (b) b.status = status;
    toast('Booking marked ' + status);
    renderAdminAll();
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Could not update the booking.');
  }
}
export async function deleteBookingUI(id: string): Promise<void> {
  if (!confirm('Delete this booking?')) return;
  try {
    await api.deleteBooking(id);
    store.bookings = store.bookings.filter(b => b.id !== id);
    toast('Booking deleted');
    renderAdminAll();
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Could not delete the booking.');
  }
}

/* ================= CHARTS (canvas, no libraries) ================= */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  if (h <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath(); ctx.fill();
}

function drawRevenueChart(bookings: Booking[]): void {
  const canvas = optById<HTMLCanvasElement>('revenueChart');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const values = days.map(d => {
    const key = d.toISOString().slice(0, 10);
    return bookings.filter(b => b.created_at.slice(0, 10) === key && b.status !== 'Cancelled').reduce((s, b) => s + b.price, 0);
  });
  const max = Math.max(...values, 1);
  const w = canvas.width, h = canvas.height, pad = 28, gap = (w - pad * 2) / values.length;
  const barW = gap * 0.6;

  ctx.strokeStyle = '#D3CDB6'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, h - 30); ctx.lineTo(w - 10, h - 30); ctx.stroke();

  values.forEach((v, i) => {
    const barH = (v / max) * (h - 60);
    const x = pad + i * gap + (gap - barW) / 2;
    const y = h - 30 - barH;
    const grad = ctx.createLinearGradient(0, y, 0, h - 30);
    grad.addColorStop(0, '#B8863B'); grad.addColorStop(1, '#2F4A3C');
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, barH, 4);
    ctx.fillStyle = '#4B5C50'; ctx.font = '10px Work Sans'; ctx.textAlign = 'center';
    ctx.fillText(days[i].toLocaleDateString('en-GB', { weekday: 'short' }), x + barW / 2, h - 14);
  });
}

function drawStatusDonut(bookings: Booking[]): void {
  const canvas = optById<HTMLCanvasElement>('statusDonut');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const counts: Record<string, number> = { Confirmed: 0, Pending: 0, Cancelled: 0 };
  bookings.forEach(b => { counts[b.status] = (counts[b.status] ?? 0) + 1; });
  const colors: Record<string, string> = { Confirmed: '#3F7A5C', Pending: '#B8863B', Cancelled: '#B3543F' };
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const cx = canvas.width / 2, cy = canvas.height / 2, r = 78, rInner = 46;
  let start = -Math.PI / 2;
  Object.entries(counts).forEach(([k, v]) => {
    const angle = (v / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + angle); ctx.closePath();
    ctx.fillStyle = colors[k]; ctx.fill();
    start += angle;
  });
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(cx, cy, rInner, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#1E2A22'; ctx.font = '600 16px "IBM Plex Mono"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(total), cx, cy);

  byId('donutLegend').innerHTML = Object.entries(counts).map(([k, v]) => `<div><i style="background:${colors[k]}"></i>${k} — ${v}</div>`).join('');
}

/* ================= PROPERTIES / VEHICLES / TOURS CRUD ================= */
type FieldType = 'text' | 'number' | 'select';
interface FieldMeta { k: string; label: string; type: FieldType; options?: string[]; step?: string; min?: string; max?: string }

const TYPE_META: Record<ItemType, { label: string; fields: FieldMeta[] }> = {
  property: {
    label: 'property', fields: [
      { k: 'name', label: 'Name', type: 'text' },
      { k: 'area', label: 'Description / area', type: 'text' },
      { k: 'price', label: 'Price per night (Rs.)', type: 'number' },
      { k: 'rating', label: 'Rating', type: 'number', step: '0.1', min: '1', max: '5' },
      { k: 'tag', label: 'Tag (optional)', type: 'text' },
      { k: 'cat', label: 'Category', type: 'select', options: ['hill', 'lake', 'estate'] },
      { k: 'photo', label: 'Photo style', type: 'select', options: ['p1', 'p2', 'p3'] }
    ]
  },
  vehicle: {
    label: 'vehicle', fields: [
      { k: 'name', label: 'Vehicle name', type: 'text' },
      { k: 'description', label: 'Description', type: 'text' },
      { k: 'price', label: 'Price per day (Rs.)', type: 'number' },
      { k: 'icon', label: 'Icon (emoji)', type: 'text' }
    ]
  },
  tour: {
    label: 'tour package', fields: [
      { k: 'name', label: 'Tour name', type: 'text' },
      { k: 'description', label: 'Description', type: 'text' },
      { k: 'days', label: 'Duration (days)', type: 'select', options: ['1', '2', '3'] },
      { k: 'price', label: 'Price per group (Rs.)', type: 'number' },
      { k: 'elevation', label: 'Peak elevation (e.g. 2,524M)', type: 'text' },
      { k: 'photo', label: 'Photo style', type: 'select', options: ['t1', 't2'] }
    ]
  }
};

function listFor(type: ItemType): (Property | Vehicle | Tour)[] {
  return type === 'property' ? store.properties : type === 'vehicle' ? store.vehicles : store.tours;
}
const GRID_ID: Record<ItemType, string> = { property: 'adminPropertyGrid', vehicle: 'adminVehicleGrid', tour: 'adminTourGrid' };

function renderAdminGrid(type: ItemType): void {
  const list = listFor(type);
  byId(GRID_ID[type]).innerHTML = list.map((item, i) => `
    <div class="admin-item-card" draggable="true" data-index="${i}"
         ondragstart="dragStart(event,'${type}',${i})" ondragover="dragOverItem(event)"
         ondrop="dropItem(event,'${type}',${i})" ondragend="dragEndItem(event)" ondragleave="event.currentTarget.classList.remove('drag-over')">
      <div class="drag-handle">⠿ DRAG TO REORDER</div>
      <h3>${esc(item.name)}</h3>
      <p>${esc((item as Property).area || (item as Vehicle | Tour).description || '')}</p>
      <div class="price">${esc(store.settings.currency)} ${money(item.price || 0)}</div>
      <div class="item-actions">
        <button class="edit-a" onclick="openItemForm('${type}','${item.id}')">Edit</button>
        <button class="del-a" onclick="deleteItemUI('${type}','${item.id}')">Delete</button>
      </div>
    </div>`).join('') || '<p class="empty-note">Nothing here yet — add one above.</p>';
}

export function dragStart(e: DragEvent, type: ItemType, index: number): void {
  ui.dragCtx = { type, index };
  (e.currentTarget as HTMLElement).classList.add('dragging');
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
}
export function dragOverItem(e: DragEvent): void {
  e.preventDefault();
  (e.currentTarget as HTMLElement).classList.add('drag-over');
}
export function dragEndItem(e: DragEvent): void {
  (e.currentTarget as HTMLElement).classList.remove('dragging');
  document.querySelectorAll('.admin-item-card').forEach(c => c.classList.remove('drag-over'));
}
export async function dropItem(e: DragEvent, type: ItemType, dropIndex: number): Promise<void> {
  e.preventDefault();
  (e.currentTarget as HTMLElement).classList.remove('drag-over');
  if (!ui.dragCtx || ui.dragCtx.type !== type || ui.dragCtx.index === dropIndex) return;
  const list = listFor(type);
  const [moved] = list.splice(ui.dragCtx.index, 1);
  list.splice(dropIndex, 0, moved);
  renderAdminGrid(type);
  renderProperties(); renderTours(); renderVehicles();
  ui.dragCtx = null;
  try {
    const table = type === 'property' ? 'properties' : type === 'vehicle' ? 'vehicles' : 'tours';
    await api.reorder(table, list.map(x => x.id));
    toast('Order updated');
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Could not save the new order.');
  }
}

export function openItemForm(type: ItemType, id?: string): void {
  const meta = TYPE_META[type];
  const list = listFor(type);
  const item = id ? list.find(x => x.id === id) : null;
  byId('itemFormEyebrow').textContent = (item ? 'EDIT ' : 'ADD ') + meta.label.toUpperCase();
  byId('itemFormTitle').textContent = (item ? 'Edit ' : 'Add ') + meta.label;

  const form = byId<HTMLFormElement>('itemForm');
  form.innerHTML = meta.fields.map(f => {
    const val = item ? ((item as unknown as Record<string, unknown>)[f.k] ?? '') : '';
    if (f.type === 'select') {
      return `<label style="font-size:.78rem;font-weight:600;color:var(--ink-soft)">${f.label}
        <select name="${f.k}" required>${(f.options ?? []).map(o => `<option ${String(val) === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
    }
    return `<label style="font-size:.78rem;font-weight:600;color:var(--ink-soft)">${f.label}
      <input name="${f.k}" type="${f.type}" ${f.step ? `step="${f.step}"` : ''} ${f.min ? `min="${f.min}"` : ''} value="${esc(String(val))}" required></label>`;
  }).join('') + `<input type="hidden" name="__type" value="${type}"><input type="hidden" name="__id" value="${id ?? ''}">
    <button class="btn" type="submit">${item ? 'Save changes' : 'Add ' + meta.label}</button>`;

  import('./booking').then(m => m.openModal('itemFormModal'));
}

export async function saveItemForm(e: Event): Promise<void> {
  e.preventDefault();
  const fd = new FormData(e.target as HTMLFormElement);
  const type = fd.get('__type') as ItemType;
  const id = fd.get('__id') as string;
  const meta = TYPE_META[type];

  const record: Record<string, unknown> = {};
  meta.fields.forEach(f => {
    let v: unknown = fd.get(f.k);
    if (f.type === 'number') v = parseFloat(v as string) || 0;
    if (f.k === 'days') v = parseInt(v as string, 10) || 1;
    record[f.k] = v;
  });

  try {
    const { closeModal } = await import('./booking');
    if (id) {
      const list = listFor(type);
      const idx = list.findIndex(x => x.id === id);
      let updated: Property | Vehicle | Tour;
      if (type === 'property') updated = await api.updateProperty(id, record as Partial<Property>);
      else if (type === 'vehicle') updated = await api.updateVehicle(id, record as Partial<Vehicle>);
      else updated = await api.updateTour(id, record as Partial<Tour>);
      if (idx > -1) list[idx] = updated as never;
      toast('Changes saved');
    } else {
      const sortOrder = listFor(type).length;
      if (type === 'property') store.properties.push(await api.insertProperty({ ...(record as Omit<Property, 'id' | 'sort_order'>), sort_order: sortOrder }));
      else if (type === 'vehicle') store.vehicles.push(await api.insertVehicle({ ...(record as Omit<Vehicle, 'id' | 'sort_order'>), sort_order: sortOrder }));
      else store.tours.push(await api.insertTour({ ...(record as Omit<Tour, 'id' | 'sort_order'>), sort_order: sortOrder }));
      toast('Added successfully');
    }
    closeModal('itemFormModal');
    renderAdminGrid(type);
    renderProperties(); renderTours(); renderVehicles();
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Could not save. Please try again.');
  }
}

export async function deleteItemUI(type: ItemType, id: string): Promise<void> {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  try {
    if (type === 'property') { await api.deleteProperty(id); store.properties = store.properties.filter(x => x.id !== id); }
    else if (type === 'vehicle') { await api.deleteVehicle(id); store.vehicles = store.vehicles.filter(x => x.id !== id); }
    else { await api.deleteTour(id); store.tours = store.tours.filter(x => x.id !== id); }
    renderAdminGrid(type);
    renderProperties(); renderTours(); renderVehicles();
    toast('Deleted');
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Could not delete this item.');
  }
}

/* ================= REVIEWS (admin moderation) ================= */
function renderAdminReviews(): void {
  const list = store.reviews.slice().reverse();
  byId('adminReviewList').innerHTML = list.map(r => `
    <div class="review-admin-row">
      <span><b>${esc(r.author)}</b><br><small>${esc(r.item_name)}</small></span>
      <span class="stars">${'★'.repeat(r.rating)}</span>
      <span>${esc(r.text)}</span>
      <button onclick="deleteReviewUI('${r.id}')">Remove</button>
    </div>`).join('') || '<p class="empty-note">No reviews yet.</p>';
}
export async function deleteReviewUI(id: string): Promise<void> {
  try {
    await api.deleteReview(id);
    store.reviews = store.reviews.filter(r => r.id !== id);
    renderAdminReviews();
    const { renderReviews } = await import('./public');
    renderReviews();
    toast('Review removed');
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Could not remove this review.');
  }
}

/* ================= CUSTOMERS ================= */
function renderCustomers(): void {
  const map = new Map<string, { name: string; phone: string; count: number; spend: number }>();
  store.bookings.forEach(b => {
    if (!b.phone) return;
    const c = map.get(b.phone) ?? { name: b.customer, phone: b.phone, count: 0, spend: 0 };
    c.count++;
    if (b.status !== 'Cancelled') c.spend += b.price;
    map.set(b.phone, c);
  });
  const list = [...map.values()].sort((a, b) => b.spend - a.spend);
  byId('customerTable').innerHTML =
    `<div class="table-row table-head"><span>Customer</span><span>Phone</span><span>Bookings</span><span>Total spend</span></div>` +
    (list.map(c => `
      <div class="table-row">
        <span><b>${esc(c.name)}</b></span>
        <span>${esc(c.phone)}</span>
        <span>${c.count}</span>
        <span>${esc(store.settings.currency)} ${money(c.spend)}</span>
      </div>`).join('') || '<p class="empty-note">No customers yet.</p>');
}

/* ================= SETTINGS ================= */
function fillSettingsForm(): void {
  (byId('setSiteName') as HTMLInputElement).value = store.settings.site_name;
  (byId('setPhone') as HTMLInputElement).value = store.settings.phone;
  (byId('setCurrency') as HTMLInputElement).value = store.settings.currency;
}
export async function saveSettingsUI(e: Event): Promise<void> {
  e.preventDefault();
  const patch = {
    site_name: (byId('setSiteName') as HTMLInputElement).value || 'Arovia Yathra',
    phone: (byId('setPhone') as HTMLInputElement).value,
    currency: (byId('setCurrency') as HTMLInputElement).value || 'Rs.'
  };
  try {
    store.settings = await api.saveSettings(patch);
    const { applySettingsToPage } = await import('./public');
    applySettingsToPage();
    toast('Settings saved');
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Only signed-in admins can change settings.');
  }
}
