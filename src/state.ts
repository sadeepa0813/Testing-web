import type { Property, Vehicle, Tour, Booking, Review, SiteSettings, AdminProfile, BookingType } from './types';

export interface PendingBooking {
  type: BookingType;
  itemId: string;
  itemName: string;
  price: number;
  name?: string;
  phone?: string;
  date?: string;
  checkOut?: string;
  guests?: number;
  units?: number;
  subtotal?: number;
  discount?: number;
  coupon?: string | null;
  total?: number;
}

export const store: {
  properties: Property[];
  vehicles: Vehicle[];
  tours: Tour[];
  bookings: Booking[];
  reviews: Review[];
  settings: SiteSettings;
} = {
  properties: [],
  vehicles: [],
  tours: [],
  bookings: [],
  reviews: [],
  settings: { site_name: 'Arovia Yathra', phone: '', currency: 'Rs.' }
};

export const ui = {
  stayFilter: 'all' as string,
  tourFilter: 'all' as string,
  bookingStatusFilter: 'all' as string,
  pendingBooking: null as PendingBooking | null,
  currentRating: 5,
  lastReceipt: null as Booking | null,
  currentAdmin: null as AdminProfile | null,
  dragCtx: null as { type: 'property' | 'vehicle' | 'tour'; index: number } | null
};
