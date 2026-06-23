import { describe, it, expect } from 'vitest';
import { matchesQuery } from './search.js';

/** @type {any} */
const b = {
  title: '令和八年度における公債の発行の特例に関する法律案',
  category: '経済・産業',
  submitter: '伊佐進一君外二名',
  submitterParties: ['中道改革連合・無所属', '国民民主党・無所属クラブ'],
  ai: { plainTitle: '国債を新しく発行することを認める法案', oneLiner: '国の借金を発行できるようにする法律案です。' }
};

describe('matchesQuery', () => {
  it('matches everything for an empty/whitespace query', () => {
    expect(matchesQuery(b, '')).toBe(true);
    expect(matchesQuery(b, '   ')).toBe(true);
  });

  it('matches the official title', () => {
    expect(matchesQuery(b, '公債')).toBe(true);
  });

  it('matches fields the official title lacks (plain title, one-liner, party, submitter)', () => {
    expect(matchesQuery(b, '国債')).toBe(true); // plainTitle / oneLiner only
    expect(matchesQuery(b, '借金')).toBe(true); // oneLiner only
    expect(matchesQuery(b, '国民民主党')).toBe(true); // submitterParties only
    expect(matchesQuery(b, '伊佐')).toBe(true); // submitter only
  });

  it('returns false when nothing matches', () => {
    expect(matchesQuery(b, '外交')).toBe(false);
  });

  it('tolerates a missing ai block', () => {
    expect(matchesQuery({ ...b, ai: null }, '公債')).toBe(true);
    expect(matchesQuery({ ...b, ai: null }, '国債')).toBe(false);
  });
});
