import { supabase } from './supabaseClient';
import type {
  Property, Vehicle, Tour, Booking, Review, SiteSettings, AdminProfile
} from '../types';

function must<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('No data returned from Supabase.');
  return data;
}

/* ---------------- READ (one round trip for the whole catalog) ---------------- */
export async function fetchAll() {
  const [properties, vehicles, tours, bookings, reviews, settings] = await Promise.all([
    supabase.from('properties').select('*').order('sort_order', { ascending: true }),
    supabase.from('vehicles').select('*').order('sort_order', { ascending: true }),
    supabase.from('tours').select('*').order('sort_order', { ascending: true }),
    supabase.from('bookings').select('*').order('created_at', { ascending: true }),
    supabase.from('reviews').select('*').order('created_at', { ascending: true }),
    supabase.from('settings').select('*').eq('id', 1).single()
  ]);

  return {
    properties: (properties.data ?? []) as Property[],
    vehicles: (vehicles.data ?? []) as Vehicle[],
    tours: (tours.data ?? []) as Tour[],
    // Bookings/reviews reads are gated by RLS: anonymous visitors get an
    // empty array back (not an error) until an admin is signed in.
    bookings: (bookings.data ?? []) as Booking[],
    reviews: (reviews.data ?? []) as Review[],
    settings: (settings.data ?? { site_name: 'Arovia Yathra', phone: '', currency: 'Rs.' }) as SiteSettings
  };
}

/* ---------------- PROPERTIES / VEHICLES / TOURS ---------------- */
export async function insertProperty(record: Omit<Property, 'id'>): Promise<Property> {
  const { data, error } = await supabase.from('properties').insert(record).select().single();
  return must(data, error);
}
export async function updateProperty(id: string, patch: Partial<Property>): Promise<Property> {
  const { data, error } = await supabase.from('properties').update(patch).eq('id', id).select().single();
  return must(data, error);
}
export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function insertVehicle(record: Omit<Vehicle, 'id'>): Promise<Vehicle> {
  const { data, error } = await supabase.from('vehicles').insert(record).select().single();
  return must(data, error);
}
export async function updateVehicle(id: string, patch: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await supabase.from('vehicles').update(patch).eq('id', id).select().single();
  return must(data, error);
}
export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function insertTour(record: Omit<Tour, 'id'>): Promise<Tour> {
  const { data, error } = await supabase.from('tours').insert(record).select().single();
  return must(data, error);
}
export async function updateTour(id: string, patch: Partial<Tour>): Promise<Tour> {
  const { data, error } = await supabase.from('tours').update(patch).eq('id', id).select().single();
  return must(data, error);
}
export async function deleteTour(id: string): Promise<void> {
  const { error } = await supabase.from('tours').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Persists a full reordering (drag-and-drop) as one batch of updates. */
export async function reorder(table: 'properties' | 'vehicles' | 'tours', orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase.from(table).update({ sort_order: index }).eq('id', id)
  );
  const results = await Promise.all(updates);
  const failed = results.find(r => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

/* ---------------- BOOKINGS ---------------- */
export async function insertBooking(record: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> {
  const { data, error } = await supabase.from('bookings').insert(record).select().single();
  return must(data, error);
}
export async function updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}
export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------------- REVIEWS ---------------- */
export async function insertReview(record: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
  const { data, error } = await supabase.from('reviews').insert(record).select().single();
  return must(data, error);
}
export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------------- SETTINGS ---------------- */
export async function saveSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const { data, error } = await supabase.from('settings').update(patch).eq('id', 1).select().single();
  return must(data, error);
}

/* ---------------- ADMIN AUTH ---------------- */
export async function adminSignIn(email: string, password: string): Promise<AdminProfile> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError || !authData.user) throw new Error(authError?.message ?? 'Sign-in failed.');

  const { data: profile, error: profileError } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw new Error('This account can sign in but has no admin_profiles row yet.');
  }
  return profile as AdminProfile;
}

export async function adminSignOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return null;
  const { data } = await supabase.from('admin_profiles').select('*').eq('id', userId).single();
  return (data as AdminProfile) ?? null;
}
