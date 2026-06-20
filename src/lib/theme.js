import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'theme';

/** @returns {'light' | 'dark'} */
function initial() {
  if (!browser) return 'light';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** @type {import('svelte/store').Writable<'light' | 'dark'>} */
export const theme = writable(initial());

/** Reflect the current theme onto <html> and persist the choice. */
function apply(/** @type {'light' | 'dark'} */ value) {
  if (!browser) return;
  document.documentElement.classList.toggle('dark', value === 'dark');
  localStorage.setItem(STORAGE_KEY, value);
}

if (browser) {
  // Keep <html> + storage in sync with the store.
  theme.subscribe(apply);
}

export function toggleTheme() {
  theme.update((value) => (value === 'dark' ? 'light' : 'dark'));
}
