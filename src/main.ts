import './style.css';
import { store } from './state';
import * as apiModule from './lib/api';
import { toast, debounce } from './lib/utils';

import {
  renderAllPublicSections, renderProperties, renderTours, renderVehicles,
  filterStays, filterTours, searchStays, toggleWishlistUI, removeWishlistItem
} from './render/public';

import {
  openModal, closeModal, toggleMobileNav, fakeLogin,
  bookStay, bookTour, bookVehicle, goToPayment, applyCoupon, backToDetails,
  formatCard, confirmPayment, downloadReceipt, submitTrip,
  openReviewModal, paintStars, submitReview
} from './render/booking';

import {
  quickFillAdmin, adminLogin, logoutAdmin, toggleAdminSide, adminTab,
  toggleNotifPanel, globalAdminSearch, jumpToTab,
  exportBookingsCSV, exportCustomersCSV,
  openItemForm, saveItemForm, deleteItemUI,
  dragStart, dragOverItem, dragEndItem, dropItem,
  filterBookings, setBookingStatus, deleteBookingUI,
  deleteReviewUI, saveSettingsUI
} from './render/admin';

/* ---------------- BOOT ---------------- */
async function boot(): Promise<void> {
  try {
    const data = await apiModule.fetchAll();
    store.properties = data.properties;
    store.vehicles = data.vehicles;
    store.tours = data.tours;
    store.bookings = data.bookings; // empty for anonymous visitors until an admin signs in
    store.reviews = data.reviews;
    store.settings = data.settings;
  } catch (err) {
    console.error(err);
    toast('Could not load data from Supabase. Check your .env configuration.');
  }
  renderAllPublicSections();
  wireStaticListeners();
}

function wireStaticListeners(): void {
  document.getElementById('rvStars')?.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'SPAN') return;
    import('./state').then(({ ui }) => {
      ui.currentRating = +(target.dataset.v ?? 5);
      paintStars();
    });
  });

  document.addEventListener('click', e => {
    const panel = document.getElementById('notifPanel');
    const target = e.target as HTMLElement;
    if (panel && !panel.hidden && !target.closest('.notif-wrap')) panel.hidden = true;
  });

  // Live search (debounced) in addition to the explicit Search button.
  const searchInput = document.getElementById('searchPlace');
  searchInput?.addEventListener('input', debounce(() => renderProperties(), 250));
}

document.addEventListener('DOMContentLoaded', boot);

/* ------------------------------------------------------------------
   The existing markup calls these functions directly from inline
   onclick/onsubmit attributes. Since this app now ships as native ES
   modules (no global scope), each handler is attached to `window`
   explicitly here rather than rewriting every attribute in index.html.
------------------------------------------------------------------- */
type Fn = (...args: any[]) => unknown;
const handlers: Record<string, Fn> = {
  openModal, closeModal, toggleMobileNav, fakeLogin,
  searchStays, filterStays, filterTours,
  bookStay, bookTour, bookVehicle, goToPayment, applyCoupon, backToDetails,
  formatCard, confirmPayment, downloadReceipt, submitTrip,
  openReviewModal, submitReview,
  toggleWishlistUI, removeWishlistItem,
  quickFillAdmin, adminLogin, logoutAdmin, toggleAdminSide, adminTab,
  toggleNotifPanel, globalAdminSearch, jumpToTab,
  exportBookingsCSV, exportCustomersCSV,
  openItemForm, saveItemForm, deleteItemUI,
  dragStart, dragOverItem, dragEndItem, dropItem,
  filterBookings, setBookingStatus, deleteBookingUI,
  deleteReviewUI, saveSettingsUI
};
for (const [name, fn] of Object.entries(handlers)) {
  (window as unknown as Record<string, Fn>)[name] = fn;
}
