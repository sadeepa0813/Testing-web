export type PropertyCategory = 'hill' | 'lake' | 'estate';
export type BookingType = 'stay' | 'tour' | 'vehicle' | 'custom-trip';
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled';
export type AdminRole = 'Super Admin' | 'Staff';

export interface Property {
  id: string;
  name: string;
  area: string;
  price: number;
  rating: number;
  tag: string;
  cat: PropertyCategory;
  photo: string;
  sort_order: number;
}

export interface Vehicle {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  sort_order: number;
}

export interface Tour {
  id: string;
  name: string;
  days: number;
  description: string;
  price: number;
  photo: string;
  elevation: string;
  sort_order: number;
}

export interface Booking {
  id: string;
  type: BookingType;
  item_name: string;
  customer: string;
  phone: string;
  date: string;
  check_out: string;
  guests: number;
  units: number;
  coupon: string;
  price: number;
  status: BookingStatus;
  notes: string;
  created_at: string;
}

export interface Review {
  id: string;
  item_name: string;
  author: string;
  rating: number;
  text: string;
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  phone: string;
  currency: string;
}

export interface AdminProfile {
  id: string;
  name: string;
  role: AdminRole;
  avatar: string;
}

export interface WishlistItem {
  type: 'stay' | 'tour' | 'vehicle';
  id: string;
  name: string;
  price: number;
}

/** A place the site loves — this is static content, not stored in Supabase. */
export interface Place {
  name: string;
  elev: string;
  desc: string;
  cls: string;
}

export type ItemType = 'property' | 'vehicle' | 'tour';
