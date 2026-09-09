import type { WishlistItem } from '../types';

const KEY = 'ay_wishlist';

function read(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
  } catch {
    return [];
  }
}
function write(list: WishlistItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getWishlist(): WishlistItem[] {
  return read();
}

export function isWished(type: WishlistItem['type'], id: string): boolean {
  return read().some(w => w.type === type && w.id === id);
}

/** Returns the new "wished" state after toggling. */
export function toggleWishlist(item: WishlistItem): boolean {
  const list = read();
  const exists = list.some(w => w.type === item.type && w.id === item.id);
  const next = exists ? list.filter(w => !(w.type === item.type && w.id === item.id)) : [...list, item];
  write(next);
  return !exists;
}

export function removeFromWishlist(type: WishlistItem['type'], id: string): void {
  write(read().filter(w => !(w.type === type && w.id === id)));
}
