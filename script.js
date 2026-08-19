/* ==================================================================
   AROVIA YATHRA — demo app logic
   All data lives in this browser's localStorage. No backend, no
   network calls. Everything here is for demonstration only.
================================================================== */

const LS = {
  properties:'ay_properties', vehicles:'ay_vehicles', tours:'ay_tours',
  bookings:'ay_bookings', reviews:'ay_reviews', settings:'ay_settings', seeded:'ay_seeded'
};

function load(key, fallback){
  try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch(e){ return fallback; }
}
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function uid(prefix){ return prefix + '_' + Math.random().toString(36).slice(2,9); }

/* ---------------- SEED DATA ---------------- */
function seedData(force){
  if(!force && load(LS.seeded,false)) return;

  save(LS.properties, [
    {id:uid('p'), name:'Hill Breeze Guest House', area:'Quiet hillside • 1.2 km from town', price:8500, rating:4.8, tag:'Guest favorite', cat:'hill', photo:'p1'},
    {id:uid('p'), name:'Lakeview Cottage', area:'Gregory Lake area • Breakfast included', price:12000, rating:4.9, tag:'', cat:'lake', photo:'p2'},
    {id:uid('p'), name:'Tea Garden Villa', area:'Tea estate view • Family friendly', price:15500, rating:4.7, tag:'', cat:'estate', photo:'p3'},
    {id:uid('p'), name:'Misty Pines Bungalow', area:'Forest edge • Fireplace & garden', price:9800, rating:4.6, tag:'New', cat:'hill', photo:'p1'}
  ]);

  save(LS.tours, [
    {id:uid('t'), name:'Little England Highlights', days:1, desc:"Gregory Lake • Tea factory • Lover's Leap • City", price:12900, photo:'t1', elev:'1,868M'},
    {id:uid('t'), name:'Misty Mountains Escape', days:2, desc:'Hakgala • Ramboda • Tea estates • Waterfalls • Sunrise', price:24900, photo:'t2', elev:'2,524M'},
    {id:uid('t'), name:'Pidurutalagala Sunrise Trek', days:1, desc:"Sri Lanka's highest peak • Guided hike • Breakfast", price:9500, photo:'t1', elev:'2,524M'}
  ]);

  save(LS.vehicles, [
    {id:uid('v'), name:'Car + Driver', desc:'1–3 guests • Comfortable & private', price:7500, icon:'🚗'},
    {id:uid('v'), name:'Van + Driver', desc:'4–10 guests • Ideal for families', price:11500, icon:'🚐'},
    {id:uid('v'), name:'Tuk Tuk + Driver', desc:'1–2 guests • Fun, open-air local rides', price:4200, icon:'🛺'}
  ]);

  const days = [...Array(7)].map((_,i)=>{
    const d = new Date(); d.setDate(d.getDate() - (6-i)); return d.toISOString().slice(0,10);
  });
  save(LS.bookings, [
    {id:uid('bk'), type:'stay', itemName:'Lakeview Cottage', customer:'Kasun P.', phone:'+94 77 123 4567', date:days[1], guests:2, price:12000, status:'Confirmed', createdAt:days[1]},
    {id:uid('bk'), type:'tour', itemName:'Misty Mountains Escape', customer:'Emily R.', phone:'+44 7700 123456', date:days[3], guests:4, price:24900, status:'Pending', createdAt:days[3]},
    {id:uid('bk'), type:'vehicle', itemName:'Van + Driver', customer:'Tharindu S.', phone:'+94 71 555 8899', date:days[5], guests:6, price:11500, status:'Confirmed', createdAt:days[5]},
    {id:uid('bk'), type:'stay', itemName:'Hill Breeze Guest House', customer:'Nadeesha W.', phone:'+94 76 222 1190', date:days[5], guests:2, price:8500, status:'Confirmed', createdAt:days[5]},
    {id:uid('bk'), type:'tour', itemName:'Little England Highlights', customer:'Marco B.', phone:'+39 345 111 2233', date:days[6], guests:3, price:12900, status:'Pending', createdAt:days[6]},
    {id:uid('bk'), type:'stay', itemName:'Tea Garden Villa', customer:'Ishara D.', phone:'+94 70 888 4432', date:days[6], guests:5, price:15500, status:'Cancelled', createdAt:days[6]},
    {id:uid('bk'), type:'vehicle', itemName:'Car + Driver', customer:'Ruwan G.', phone:'+94 77 909 1122', date:days[2], guests:2, price:7500, status:'Confirmed', createdAt:days[2]},
    {id:uid('bk'), type:'custom-trip', itemName:'Custom itinerary', customer:'Priya S.', phone:'+91 98 111 2233', date:days[4], guests:4, price:0, status:'Pending', createdAt:days[4]}
  ]);

  save(LS.reviews, [
    {id:uid('rv'), itemName:'Lakeview Cottage', author:'Kasun P.', rating:5, text:'Woke up to fog rolling over the lake. Breakfast was excellent and the host arranged our tea factory visit.', date:days[1]},
    {id:uid('rv'), itemName:'Misty Mountains Escape', author:'Emily R.', rating:5, text:'Best two days of our Sri Lanka trip. The driver knew every viewpoint before the tour buses arrived.', date:days[3]},
    {id:uid('rv'), itemName:'Hill Breeze Guest House', author:'Nadeesha W.', rating:4, text:'Simple, clean, and the hillside walk to town is lovely in the morning.', date:days[5]}
  ]);

  save(LS.settings, {siteName:'Arovia Yathra', phone:'+94 77 000 0000', currency:'Rs.'});
  save(LS.seeded, true);
}

/* ---------------- STATE ---------------- */
let pendingBooking = null;
let currentRating = 5;
let stayFilter = 'all';
let tourFilter = 'all';
let bookingStatusFilterVal = 'all';

const PLACES = [
  {name:'Tea Country Estates', elev:'1,900M', desc:'Walk through misty tea estates.', cls:'l2'},
  {name:'Gregory Lake', elev:'1,880M', desc:'Relax, cycle or enjoy the view.', cls:'l1'},
  {name:'Hakgala Gardens', elev:'1,700M', desc:'Cool mountain gardens and trails.', cls:'l4'},
  {name:'Ramboda Falls', elev:'1,050M', desc:'A scenic waterfall stop.', cls:'l3'}
];

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  seedData(false);
  applySettingsToPage();
  renderProperties(); renderTours(); renderVehicles(); renderPlaces(); renderReviews();
  document.getElementById('bkDate') && document.getElementById('bkDate').setAttribute('min', new Date().toISOString().slice(0,10));

  document.getElementById('rvStars').addEventListener('click', e=>{
    if(e.target.tagName !== 'SPAN') return;
    currentRating = +e.target.dataset.v;
    paintStars();
  });
});

function applySettingsToPage(){
  const s = load(LS.settings, {siteName:'Arovia Yathra'});
  document.title = s.siteName + ' — Nuwara Eliya Travel';
}

/* ==================================================================
   PUBLIC SITE RENDERING
================================================================== */
function renderProperties(){
  const list = load(LS.properties, []);
  const q = (document.getElementById('searchPlace')?.value || '').toLowerCase().trim();
  const filtered = list.filter(p=>{
    const matchesCat = stayFilter === 'all' || p.cat === stayFilter;
    const matchesQ = !q || p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });
  const grid = document.getElementById('stayGrid');
  grid.innerHTML = filtered.map(p => `
    <article class="card stay">
      <div class="photo ${p.photo}">
        ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="row"><h3>${esc(p.name)}</h3><span>★ ${p.rating}</span></div>
        <p>${esc(p.area)}</p>
        <div class="price">Rs. ${p.price.toLocaleString()} <small>/ night</small></div>
        <button class="small-btn" onclick="bookStay('${p.id}')">Book now</button>
      </div>
    </article>`).join('');
  document.getElementById('stayEmpty').hidden = filtered.length !== 0;
}

function filterStays(cat, btn){
  stayFilter = cat;
  document.querySelectorAll('#stayFilterTabs .filter-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderProperties();
}

function searchStays(){
  document.getElementById('stays').scrollIntoView({behavior:'smooth'});
  renderProperties();
}

function renderTours(){
  const list = load(LS.tours, []).filter(t => tourFilter==='all' || String(t.days)===tourFilter);
  document.getElementById('tourGrid').innerHTML = list.map(t=>`
    <article class="tour">
      <div class="tour-img ${t.photo}"></div>
      <div>
        <span class="pill">${t.days} DAY${t.days>1?'S':''}</span>
        <h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p>
        <div class="tour-bottom">
          <div><b>Rs. ${t.price.toLocaleString()} <small>/ group</small></b><br><span class="elev-tag">Peak elevation ${t.elev}</span></div>
          <button onclick="bookTour('${t.id}')">Choose</button>
        </div>
      </div>
    </article>`).join('');
}

function filterTours(days, btn){
  tourFilter = days;
  document.querySelectorAll('#tourFilterTabs .filter-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTours();
}

function renderVehicles(){
  const list = load(LS.vehicles, []);
  document.getElementById('vehicleGrid').innerHTML = list.map(v=>`
    <div class="vehicle">
      <div class="car-icon">${v.icon}</div>
      <div><h3>${esc(v.name)}</h3><p>${esc(v.desc)}</p></div>
      <b>From Rs. ${v.price.toLocaleString()}/day</b>
      <button onclick="bookVehicle('${v.id}')">Request</button>
    </div>`).join('');
}

function renderPlaces(){
  const sorted = [...PLACES].sort((a,b)=> parseInt(b.elev) - parseInt(a.elev));
  document.getElementById('placeGrid').innerHTML = sorted.map(p=>`
    <div class="place">
      <div class="place-img ${p.cls}"><span class="elev-tag">${p.elev}</span></div>
      <h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
    </div>`).join('');
}

function renderReviews(){
  const list = load(LS.reviews, []).slice().reverse();
  const avg = list.length ? (list.reduce((s,r)=>s+r.rating,0)/list.length).toFixed(1) : '—';
  document.getElementById('reviewSummary').innerHTML = `
    <div class="big-score">${avg}</div>
    <div><div class="stars">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5-Math.round(avg))}</div>
    <div class="count">${list.length} traveler review${list.length===1?'':'s'}</div></div>`;
  document.getElementById('reviewGrid').innerHTML = list.slice(0,6).map(r=>`
    <div class="review-card">
      <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
      <p>"${esc(r.text)}"</p>
      <div class="rv-meta"><span>${esc(r.author)}</span><span>${esc(r.itemName)}</span></div>
    </div>`).join('') || '<p class="empty-note">No reviews yet — be the first to share your trip.</p>';
}

/* ==================================================================
   BOOKING + CHECKOUT FLOW
================================================================== */
function bookStay(id){
  const item = load(LS.properties,[]).find(p=>p.id===id);
  startBooking('stay', item.id, item.name, item.price, `Requesting ${item.name} — ${item.area}`);
}
function bookTour(id){
  const item = load(LS.tours,[]).find(t=>t.id===id);
  startBooking('tour', item.id, item.name, item.price, `Requesting the ${item.name} package`);
}
function bookVehicle(id){
  const item = load(LS.vehicles,[]).find(v=>v.id===id);
  startBooking('vehicle', item.id, item.name, item.price, `Requesting ${item.name}`);
}

function startBooking(type, itemId, itemName, price, desc){
  pendingBooking = {type, itemId, itemName, price};
  document.getElementById('modalTitle').textContent = itemName;
  document.getElementById('modalDesc').textContent = desc;
  document.getElementById('bookingStep1').hidden = false;
  document.getElementById('bookingStep2').hidden = true;
  document.getElementById('bookingStep3').hidden = true;
  document.getElementById('bookingForm').reset();
  openModal('bookingModal');
}

function goToPayment(e){
  e.preventDefault();
  const name = document.getElementById('bkName').value.trim();
  const phone = document.getElementById('bkPhone').value.trim();
  const date = document.getElementById('bkDate').value;
  const guests = +document.getElementById('bkPeople').value || 1;
  pendingBooking = {...pendingBooking, name, phone, date, guests};

  const unit = pendingBooking.type === 'stay' ? guests : 1;
  const total = pendingBooking.price * (pendingBooking.type==='stay' ? Math.max(1, Math.ceil(guests/2)) : 1);
  pendingBooking.total = pendingBooking.price; // keep base price as the demo "total" for simplicity/clarity

  document.getElementById('paySummary').innerHTML = `
    <div><span>${esc(pendingBooking.itemName)}</span><span>Rs. ${pendingBooking.price.toLocaleString()}</span></div>
    <div><span>Guests</span><span>${guests}</span></div>
    <div><span>Date</span><span>${date || '—'}</span></div>
    <div class="total"><span>Total due</span><span>Rs. ${pendingBooking.price.toLocaleString()}</span></div>`;

  document.getElementById('bookingStep1').hidden = true;
  document.getElementById('bookingStep2').hidden = false;
}

function backToDetails(){
  document.getElementById('bookingStep1').hidden = false;
  document.getElementById('bookingStep2').hidden = true;
}

function formatCard(el){
  el.value = el.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
}

function confirmPayment(e){
  e.preventDefault();
  const bookings = load(LS.bookings, []);
  const record = {
    id: uid('bk'), type: pendingBooking.type, itemName: pendingBooking.itemName,
    customer: pendingBooking.name, phone: pendingBooking.phone, date: pendingBooking.date,
    guests: pendingBooking.guests, price: pendingBooking.price, status: 'Confirmed',
    createdAt: new Date().toISOString().slice(0,10)
  };
  bookings.push(record);
  save(LS.bookings, bookings);

  document.getElementById('bookingStep2').hidden = true;
  document.getElementById('bookingStep3').hidden = false;
  document.getElementById('confirmText').textContent =
    `Rs. ${record.price.toLocaleString()} charged (demo). A confirmation would normally be sent to ${record.phone}.`;
  toast('Booking confirmed 🎉');
  refreshAdminIfOpen();
}

function submitTrip(e){
  e.preventDefault();
  const bookings = load(LS.bookings, []);
  bookings.push({
    id: uid('bk'), type:'custom-trip', itemName:`Custom trip — ${document.getElementById('tripLength').value}, ${document.getElementById('tripGroup').value}`,
    customer: document.getElementById('tripName').value, phone: document.getElementById('tripPhone').value,
    date:'', guests:0, price:0, status:'Pending', createdAt:new Date().toISOString().slice(0,10),
    notes: document.getElementById('tripNotes').value
  });
  save(LS.bookings, bookings);
  closeModal('tripModal');
  e.target.reset();
  toast('Itinerary request sent — we\'ll follow up on WhatsApp');
  refreshAdminIfOpen();
}

/* ==================================================================
   REVIEWS
================================================================== */
function openReviewModal(){
  const props = load(LS.properties,[]).map(p=>p.name);
  const tours = load(LS.tours,[]).map(t=>t.name);
  const sel = document.getElementById('rvFor');
  sel.innerHTML = `<option value="">What was this about?</option>` +
    [...props, ...tours].map(n=>`<option>${esc(n)}</option>`).join('');
  currentRating = 5; paintStars();
  document.getElementById('reviewModal').querySelector('form').reset();
  sel.value = '';
  openModal('reviewModal');
}
function paintStars(){
  document.querySelectorAll('#rvStars span').forEach(s=>{
    s.classList.toggle('on', +s.dataset.v <= currentRating);
  });
}
function submitReview(e){
  e.preventDefault();
  const reviews = load(LS.reviews, []);
  reviews.push({
    id: uid('rv'), itemName: document.getElementById('rvFor').value,
    author: document.getElementById('rvName').value, rating: currentRating,
    text: document.getElementById('rvText').value, date: new Date().toISOString().slice(0,10)
  });
  save(LS.reviews, reviews);
  renderReviews();
  closeModal('reviewModal');
  toast('Thanks for your review!');
  refreshAdminIfOpen();
}

/* ==================================================================
   MODALS / MISC
================================================================== */
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
function toggleMobileNav(){ document.querySelector('nav').classList.toggle('open'); }

function fakeLogin(e){ e.preventDefault(); closeModal('loginModal'); e.target.reset(); toast('Signed in (demo)'); }

function esc(str){ const d=document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; }

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ==================================================================
   ADMIN
================================================================== */
function adminLogin(e){
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim().toLowerCase();
  const pass = document.getElementById('adminPass').value;
  if(email === 'admin@aroviayathra.demo' && pass === 'admin123'){
    closeModal('adminLoginModal');
    e.target.reset();
    document.getElementById('adminApp').classList.add('open');
    document.body.style.overflow = 'hidden';
    renderAdminAll();
  } else {
    toast('Incorrect demo credentials');
  }
}
function logoutAdmin(){
  document.getElementById('adminApp').classList.remove('open');
  document.body.style.overflow = '';
}
function toggleAdminSide(){ document.querySelector('.admin-sidebar').classList.toggle('open'); }

function adminTab(name, btn){
  document.querySelectorAll('.admin-nav button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.admin-panel').forEach(p=>p.hidden = true);
  document.getElementById('panel-'+name).hidden = false;
  document.getElementById('adminPageTitle').textContent = name;
  if(name==='Overview') renderAdminOverview();
  if(name==='Bookings') renderAllBookings();
  if(name==='Properties') renderAdminGrid('property');
  if(name==='Vehicles') renderAdminGrid('vehicle');
  if(name==='Tours') renderAdminGrid('tour');
  if(name==='Reviews') renderAdminReviews();
  if(name==='Customers') renderCustomers();
  if(name==='Settings') fillSettingsForm();
}

function refreshAdminIfOpen(){
  if(document.getElementById('adminApp').classList.contains('open')){
    renderAdminAll();
  }
}

function renderAdminAll(){
  document.getElementById('navBookingCount').textContent = load(LS.bookings,[]).length;
  const active = document.querySelector('.admin-nav button.active');
  const name = active ? active.querySelector('span').textContent : 'Overview';
  renderAdminOverview();
  if(name==='Bookings') renderAllBookings();
  if(name==='Properties') renderAdminGrid('property');
  if(name==='Vehicles') renderAdminGrid('vehicle');
  if(name==='Tours') renderAdminGrid('tour');
  if(name==='Reviews') renderAdminReviews();
  if(name==='Customers') renderCustomers();
}

/* ---- OVERVIEW ---- */
function renderAdminOverview(){
  const bookings = load(LS.bookings, []);
  const properties = load(LS.properties, []);
  const vehicles = load(LS.vehicles, []);
  const tours = load(LS.tours, []);
  const reviews = load(LS.reviews, []);

  document.getElementById('adminDateLine').textContent =
    new Date().toLocaleDateString('en-GB', {weekday:'long', day:'2-digit', month:'short', year:'numeric'}).toUpperCase();

  const revenue = bookings.filter(b=>b.status!=='Cancelled').reduce((s,b)=>s+b.price,0);
  const custCount = new Set(bookings.map(b=>b.phone)).size;

  document.getElementById('statsRow').innerHTML = `
    <div class="stat"><small>Total bookings</small><strong>${bookings.length}</strong><span class="up">↑ live</span><p>all time (demo)</p></div>
    <div class="stat"><small>Revenue</small><strong>Rs. ${revenue.toLocaleString()}</strong><span class="up">confirmed + pending</span><p>excludes cancelled</p></div>
    <div class="stat"><small>Properties</small><strong>${properties.length}</strong><span class="neutral">${vehicles.length} vehicles</span><p>active partners</p></div>
    <div class="stat"><small>Customers</small><strong>${custCount}</strong><span class="up">${reviews.length} reviews</span><p>unique phone numbers</p></div>`;

  document.getElementById('recentBookingsTable').innerHTML = bookingRows(bookings.slice(-3).reverse(), false);

  drawRevenueChart(bookings);
  drawStatusDonut(bookings);

  document.getElementById('activityGrid').innerHTML = `
    <div>🏠<b>${properties.length}</b><small>Properties</small></div>
    <div>🚐<b>${vehicles.length}</b><small>Vehicles</small></div>
    <div>🧭<b>${tours.length}</b><small>Tour packages</small></div>
    <div>⭐<b>${avgRating(reviews)}</b><small>Average rating</small></div>`;
}

function avgRating(reviews){
  if(!reviews.length) return '—';
  return (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1);
}

function bookingRows(list, withActions){
  if(!list.length) return '<p class="empty-note">No bookings yet.</p>';
  return `<div class="table-row table-head"><span>Customer</span><span>Service</span><span>Date</span><span>Status</span>${withActions?'<span>Actions</span>':''}</div>` +
    list.map(b=>`
      <div class="table-row">
        <span><b>${esc(b.customer)}</b><small>${esc(b.phone)}</small></span>
        <span>${esc(b.itemName)}</span>
        <span>${b.date || b.createdAt || '—'}</span>
        <em class="${b.status.toLowerCase()}">${b.status}</em>
        ${withActions ? `<div class="row-actions">
            ${b.status!=='Confirmed' ? `<button class="confirm-a" onclick="setBookingStatus('${b.id}','Confirmed')">Confirm</button>`:''}
            ${b.status!=='Cancelled' ? `<button class="cancel-a" onclick="setBookingStatus('${b.id}','Cancelled')">Cancel</button>`:''}
            <button onclick="deleteBooking('${b.id}')">Delete</button>
          </div>` : ''}
      </div>`).join('');
}

/* ---- BOOKINGS TAB ---- */
function renderAllBookings(){
  const list = load(LS.bookings, []).slice().reverse()
    .filter(b => bookingStatusFilterVal==='all' || b.status===bookingStatusFilterVal);
  document.getElementById('allBookingsTable').innerHTML = bookingRows(list, true);
}
function filterBookings(status, btn){
  bookingStatusFilterVal = status;
  document.querySelectorAll('#bookingStatusFilter .filter-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderAllBookings();
}
function setBookingStatus(id, status){
  const list = load(LS.bookings, []);
  const b = list.find(x=>x.id===id); if(!b) return;
  b.status = status; save(LS.bookings, list);
  toast('Booking marked ' + status);
  renderAdminAll();
}
function deleteBooking(id){
  if(!confirm('Delete this booking?')) return;
  save(LS.bookings, load(LS.bookings, []).filter(b=>b.id!==id));
  toast('Booking deleted');
  renderAdminAll();
}

/* ---- CHARTS (canvas, no libraries) ---- */
function drawRevenueChart(bookings){
  const canvas = document.getElementById('revenueChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const days = [...Array(7)].map((_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-(6-i)); return d;
  });
  const values = days.map(d=>{
    const key = d.toISOString().slice(0,10);
    return bookings.filter(b=>b.createdAt===key && b.status!=='Cancelled').reduce((s,b)=>s+b.price,0);
  });
  const max = Math.max(...values, 1);
  const w = canvas.width, h = canvas.height, pad = 28, barW = (w - pad*2) / values.length * 0.6;
  const gap = (w - pad*2) / values.length;

  ctx.strokeStyle = '#D3CDB6'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, h-30); ctx.lineTo(w-10, h-30); ctx.stroke();

  values.forEach((v,i)=>{
    const barH = (v/max) * (h - 60);
    const x = pad + i*gap + (gap-barW)/2;
    const y = h - 30 - barH;
    const grad = ctx.createLinearGradient(0,y,0,h-30);
    grad.addColorStop(0,'#B8863B'); grad.addColorStop(1,'#2F4A3C');
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, barH, 4);
    ctx.fillStyle = '#4B5C50'; ctx.font = '10px Work Sans'; ctx.textAlign='center';
    ctx.fillText(days[i].toLocaleDateString('en-GB',{weekday:'short'}), x+barW/2, h-14);
  });
}
function roundRect(ctx,x,y,w,h,r){
  if(h<=0) return;
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath(); ctx.fill();
}

function drawStatusDonut(bookings){
  const canvas = document.getElementById('statusDonut');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const counts = {Confirmed:0, Pending:0, Cancelled:0};
  bookings.forEach(b=>{ counts[b.status] = (counts[b.status]||0)+1; });
  const colors = {Confirmed:'#3F7A5C', Pending:'#B8863B', Cancelled:'#B3543F'};
  const total = Object.values(counts).reduce((a,b)=>a+b,0) || 1;
  const cx = canvas.width/2, cy = canvas.height/2, r = 78, rInner = 46;
  let start = -Math.PI/2;
  Object.entries(counts).forEach(([k,v])=>{
    const angle = (v/total) * Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,start,start+angle);
    ctx.closePath();
    ctx.fillStyle = colors[k];
    ctx.fill();
    start += angle;
  });
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(cx,cy,rInner,0,Math.PI*2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#1E2A22'; ctx.font='600 16px "IBM Plex Mono"'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(total, cx, cy);

  document.getElementById('donutLegend').innerHTML = Object.entries(counts).map(([k,v])=>
    `<div><i style="background:${colors[k]}"></i>${k} — ${v}</div>`).join('');
}

/* ---- PROPERTIES / VEHICLES / TOURS CRUD ---- */
const TYPE_META = {
  property: {store:LS.properties, label:'property', fields:[
    {k:'name', label:'Name', type:'text'},
    {k:'area', label:'Description / area', type:'text'},
    {k:'price', label:'Price per night (Rs.)', type:'number'},
    {k:'rating', label:'Rating', type:'number', step:'0.1', min:'1', max:'5'},
    {k:'tag', label:'Tag (optional)', type:'text'},
    {k:'cat', label:'Category', type:'select', options:['hill','lake','estate']},
    {k:'photo', label:'Photo style', type:'select', options:['p1','p2','p3']}
  ]},
  vehicle: {store:LS.vehicles, label:'vehicle', fields:[
    {k:'name', label:'Vehicle name', type:'text'},
    {k:'desc', label:'Description', type:'text'},
    {k:'price', label:'Price per day (Rs.)', type:'number'},
    {k:'icon', label:'Icon (emoji)', type:'text'}
  ]},
  tour: {store:LS.tours, label:'tour package', fields:[
    {k:'name', label:'Tour name', type:'text'},
    {k:'desc', label:'Description', type:'text'},
    {k:'days', label:'Duration (days)', type:'select', options:['1','2','3']},
    {k:'price', label:'Price per group (Rs.)', type:'number'},
    {k:'elev', label:'Peak elevation (e.g. 2,524M)', type:'text'},
    {k:'photo', label:'Photo style', type:'select', options:['t1','t2']}
  ]}
};

function renderAdminGrid(type){
  const meta = TYPE_META[type];
  const list = load(meta.store, []);
  const gridId = {property:'adminPropertyGrid', vehicle:'adminVehicleGrid', tour:'adminTourGrid'}[type];
  document.getElementById(gridId).innerHTML = list.map(item=>`
    <div class="admin-item-card">
      <h3>${esc(item.name)}</h3>
      <p>${esc(item.area || item.desc || '')}</p>
      <div class="price">Rs. ${(item.price||0).toLocaleString()}</div>
      <div class="item-actions">
        <button class="edit-a" onclick="openItemForm('${type}','${item.id}')">Edit</button>
        <button class="del-a" onclick="deleteItem('${type}','${item.id}')">Delete</button>
      </div>
    </div>`).join('') || '<p class="empty-note">Nothing here yet — add one above.</p>';
}

function openItemForm(type, id){
  const meta = TYPE_META[type];
  const list = load(meta.store, []);
  const item = id ? list.find(x=>x.id===id) : null;
  document.getElementById('itemFormEyebrow').textContent = (item ? 'EDIT ' : 'ADD ') + meta.label.toUpperCase();
  document.getElementById('itemFormTitle').textContent = (item ? 'Edit ' : 'Add ') + meta.label;

  const form = document.getElementById('itemForm');
  form.innerHTML = meta.fields.map(f=>{
    const val = item ? (item[f.k] ?? '') : '';
    if(f.type==='select'){
      return `<label style="font-size:.78rem;font-weight:600;color:var(--ink-soft)">${f.label}
        <select name="${f.k}" required>${f.options.map(o=>`<option ${val===o?'selected':''}>${o}</option>`).join('')}</select></label>`;
    }
    return `<label style="font-size:.78rem;font-weight:600;color:var(--ink-soft)">${f.label}
      <input name="${f.k}" type="${f.type}" ${f.step?`step="${f.step}"`:''} ${f.min?`min="${f.min}"`:''} value="${esc(String(val))}" required></label>`;
  }).join('') + `<input type="hidden" name="__type" value="${type}"><input type="hidden" name="__id" value="${id||''}">
    <button class="btn" type="submit">${item ? 'Save changes' : 'Add ' + meta.label}</button>`;

  openModal('itemFormModal');
}

function saveItemForm(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const type = fd.get('__type');
  const id = fd.get('__id');
  const meta = TYPE_META[type];
  const list = load(meta.store, []);

  const record = {};
  meta.fields.forEach(f=>{
    let v = fd.get(f.k);
    if(f.type==='number') v = parseFloat(v) || 0;
    record[f.k] = v;
  });

  if(id){
    const idx = list.findIndex(x=>x.id===id);
    list[idx] = {...list[idx], ...record};
    toast('Changes saved');
  } else {
    record.id = uid(type[0]);
    list.push(record);
    toast('Added successfully');
  }
  save(meta.store, list);
  closeModal('itemFormModal');
  renderAdminGrid(type);
  renderProperties(); renderTours(); renderVehicles();
}

function deleteItem(type, id){
  if(!confirm('Delete this item? This cannot be undone.')) return;
  const meta = TYPE_META[type];
  save(meta.store, load(meta.store, []).filter(x=>x.id!==id));
  renderAdminGrid(type);
  renderProperties(); renderTours(); renderVehicles();
  toast('Deleted');
}

/* ---- REVIEWS (admin moderation) ---- */
function renderAdminReviews(){
  const list = load(LS.reviews, []).slice().reverse();
  document.getElementById('adminReviewList').innerHTML = list.map(r=>`
    <div class="review-admin-row">
      <span><b>${esc(r.author)}</b><br><small>${esc(r.itemName)}</small></span>
      <span class="stars">${'★'.repeat(r.rating)}</span>
      <span>${esc(r.text)}</span>
      <button onclick="deleteReview('${r.id}')">Remove</button>
    </div>`).join('') || '<p class="empty-note">No reviews yet.</p>';
}
function deleteReview(id){
  save(LS.reviews, load(LS.reviews,[]).filter(r=>r.id!==id));
  renderAdminReviews(); renderReviews();
  toast('Review removed');
}

/* ---- CUSTOMERS ---- */
function renderCustomers(){
  const bookings = load(LS.bookings, []);
  const map = {};
  bookings.forEach(b=>{
    if(!b.phone) return;
    if(!map[b.phone]) map[b.phone] = {name:b.customer, phone:b.phone, count:0, spend:0};
    map[b.phone].count++;
    if(b.status!=='Cancelled') map[b.phone].spend += b.price;
  });
  const list = Object.values(map).sort((a,b)=>b.spend-a.spend);
  document.getElementById('customerTable').innerHTML =
    `<div class="table-row table-head"><span>Customer</span><span>Phone</span><span>Bookings</span><span>Total spend</span></div>` +
    list.map(c=>`
      <div class="table-row">
        <span><b>${esc(c.name)}</b></span>
        <span>${esc(c.phone)}</span>
        <span>${c.count}</span>
        <span>Rs. ${c.spend.toLocaleString()}</span>
      </div>`).join('') || '<p class="empty-note">No customers yet.</p>';
}

/* ---- SETTINGS ---- */
function fillSettingsForm(){
  const s = load(LS.settings, {siteName:'Arovia Yathra', phone:'', currency:'Rs.'});
  document.getElementById('setSiteName').value = s.siteName;
  document.getElementById('setPhone').value = s.phone;
  document.getElementById('setCurrency').value = s.currency;
}
function saveSettings(e){
  e.preventDefault();
  const s = {
    siteName: document.getElementById('setSiteName').value || 'Arovia Yathra',
    phone: document.getElementById('setPhone').value,
    currency: document.getElementById('setCurrency').value || 'Rs.'
  };
  save(LS.settings, s);
  applySettingsToPage();
  document.querySelectorAll('.brand-word').forEach(el=>{
    el.childNodes[0].textContent = s.siteName.split(' ')[0] + ' ';
  });
  toast('Settings saved');
}
function resetDemoData(){
  if(!confirm('This clears everything stored in this browser and restores the original demo content. Continue?')) return;
  Object.values(LS).forEach(k=>localStorage.removeItem(k));
  seedData(true);
  applySettingsToPage();
  renderProperties(); renderTours(); renderVehicles(); renderPlaces(); renderReviews();
  renderAdminAll();
  toast('Demo data reset');
}
