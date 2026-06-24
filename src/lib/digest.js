// Curate a short "front page" digest from the full bill set, so the landing view leads with
// what matters now instead of listing all ~90 bills. Pure functions over data that's already
// computed upstream (recentActivity, stage, heat, finalState) — no backend, no new fields.

import { recentActivity } from './activity.js';

/** @typedef {import('./types.js').Bill} Bill */

/**
 * Where a section's "すべて見る →" link should take the viewer.
 * @typedef {object} SeeAll
 * @property {'simple' | 'board' | 'recent'} view
 * @property {import('./sort.js').SortKey} [sort] sort order to apply on the 一覧 (simple) feed
 */

/**
 * @typedef {object} DigestSection
 * @property {string} key
 * @property {string} heading
 * @property {string} blurb
 * @property {Bill[]} bills
 * @property {SeeAll} seeAll
 */

/**
 * @typedef {object} Digest
 * @property {Bill | null} featured the single "今週の一本" hero bill (excluded from sections)
 * @property {DigestSection[]} sections non-empty sections, in display order
 */

const PER_SECTION = 5;

/**
 * Most recent dated timeline event ('' when none), for ordering enacted bills.
 * @param {Bill} b
 * @returns {string}
 */
function latestDate(b) {
  let max = '';
  for (const e of b.timeline) if (e.date && e.date > max) max = e.date;
  return max;
}

/**
 * Bills that had a dated timeline event within the activity window, newest move first.
 * Reuses recentActivity so the digest and the 動き view stay consistent.
 * @param {Bill[]} bills
 * @param {string} asOf
 * @returns {Bill[]}
 */
function recentlyMoved(bills, asOf) {
  /** @type {Bill[]} */
  const out = [];
  const seen = new Set();
  for (const day of recentActivity(bills, asOf)) {
    for (const ev of day.events) {
      if (seen.has(ev.bill.id)) continue;
      seen.add(ev.bill.id);
      out.push(ev.bill);
    }
  }
  return out;
}

/**
 * Build the curated landing digest. Sections are deduped in display order (a bill shown in an
 * earlier section is not repeated later), the hero is the first bill of the first non-empty
 * section, and empty sections are dropped.
 * @param {Bill[]} bills
 * @param {string} asOf ISO yyyy-mm-dd — the data freshness date (meta.updatedAt)
 * @returns {Digest}
 */
export function buildDigest(bills, asOf) {
  const enacted = bills
    .filter((b) => b.finalState === '成立' || b.stage === '成立')
    .sort((a, b) => latestDate(b).localeCompare(latestDate(a)));

  /** @type {(Omit<DigestSection, 'bills'> & { source: Bill[] })[]} */
  const specs = [
    {
      key: 'moved',
      heading: '今週の動き',
      blurb: 'この1週間で審議が動いた法案です。',
      seeAll: { view: 'recent' },
      source: recentlyMoved(bills, asOf)
    },
    {
      key: 'enacted',
      heading: '成立した法案',
      blurb: '今国会で可決され、法律になった法案。',
      seeAll: { view: 'simple', sort: 'newest' },
      source: enacted
    }
  ];

  // Dedupe across sections in display order, capped per section.
  const seen = new Set();
  /** @type {DigestSection[]} */
  const sections = [];
  for (const spec of specs) {
    /** @type {Bill[]} */
    const picked = [];
    for (const b of spec.source) {
      if (seen.has(b.id)) continue;
      seen.add(b.id);
      picked.push(b);
      if (picked.length >= PER_SECTION) break;
    }
    sections.push({ key: spec.key, heading: spec.heading, blurb: spec.blurb, seeAll: spec.seeAll, bills: picked });
  }

  // Hero = first bill of the first non-empty section; pull it out so it isn't shown twice.
  let featured = /** @type {Bill | null} */ (null);
  for (const s of sections) {
    if (s.bills.length) {
      featured = s.bills[0];
      s.bills = s.bills.slice(1);
      break;
    }
  }

  return { featured, sections: sections.filter((s) => s.bills.length) };
}
