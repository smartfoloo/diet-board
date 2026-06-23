import { describe, it, expect } from 'vitest';
import { buildDigest } from './digest.js';

/**
 * Minimal bill factory with just the fields buildDigest reads.
 * @param {string} id
 * @param {Partial<import('./types.js').Bill>} [over]
 * @returns {any}
 */
function bill(id, over = {}) {
  return {
    id,
    number: Number(id.replace(/\D/g, '')) || 0,
    title: id,
    stage: '委員会審議',
    finalState: null,
    heat: 'normal',
    daysInStage: 0,
    timeline: [],
    ...over
  };
}

describe('buildDigest', () => {
  it('places bills in the right sections and picks a hero', () => {
    const bills = [
      bill('moved', { stage: '提出', timeline: [{ date: '2026-06-14', label: '衆議院 受理', house: '衆' }] }),
      bill('nearing', { stage: '参議院' }),
      bill('stuck', { stage: '委員会審議', heat: 'hot', daysInStage: 40 }),
      // Enacted a while ago (outside the 7-day window) so it stays in 成立したばかり, not 今週の動き.
      bill('enacted', { stage: '成立', finalState: '成立', timeline: [{ date: '2026-06-01', label: '公布' }] })
    ];
    const { featured, sections } = buildDigest(bills, '2026-06-15');

    // Hero = first bill of the first non-empty section (今週の動き).
    expect(featured?.id).toBe('moved');

    const byKey = Object.fromEntries(sections.map((s) => [s.key, s.bills.map((b) => b.id)]));
    // 'moved' was pulled out as the hero, so its section is now empty and dropped.
    expect(byKey.moved).toBeUndefined();
    expect(byKey.nearing).toEqual(['nearing']);
    expect(byKey.stuck).toEqual(['stuck']);
    expect(byKey.enacted).toEqual(['enacted']);
  });

  it('does not repeat a bill across sections (deduped in display order)', () => {
    // A hot bill that also moved this week should appear only under 今週の動き.
    const b = bill('x', {
      stage: '委員会審議',
      heat: 'hot',
      daysInStage: 50,
      timeline: [{ date: '2026-06-15', label: '衆議院 委員会付託', house: '衆' }]
    });
    const { featured, sections } = buildDigest([b], '2026-06-15');
    const ids = [featured?.id, ...sections.flatMap((s) => s.bills.map((x) => x.id))].filter(Boolean);
    expect(ids).toEqual(['x']); // exactly once
  });

  it('orders 終盤 bills 参議院 before 本会議', () => {
    const bills = [bill('honkaigi', { stage: '本会議' }), bill('sangiin', { stage: '参議院' })];
    const { featured, sections } = buildDigest(bills, '2026-06-15');
    // No recent movement → hero is the first 終盤 bill (参議院).
    expect(featured?.id).toBe('sangiin');
    expect(sections.find((s) => s.key === 'nearing')?.bills.map((b) => b.id)).toEqual(['honkaigi']);
  });

  it('drops empty sections', () => {
    const { sections } = buildDigest([bill('a', { stage: '委員会審議' })], '2026-06-15');
    // A plain in-committee bill matches no curated section.
    expect(sections).toEqual([]);
  });
});
