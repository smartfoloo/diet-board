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
 * Group every dated timeline event across all bills into a newest-first activity log.
 * @param {Bill[]} bills
 * @returns {ActivityDay[]}
 */
export function recentActivity(bills) {
  /** @type {Map<string, ActivityEvent[]>} */
  const byDate = new Map();
  for (const bill of bills) {
    for (const e of bill.timeline) {
      if (!e.date) continue;
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
