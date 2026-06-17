import { describe, it, expect } from 'vitest';
import { parseAiMarkdown } from './aimd.js';

// みらい議会-style output.
const SAMPLE = `TITLE: 防災の司令塔となる「防災庁」をつくるために関係する法律をまとめて変える法案
SUMMARY: 災害対応の司令塔となる「防災庁」を新設するため、関係する複数の法律をまとめて改正します。

## 防災庁という新しい役所をつくる
災害に強い国にするため、防災の司令塔となる「防災庁」を新たに設けます。これまで各省庁に分かれていた防災の仕事を一つにまとめます。

## まとめて変える4つのポイント
新しい役所に合わせて、関係する法律を次のように整理します。

- 各省庁の防災担当を防災庁に移す
- 災害時の指揮系統を防災庁に一本化する
- 予算や人員の根拠規定を整える`;

describe('parseAiMarkdown', () => {
  it('extracts title, oneLiner, sections, and bullets', () => {
    const a = parseAiMarkdown(SAMPLE);
    expect(a).not.toBeNull();
    expect(a.plainTitle).toContain('防災庁');
    expect(a.oneLiner).toContain('司令塔');
    expect(a.sections).toHaveLength(2);
    expect(a.sections[0].heading).toBe('防災庁という新しい役所をつくる');
    expect(a.sections[0].body).toContain('防災の司令塔');
    expect(a.sections[1].bullets).toHaveLength(3);
    expect(a.sections[1].bullets[0]).toContain('防災担当');
  });

  it('strips ** from title but keeps **bold** in body, handles fullwidth colons', () => {
    const a = parseAiMarkdown('TITLE：**やさしい題**\nSUMMARY：要点です。\n## 見出し\n**重要**な本文。');
    expect(a.plainTitle).toBe('やさしい題');
    expect(a.oneLiner).toBe('要点です。');
    expect(a.sections[0].body).toContain('**重要**');
  });

  it('normalises LaTeX/ASCII arrows to a literal → in bullets', () => {
    const a = parseAiMarkdown(
      '## 見出し\n本文。\n- 1クラスの生徒数：40人 $\\rightarrow$ **35人**\n- 申請 -> 審査 -> 認定'
    );
    expect(a.sections[0].bullets[0]).toBe('1クラスの生徒数：40人 → **35人**');
    expect(a.sections[0].bullets[1]).toBe('申請 → 審査 → 認定');
    expect(a.sections[0].bullets.join('')).not.toMatch(/rightarrow|->/);
  });

  it('returns null on empty', () => {
    expect(parseAiMarkdown('')).toBeNull();
  });
});
