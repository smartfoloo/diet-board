// Derive a day-by-day activity log ("what changed recently") from the dated timeline
// events already attached to every bill. No backend or snapshots needed — the daily
// rebuild refreshes the underlying dates.

/** @typedef {import('./types.js').Bill} Bill */
/** @typedef {import('./status.js').Tone} Tone */
/**
 * @typedef {object} ActivityEvent
 * @property {Bill} bill
 * @property {string} date ISO yyyy-mm-dd
 * @property {string} label beginner-friendly badge, e.g. 「委員会で審議入り」
 * @property {Tone} tone for the status-dot color
 * @property {number} rank stage progression (higher = further along), for intra-day ordering
 * @property {'衆' | '参'} [house]
 * @property {string} [detail] committee name / result / law number
 */
/**
 * @typedef {object} ActivityDay
 * @property {string} date
 * @property {ActivityEvent[]} events
 */

// Map a raw timeline label (e.g. 「衆議院 委員会付託」) to a friendly badge. Order matters:
// the first matching substring wins, most-advanced first.
const BADGES = [
  { match: /公布/, label: '成立・公布', tone: /** @type {Tone} */ ('done'), rank: 4 },
  { match: /本会議/, label: '本会議で可決', tone: /** @type {Tone} */ ('active'), rank: 3 },
  { match: /審査終了/, label: '委員会を通過', tone: /** @type {Tone} */ ('active'), rank: 2 },
  { match: /付託/, label: '委員会で審議入り', tone: /** @type {Tone} */ ('active'), rank: 1 },
  { match: /受理/, label: '提出された', tone: /** @type {Tone} */ ('new'), rank: 0 }
];

/**
 * ISO date `days` before the given reference date (yyyy-mm-dd in, yyyy-mm-dd out).
 * @param {string} iso
 * @param {number} days
 * @returns {string}
 */
function isoDaysBefore(iso, days) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Group recent dated timeline events across all bills into a newest-first activity log,
 * limited to the past 7 days relative to `asOf` (the data's freshness date, not the
 * viewer's clock — so a cached or long-open page stays consistent with the build).
 * @param {Bill[]} bills
 * @param {string} [asOf] ISO yyyy-mm-dd; defaults to today. Events strictly older than 7 days are dropped.
 * @returns {ActivityDay[]}
 */
export function recentActivity(bills, asOf = new Date().toISOString().slice(0, 10)) {
  // Inclusive 7-day window: keep events dated on or after (asOf - 6 days).
  const cutoff = isoDaysBefore(asOf, 6);
  /** @type {Map<string, ActivityEvent[]>} */
  const byDate = new Map();
  for (const bill of bills) {
    for (const e of bill.timeline) {
      if (!e.date || e.date < cutoff) continue;
      const badge = BADGES.find((b) => b.match.test(e.label));
      if (!badge) continue;
      /** @type {ActivityEvent} */
      const ev = {
        bill,
        date: e.date,
        label: badge.label,
        tone: badge.tone,
        rank: badge.rank,
        house: e.house,
        detail: e.detail
      };
      const arr = byDate.get(e.date);
      if (arr) arr.push(ev);
      else byDate.set(e.date, [ev]);
    }
  }
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([date, events]) => ({
      date,
      // Within a day: most-advanced step first, then by bill number.
      events: events.sort((a, b) => b.rank - a.rank || a.bill.number - b.bill.number)
    }));
}

/**
 * Format an ISO date as 「6月15日（月）」 for day headings.
 * @param {string} iso
 * @returns {string}
 */
export function formatDay(iso) {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日（${wd}）`;
}
