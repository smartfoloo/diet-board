import { describe, it, expect } from 'vitest';
import { recentActivity, formatDay } from './activity.js';

/**
 * Minimal bill factory with just the fields recentActivity reads.
 * @param {string} id
 * @param {number} number
 * @param {{ date: string | null, label: string, house?: '衆' | '参', detail?: string }[]} timeline
 * @returns {any}
 */
function bill(id, number, timeline) {
  return { id, number, title: id, ai: null, submitterParty: null, category: 'その他', timeline };
}

const BILLS = [
  bill('a', 1, [
    { date: '2026-06-10', label: '衆議院 受理', house: '衆' },
    { date: '2026-06-15', label: '衆議院 委員会付託', house: '衆', detail: '厚生労働委員会' }
  ]),
  bill('b', 2, [
    { date: '2026-06-15', label: '公布', detail: '法律第10号' },
    { date: null, label: '衆議院 受理', house: '衆' } // undated → ignored
  ]),
  bill('c', 3, [{ date: '2026-06-09', label: '参議院 本会議議決', house: '参', detail: '可決' }])
];

describe('recentActivity', () => {
  it('groups events by date, newest day first', () => {
    const days = recentActivity(BILLS, '2026-06-15');
    expect(days.map((d) => d.date)).toEqual(['2026-06-15', '2026-06-10', '2026-06-09']);
  });

  it('maps raw labels to beginner badges with tones', () => {
    const days = recentActivity(BILLS, '2026-06-15');
    const jun15 = days.find((d) => d.date === '2026-06-15');
    const events = jun15?.events ?? [];
    const labels = events.map((e) => e.label);
    expect(labels).toContain('成立・公布');
    expect(labels).toContain('委員会で審議入り');
    // 公布 (rank 4) sorts before 委員会付託 (rank 1) within the day.
    expect(events[0].label).toBe('成立・公布');
    expect(events[0].tone).toBe('done');
  });

  it('ignores undated events', () => {
    const days = recentActivity(BILLS, '2026-06-15');
    const total = days.reduce((n, d) => n + d.events.length, 0);
    expect(total).toBe(4); // 2 (a) + 1 (b dated) + 1 (c)
  });

  it('carries the committee detail through', () => {
    const days = recentActivity(BILLS, '2026-06-15');
    const ev = days
      .flatMap((d) => d.events)
      .find((e) => e.label === '委員会で審議入り');
    expect(ev?.detail).toBe('厚生労働委員会');
  });

  it('keeps only the past 7 days relative to asOf', () => {
    // Inclusive window: asOf - 6 days. With asOf=2026-06-15, cutoff is 2026-06-09,
    // so 06-09 is kept but anything earlier is dropped.
    const days = recentActivity(BILLS, '2026-06-15');
    expect(days.map((d) => d.date)).toEqual(['2026-06-15', '2026-06-10', '2026-06-09']);

    // Move the window forward one day → 06-09 falls out of range.
    const narrower = recentActivity(BILLS, '2026-06-16');
    expect(narrower.map((d) => d.date)).toEqual(['2026-06-15', '2026-06-10']);
  });
});

describe('formatDay', () => {
  it('formats an ISO date with weekday', () => {
    expect(formatDay('2026-06-15')).toBe('6月15日（月）');
  });
});
