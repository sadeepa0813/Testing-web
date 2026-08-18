let currentBooking={type:"",name:"",price:0};

function openModal(id){document.getElementById(id).classList.add("show")}
function closeModal(id){document.getElementById(id).classList.remove("show")}
window.addEventListener("click",e=>{if(e.target.classList.contains("modal"))e.target.classList.remove("show")});

function startBooking(type,name,price){
  currentBooking={type,name,price};
  document.getElementById("modalTitle").textContent=name;
  document.getElementById("modalDesc").textContent=`${type} • From Rs. ${price.toLocaleString()}`;
  document.getElementById("date").value=new Date().toISOString().slice(0,10);
  openModal("bookingModal");
}
function bookStay(name,price){startBooking("Stay",name,price)}
function bookTour(name,price){startBooking("Tour package",name,price)}
function bookVehicle(name,price){startBooking("Vehicle",name,price)}

function submitBooking(e){
  e.preventDefault();
  const n=document.getElementById("name").value;
  closeModal("bookingModal");
  toast(`Thanks ${n}! Your ${currentBooking.type.toLowerCase()} request has been received. (Demo)`);
  e.target.reset();
}
function submitTrip(e){
  e.preventDefault(); closeModal("tripModal"); toast("Trip planning request received. We'll contact you on WhatsApp. (Demo)"); e.target.reset();
}
function fakeLogin(e){e.preventDefault();closeModal("loginModal");toast("Demo sign-in successful — Firebase Auth will replace this later.");e.target.reset()}

function searchStays(){
  const q=document.getElementById("searchPlace").value.trim().toLowerCase();
  document.querySelectorAll(".stay").forEach(c=>c.style.display=(!q||c.dataset.name.toLowerCase().includes(q)||q.includes("nuwara"))?"block":"none");
  document.getElementById("stays").scrollIntoView({behavior:"smooth"});
  toast(q?`Showing stays for “${q}”`:"Showing all Nuwara Eliya stays");
}
function filterCards(){document.getElementById("stays").scrollIntoView({behavior:"smooth"})}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.style.display="block";clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.style.display="none",3500)}

const today=new Date().toISOString().slice(0,10);
document.getElementById("checkIn").min=today; document.getElementById("checkOut").min=today;

function adminLogin(e){e.preventDefault();closeModal('adminLoginModal');document.getElementById('adminApp').classList.add('show');document.body.style.overflow='hidden';toast('Admin dashboard opened — Demo mode');}
function logoutAdmin(){document.getElementById('adminApp').classList.remove('show');document.body.style.overflow='';toast('Exited admin dashboard');}
function toggleAdminSide(){document.querySelector('.admin-sidebar').classList.toggle('open')}
function adminTab(tab,btn){document.querySelectorAll('.admin-nav button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.getElementById('adminPageTitle').textContent=tab;const c=document.getElementById('adminContent');if(tab==='Overview'){location.reload();return}c.innerHTML=`<div class="admin-title-row"><div><p class="eyebrow">MANAGEMENT</p><h1>${tab}</h1><p>Manage your NuwaraGo ${tab.toLowerCase()}.</p></div><button class="admin-primary" onclick="toast('Action opened (Demo)')">＋ Add new</button></div><div class="panel"><div class="panel-head"><div><h3>${tab} directory</h3><p>Demo records — Firebase will replace these with live data.</p></div></div><div class="booking-table"><div class="table-row table-head"><span>Name</span><span>Details</span><span>Value</span><span>Status</span></div><div class="table-row"><span><b>Lakeview Cottage</b><small>Verified partner</small></span><span>Nuwara Eliya</span><span>Rs. 12,000</span><em class="confirmed">Active</em></div><div class="table-row"><span><b>Misty Mountains Escape</b><small>2 Day package</small></span><span>Tour</span><span>Rs. 24,900</span><em class="confirmed">Published</em></div><div class="table-row"><span><b>Emily Roberts</b><small>International guest</small></span><span>2 bookings</span><span>UK</span><em class="pending">Pending</em></div></div></div>`}
