// Parse Japanese government date strings into ISO yyyy-mm-dd.
// HoR data uses era dates with irregular spacing, e.g. "令和 8年 3月13日", "平成10年 3月 4日".
// HoC data already uses ISO ("2024-11-13"). Empty cells appear as "／" or "".

/** @type {Record<string, number>} */
const ERA_START = {
  令和: 2018, // 令和1 = 2019  → gregorian = 2018 + eraYear
  平成: 1988, // 平成1 = 1989
  昭和: 1925, // 昭和1 = 1926
  大正: 1911,
  明治: 1867
};

const FULLWIDTH_DIGITS = '０１２３４５６７８９';

/**
 * @param {string} s
 * @returns {string}
 */
function normalizeDigits(s) {
  return s.replace(/[０-９]/g, (d) => String(FULLWIDTH_DIGITS.indexOf(d)));
}

/**
 * Parse a single date string to ISO (yyyy-mm-dd) or null.
 * Accepts both era format and ISO format. Ignores any trailing "／result".
 * @param {string | undefined | null} raw
 * @returns {string | null}
 */
export function parseJpDate(raw) {
  if (!raw) return null;
  // Cells often look like "令和 8年 3月13日／可決" — take the part before the slash.
  let s = normalizeDigits(raw.split('／')[0].trim());
  if (!s || s === '/') return null;

  // Already ISO?
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
  }

  // Era format: <era><spaces><n>年<spaces><n>月<spaces><n>日
  const m = s.match(/(令和|平成|昭和|大正|明治)\s*(\d{1,2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (m) {
    const base = ERA_START[m[1]];
    const year = base + parseInt(m[2], 10);
    return `${year}-${pad(m[3])}-${pad(m[4])}`;
  }

  return null;
}

/**
 * @param {string | number} n
 * @returns {string}
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Whole days between an ISO date and a reference date (default today).
 * @param {string | null} isoDate
 * @param {Date} [ref]
 * @returns {number | null}
 */
export function daysSince(isoDate, ref = new Date()) {
  if (!isoDate) return null;
  const then = new Date(isoDate + 'T00:00:00Z');
  if (isNaN(then.getTime())) return null;
  const refUtc = Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate());
  return Math.max(0, Math.round((refUtc - then.getTime()) / 86_400_000));
}
