import { describe, it, expect } from 'vitest';
import { parseYoushi, youshiSkeleton } from './youshi.js';

// Trimmed real 所得税法 要旨 (221-閣法-3), with footer chrome appended.
const SHOTOKU = `（財政金融委員会）
所得税法等の一部を改正する法律案（閣法第三号）（衆議院送付）要旨
本法律案は、物価高への対応、強い経済の実現等の観点から、国税に関し、所要の改正を一体として行うものであり、その主な内容は次のとおりである。
一、物価上昇局面における基礎控除等の対応
二年ごとに物価上昇に連動して所得税の基礎控除等を引き上げる。
二、強い経済の実現に向けた対応
高い生産性の確保に特に資する設備に対して即時償却等の税制措置を創設する。
三、防衛力強化に係る財源確保のための税制措置
所得税額に対する税率一％の新たな付加税として、防衛特別所得税を創設する。
四、施行期日
この法律は、令和八年四月一日から施行する。
議案要旨のPDFファイルを見る場合は、こちらでご覧いただけます。
利用案内
All rights reserved.`;

// Single-paragraph 要旨 (no numbered points).
const SINGLE = `（厚生労働委員会）
○○法の一部を改正する法律案（閣法第九九号）要旨
本法律案は、医療提供体制の確保のため所要の措置を講じようとするものである。
利用案内`;

// shugiin index-page fallback (must be rejected).
const INDEX = `本文情報一覧
選択された議案本文について、照会できる情報の一覧を表示しています。`;

describe('parseYoushi', () => {
  it('extracts lead, points, and enforcement from a numbered 要旨', () => {
    const y = parseYoushi(SHOTOKU);
    expect(y).not.toBeNull();
    expect(y.lead).toContain('物価高への対応');
    expect(y.lead).not.toContain('要旨'); // title line dropped
    expect(y.points).toHaveLength(3); // 一二三, with 四(施行期日) split out
    expect(y.points[0].heading).toBe('物価上昇局面における基礎控除等の対応');
    expect(y.points[2].heading).toContain('防衛力強化');
    expect(y.enforcement).toContain('令和八年四月一日');
  });

  it('strips footer chrome', () => {
    const y = parseYoushi(SHOTOKU);
    const all = y.lead + y.points.map((p) => p.heading + p.body).join('') + (y.enforcement ?? '');
    expect(all).not.toMatch(/PDF|All rights reserved|利用案内/);
  });

  it('handles a single-paragraph 要旨 (no points)', () => {
    const y = parseYoushi(SINGLE);
    expect(y.points).toHaveLength(0);
    expect(y.lead).toContain('医療提供体制');
  });

  it('rejects the shugiin index page', () => {
    expect(parseYoushi(INDEX)).toBeNull();
  });

  it('rejects empty input', () => {
    expect(parseYoushi('')).toBeNull();
    expect(parseYoushi(null)).toBeNull();
  });
});

describe('youshiSkeleton', () => {
  it('joins lead + point headings and is bounded', () => {
    const s = youshiSkeleton(parseYoushi(SHOTOKU));
    expect(s).toContain('主な内容:');
    expect(s).toContain('防衛力強化');
    expect(s.length).toBeLessThanOrEqual(900);
  });
});
