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
