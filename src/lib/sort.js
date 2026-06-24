// Sort orders for the 一覧 (simple) list. The list is flat — no grouping — so the chosen
// order is the only structure. Pure functions over already-computed bill fields.

import { STAGES } from './types.js';

/** @typedef {import('./types.js').Bill} Bill */
/** @typedef {'newest' | 'progress' | 'name'} SortKey */

/** @type {{ value: SortKey, label: string }[]} */
export const SORT_OPTIONS = [
  { value: 'newest', label: '新しい順' },
  { value: 'progress', label: '進捗順' },
  { value: 'name', label: '五十音順' }
];

const SORT_KEYS = new Set(SORT_OPTIONS.map((o) => o.value));

/**
 * Coerce an arbitrary string (e.g. from the URL) to a valid sort key.
 * @param {string | null | undefined} v
 * @returns {SortKey}
 */
export function asSortKey(v) {
  return v && SORT_KEYS.has(/** @type {SortKey} */ (v)) ? /** @type {SortKey} */ (v) : 'newest';
}

/**
 * Most recent dated activity for a bill ('' when none), for the 新しい順 order.
 * @param {Bill} b
 * @returns {string}
 */
function latestDate(b) {
  let max = b.stageEnteredDate ?? '';
  for (const e of b.timeline) if (e.date && e.date > max) max = e.date;
  return max;
}

/**
 * Return a new array of bills in the requested order.
 *  - newest:   most recent activity first
 *  - progress: furthest along the legislative journey first (提出 → … → 成立)
 *  - name:     五十音順 by title (Japanese collation)
 * @param {Bill[]} bills
 * @param {SortKey} sort
 * @returns {Bill[]}
 */
export function sortBills(bills, sort) {
  const arr = [...bills];
  if (sort === 'name') {
    arr.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
  } else if (sort === 'progress') {
    arr.sort(
      (a, b) =>
        STAGES.indexOf(b.stage) - STAGES.indexOf(a.stage) ||
        latestDate(b).localeCompare(latestDate(a))
    );
  } else {
    arr.sort((a, b) => latestDate(b).localeCompare(latestDate(a)));
  }
  return arr;
}
