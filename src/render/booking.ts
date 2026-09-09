import { store, ui, type PendingBooking } from '../state';
import { esc, money, byId, optById, toast, todayISO } from '../lib/utils';
import * as api from '../lib/api';
import { refreshAdminIfOpen } from './admin';

const COUPONS: Record<string, { type: 'percent' | 'flat'; value: number; label: string }> = {
  TEA10: { type: 'percent', value: 10, label: '10% off' },
  FOG20: { type: 'percent', value: 20, label: '20% off' },
  WELCOME500: { type: 'flat', value: 500, label: 'Rs. 500 off' }
};

/* ---------------- MODALS / NAV ---------------- */
export function openModal(id: string): void {
  byId(id).classList.add('open');
  if (id === 'wishlistModal') import('./public').then(m => m.renderWishlistModal());
}
export function closeModal(id: string): void {
  byId(id).classList.remove('open');
}
export function toggleMobileNav(): void {
  const menu = byId('mobileMenu');
  const backdrop = byId('mobileMenuBackdrop');
  const opening = !menu.classList.contains('open');
  menu.classList.toggle('open', opening);
  backdrop.classList.toggle('open', opening);
  document.body.style.overflow = opening ? 'hidden' : '';
}
export function fakeLogin(e: Event): void {
  e.preventDefault();
  closeModal('loginModal');
  (e.target as HTMLFormElement).reset();
  toast('Signed in (demo)');
}

/* ---------------- START BOOKING ---------------- */
export function bookStay(id: string): void {
  const item = store.properties.find(p => p.id === id);
  if (!item) return;
  startBooking('stay', item.id, item.name, item.price, `Requesting ${item.name} — ${item.area}`);
}
export function bookTour(id: string): void {
  const item = store.tours.find(t => t.id === id);
  if (!item) return;
  startBooking('tour', item.id, item.name, item.price, `Requesting the ${item.name} package`);
}
export function bookVehicle(id: string): void {
  const item = store.vehicles.find(v => v.id === id);
  if (!item) return;
  startBooking('vehicle', item.id, item.name, item.price, `Requesting ${item.name}`);
}

function startBooking(type: PendingBooking['type'], itemId: string, itemName: string, price: number, desc: string): void {
  ui.pendingBooking = { type, itemId, itemName, price, discount: 0, coupon: null };
  byId('modalTitle').textContent = itemName;
  byId('modalDesc').textContent = desc;
  byId('bookingStep1').hidden = false;
  byId('bookingStep2').hidden = true;
  byId('bookingStep3').hidden = true;
  (byId('bookingForm') as HTMLFormElement).reset();
  byId('couponMsg').textContent = '';
  (byId('couponCode') as HTMLInputElement).value = '';
  renderBookingFields(type);
  openModal('bookingModal');
}

function renderBookingFields(type: PendingBooking['type']): void {
  const today = todayISO();
  let html = '';
  if (type === 'stay') {
    html = `
      <div class="field-group">
        <input id="bkCheckIn" required type="date" min="${today}">
        <input id="bkCheckOut" required type="date" min="${today}">
      </div>
      <p class="field-hint">Check-in and check-out dates — price is calculated per night.</p>
      <input id="bkPeople" type="number" min="1" value="2" placeholder="Guests">`;
  } else if (type === 'vehicle') {
    html = `
      <div class="field-group">
        <input id="bkCheckIn" required type="date" min="${today}">
        <input id="bkCheckOut" required type="date" min="${today}">
      </div>
      <p class="field-hint">Rental start and end dates — price is calculated per day.</p>
      <input id="bkPeople" type="number" min="1" value="2" placeholder="Passengers">`;
  } else {
    html = `
      <input id="bkCheckIn" required type="date" min="${today}">
      <input id="bkPeople" type="number" min="1" value="2" placeholder="Guests">`;
  }
  byId('bookingFields').innerHTML = html;
}

export function goToPayment(e: Event): void {
  e.preventDefault();
  const b = ui.pendingBooking;
  if (!b) return;
  const name = (byId('bkName') as HTMLInputElement).value.trim();
  const phone = (byId('bkPhone') as HTMLInputElement).value.trim();
  const guests = +(byId('bkPeople') as HTMLInputElement).value || 1;
  const checkIn = (byId('bkCheckIn') as HTMLInputElement).value;
  const checkOutEl = optById<HTMLInputElement>('bkCheckOut');
  const checkOut = checkOutEl ? checkOutEl.value : '';

  let units = 1;
  if (b.type === 'stay' || b.type === 'vehicle') {
    if (checkOut && checkIn && new Date(checkOut) <= new Date(checkIn)) {
      toast('Check-out must be after check-in');
      return;
    }
    units = checkOut ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;
  }

  ui.pendingBooking = { ...b, name, phone, date: checkIn, checkOut, guests, units, discount: 0, coupon: null };
  ui.pendingBooking.subtotal = ui.pendingBooking.price * units;

  (byId('couponCode') as HTMLInputElement).value = '';
  byId('couponMsg').textContent = '';
  renderPaySummary();

  byId('bookingStep1').hidden = true;
  byId('bookingStep2').hidden = false;
}

function renderPaySummary(): void {
  const b = ui.pendingBooking;
  if (!b) return;
  const total = Math.max(0, (b.subtotal ?? 0) - (b.discount ?? 0));
  b.total = total;
  byId('paySummary').innerHTML = `
    <div><span>${esc(b.itemName)}</span><span>${esc(store.settings.currency)} ${money(b.price)} × ${b.units ?? 1}</span></div>
    <div><span>Guests</span><span>${b.guests}</span></div>
    <div><span>Date</span><span>${b.date || '—'}${b.checkOut ? ' → ' + b.checkOut : ''}</span></div>
    ${b.coupon ? `<div><span>Coupon (${esc(b.coupon)})</span><span>− ${esc(store.settings.currency)} ${money(b.discount ?? 0)}</span></div>` : ''}
    <div class="total"><span>Total due</span><span>${esc(store.settings.currency)} ${money(total)}</span></div>`;
}

export function applyCoupon(): void {
  const b = ui.pendingBooking;
  if (!b) return;
  const code = (byId('couponCode') as HTMLInputElement).value.trim().toUpperCase();
  const msg = byId('couponMsg');
  const c = COUPONS[code];
  if (!code) { msg.textContent = 'Enter a code first'; msg.className = 'coupon-msg err'; return; }
  if (!c) {
    msg.textContent = 'Invalid or expired code'; msg.className = 'coupon-msg err';
    b.discount = 0; b.coupon = null; renderPaySummary(); return;
  }
  b.discount = c.type === 'percent' ? Math.round((b.subtotal ?? 0) * c.value / 100) : c.value;
  b.coupon = code;
  msg.textContent = `Applied — ${c.label}`;
  msg.className = 'coupon-msg ok';
  renderPaySummary();
}

export function backToDetails(): void {
  byId('bookingStep1').hidden = false;
  byId('bookingStep2').hidden = true;
}

export function formatCard(el: HTMLInputElement): void {
  el.value = el.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

export async function confirmPayment(e: Event): Promise<void> {
  e.preventDefault();
  const b = ui.pendingBooking;
  if (!b) return;

  const submitBtn = optById<HTMLButtonElement>('payBtn');
  if (submitBtn) submitBtn.disabled = true;
  try {
    const record = await api.insertBooking({
      type: b.type,
      item_name: b.itemName,
      customer: b.name ?? '',
      phone: b.phone ?? '',
      date: b.date ?? '',
      check_out: b.checkOut ?? '',
      guests: b.guests ?? 1,
      units: b.units ?? 1,
      coupon: b.coupon ?? '',
      price: b.total ?? 0,
      status: 'Confirmed',
      notes: ''
    });
    store.bookings.push(record);
    ui.lastReceipt = record;

    byId('bookingStep2').hidden = true;
    byId('bookingStep3').hidden = false;
    byId('confirmText').textContent = `${store.settings.currency} ${money(record.price)} charged (demo).`;
    byId('mockMessage').innerHTML = `
      <b>Preview — WhatsApp / Email (demo, not sent)</b>
      Hi ${esc(record.customer)}, your booking for <b style="display:inline">${esc(record.item_name)}</b> on ${record.date} is confirmed.
      Total paid: ${store.settings.currency} ${money(record.price)}. Booking ref: ${record.id.slice(0, 8).toUpperCase()}.`;
    toast('Booking confirmed 🎉');
    refreshAdminIfOpen();
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Could not save the booking. Please try again.');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

export function downloadReceipt(): void {
  const r = ui.lastReceipt;
  if (!r) return;
  const w = window.open('', '_blank', 'width=420,height=640');
  if (!w) return;
  w.document.write(`
    <html><head><title>Receipt ${r.id}</title><style>
      body{font-family:'Work Sans',sans-serif; padding:2rem; color:#1E2A22;}
      h1{font-family:Georgia,serif; font-size:1.3rem; margin-bottom:0;}
      small{color:#4B5C50;}
      table{width:100%; border-collapse:collapse; margin-top:1.2rem;}
      td{padding:.5rem 0; border-bottom:1px solid #D3CDB6; font-size:.9rem;}
      td:last-child{text-align:right; font-weight:600;}
      .total td{font-weight:700; font-size:1.05rem; border-top:2px solid #1E2A22; border-bottom:none;}
    </style></head><body>
      <h1>${esc(store.settings.site_name)}</h1><small>Booking receipt (demo)</small>
      <table>
        <tr><td>Booking ref</td><td>${r.id.slice(0, 8).toUpperCase()}</td></tr>
        <tr><td>Customer</td><td>${esc(r.customer)}</td></tr>
        <tr><td>Service</td><td>${esc(r.item_name)}</td></tr>
        <tr><td>Date</td><td>${r.date}${r.check_out ? ' → ' + r.check_out : ''}</td></tr>
        <tr><td>Guests</td><td>${r.guests}</td></tr>
        ${r.coupon ? `<tr><td>Coupon</td><td>${r.coupon}</td></tr>` : ''}
        <tr class="total"><td>Total paid</td><td>${esc(store.settings.currency)} ${money(r.price)}</td></tr>
      </table>
    </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

export async function submitTrip(e: Event): Promise<void> {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  try {
    await api.insertBooking({
      type: 'custom-trip',
      item_name: `Custom trip — ${(byId('tripLength') as HTMLSelectElement).value}, ${(byId('tripGroup') as HTMLSelectElement).value}`,
      customer: (byId('tripName') as HTMLInputElement).value,
      phone: (byId('tripPhone') as HTMLInputElement).value,
      date: '', check_out: '', guests: 0, units: 1, coupon: '',
      price: 0, status: 'Pending',
      notes: (byId('tripNotes') as HTMLTextAreaElement).value
    });
    closeModal('tripModal');
    form.reset();
    toast("Itinerary request sent — we'll follow up on WhatsApp");
    refreshAdminIfOpen();
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Could not send your request. Please try again.');
  }
}

/* ---------------- REVIEWS ---------------- */
export function openReviewModal(): void {
  const names = [...store.properties.map(p => p.name), ...store.tours.map(t => t.name)];
  const sel = byId<HTMLSelectElement>('rvFor');
  sel.innerHTML = `<option value="">What was this about?</option>` + names.map(n => `<option>${esc(n)}</option>`).join('');
  ui.currentRating = 5;
  paintStars();
  (byId('reviewModal').querySelector('form') as HTMLFormElement)?.reset();
  sel.value = '';
  openModal('reviewModal');
}
export function paintStars(): void {
  document.querySelectorAll<HTMLElement>('#rvStars span').forEach(s => {
    s.classList.toggle('on', +(s.dataset.v ?? 0) <= ui.currentRating);
  });
}
export async function submitReview(e: Event): Promise<void> {
  e.preventDefault();
  try {
    const record = await api.insertReview({
      item_name: (byId('rvFor') as HTMLSelectElement).value,
      author: (byId('rvName') as HTMLInputElement).value,
      rating: ui.currentRating,
      text: (byId('rvText') as HTMLTextAreaElement).value
    });
    store.reviews.push(record);
    const { renderReviews } = await import('./public');
    renderReviews();
    closeModal('reviewModal');
    toast('Thanks for your review!');
    refreshAdminIfOpen();
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Could not post your review. Please try again.');
  }
}
