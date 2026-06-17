import { describe, it, expect } from 'vitest';
import { parseJpDate, daysSince } from './jpdate.js';

describe('parseJpDate', () => {
  it('parses reiwa with padded spacing', () => {
    expect(parseJpDate('令和 8年 3月13日')).toBe('2026-03-13');
  });
  it('parses heisei double-digit year and single-digit month spacing', () => {
    expect(parseJpDate('平成10年 3月 4日')).toBe('1998-03-04');
  });
  it('strips trailing result after slash', () => {
    expect(parseJpDate('令和 8年 3月 5日／財務金融')).toBe('2026-03-05');
  });
  it('passes through ISO dates', () => {
    expect(parseJpDate('2024-11-13')).toBe('2024-11-13');
  });
  it('handles fullwidth digits', () => {
    expect(parseJpDate('令和　８年　３月１３日')).toBe('2026-03-13');
  });
  it('returns null for empty / slash-only cells', () => {
    expect(parseJpDate('')).toBeNull();
    expect(parseJpDate('／')).toBeNull();
    expect(parseJpDate(null)).toBeNull();
  });
});

describe('daysSince', () => {
  it('counts whole days', () => {
    const ref = new Date('2026-06-16T09:00:00Z');
    expect(daysSince('2026-06-12', ref)).toBe(4);
  });
  it('never goes negative for future dates', () => {
    const ref = new Date('2026-06-16T00:00:00Z');
    expect(daysSince('2026-12-01', ref)).toBe(0);
  });
});
