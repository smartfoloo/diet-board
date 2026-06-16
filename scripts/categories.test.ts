import { describe, it, expect } from 'vitest';
import { classify } from './categories';

describe('classify', () => {
  const cases: [string, string][] = [
    ['所得税法等の一部を改正する法律案', '税制'],
    ['地方税法等の一部を改正する法律案', '税制'],
    ['介護保険法の一部を改正する法律案', '社会保障'],
    ['子ども・子育て支援法の一部を改正する法律案', '社会保障'],
    ['インテリジェンスに係る態勢の整備の推進に関する法律案', '外交・安全保障'],
    ['財政運営に必要な財源の確保を図るための公債の発行の特例に関する法律案', '経済・産業'],
    ['政治資金規正法の一部を改正する法律案', '司法・行政'],
    ['運輸事業の振興の助成に関する法律の一部を改正する法律案', '国土・交通'],
    ['全く無関係な架空の名前の法律案', 'その他']
  ];
  for (const [title, expected] of cases) {
    it(`${title} → ${expected}`, () => {
      expect(classify(title)).toBe(expected);
    });
  }
});
