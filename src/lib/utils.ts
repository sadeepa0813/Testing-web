export function esc(str: unknown): string {
  const d = document.createElement('div');
  d.textContent = (str ?? '') as string;
  return d.innerHTML;
}

export function escAttr(str: unknown): string {
  return String(str ?? '').replace(/'/g, "\\'");
}

export function money(n: number): string {
  return n.toLocaleString();
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string): void {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/** Debounce so typing in a search box doesn't re-render (or re-query) on every keystroke. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms = 200): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in the DOM.`);
  return el as T;
}

export function optById<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}
