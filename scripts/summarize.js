// Generate beginner-friendly, grounded explanations for each bill using Google Gemini
// (AI Studio). Output is a small Markdown contract (TITLE / SUMMARY / ## sections / - bullets)
// generated WITH Google Search grounding, parsed into structure, and cached in data/ai.json.
// Cached by input hash + prompt version so each bill is generated once; graceful skip
// without GEMINI_API_KEY.

import './load-env.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { buildAiInput, aiHash, PROMPT_VERSION } from './aiinput.js';
import { parseAiMarkdown } from './aimd.js';

/** @typedef {import('../src/lib/types.js').Bill} Bill */
/** @typedef {import('../src/lib/types.js').BillAI} BillAI */

const ROOT = join(import.meta.dirname, '..');
const BILLS = join(ROOT, 'static', 'bills.json');
const AI_CACHE = join(ROOT, 'data', 'ai.json');

// gemma-4-31b-it works on the free tier and accepts grounding + systemInstruction.
// (gemma-4-26b-a4b-it returns 503/500 under load; gemini-2.5-flash is a fine fallback.)
const MODEL = process.env.GEMINI_MODEL ?? 'gemma-4-31b-it';
const KEY = process.env.GEMINI_API_KEY;
const DELAY_MS = 4500; // free tier ≈ 15 req/min
const MAX_RETRIES = 5;

/** @typedef {BillAI & { hash: string, v: number }} Entry */
/** @typedef {Record<string, Entry>} Cache */

/** @param {number} ms */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SYSTEM = `あなたは日本の法律案を、政治にくわしくない一般の人にもわかるように解説する専門家です。
出力は必ず次の形式のMarkdown（日本語）にしてください。

TITLE: <正式名称を「何をする法案か」が一目で分かるやさしい言い換えに。20〜40字程度。例:「防災の司令塔となる『防災庁』をつくるために関係する法律をまとめて変える法案」。太字は使わない>
SUMMARY: <この法案が何をするかを1〜2文で>
## <短い見出し>
（必要なら、そのセクションの導入を1文だけ。無くてもよい）
- そのセクションの内容を3〜5個の箇条書きで説明する。各項目は1〜2文で、具体的に書く。
- むずかしい用語は使うときにかんたんな説明を添える。
## <次の見出し>
...

ルール:
- セクションは3〜4個にする。最初のセクションでこの法案の背景やねらいを説明し、続くセクションで具体的な中身を一つずつ取り上げる。
- 各セクションの中身は、長い文章のかたまりではなく **3〜5個の箇条書き** で書く。導入の一文は付けても付けなくてもよい。各箇条書きは1〜2文で具体的にする（水増しや繰り返しはしない）。
- 重要なキーワード（制度名・金額・期限・固有名詞など）は **二重アスタリスク** で太字にする。1セクションにつき1〜3語程度。
- 矢印「→」を使った文字図は **任意** 。前後の変化や流れがはっきりしていて、図にした方が明らかに分かりやすいときだけ、箇条書きの中で使ってよい（例:「40人学級 → 35人学級」）。少しでも不自然なら使わない。多くの法案では使わなくてよく、無理に作らないこと。図がないことを悪いことだと考えないでください。
- 矢印を使うときは必ず文字の「→」をそのまま書くこと。$\\rightarrow$ や \\to のような数式・LaTeX記法、-> のような記号は使わない。
- 公式の議案要旨に書かれている内容を最優先で使う。検索は背景や用語の補足にとどめ、推測や不確かな情報は書かない。
- 事実ベース・中立。賛成/反対などの評価や意見は書かない。
- 数字・固有名詞・制度名はできるだけ具体的に残す。
- 「〜を改正する」だけのような中身のない説明（同義反復）は避ける。`;

/**
 * @param {any} res
 * @returns {{ title: string, url: string }[]}
 */
function extractSources(res) {
  const chunks = res?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set();
  /** @type {{ title: string, url: string }[]} */
  const out = [];
  for (const c of chunks) {
    const web = c?.web;
    if (web?.uri && !seen.has(web.uri)) {
      seen.add(web.uri);
      out.push({ title: web.title || web.uri, url: web.uri });
    }
    if (out.length >= 4) break;
  }
  return out;
}

/**
 * @param {GoogleGenAI} ai
 * @param {string} input
 * @returns {Promise<BillAI | null>}
 */
async function generate(ai, input) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: input,
        config: {
          systemInstruction: SYSTEM,
          temperature: 0.4,
          tools: [{ googleSearch: {} }]
        }
      });
      const parsed = parseAiMarkdown(res.text ?? '');
      if (!parsed || (!parsed.plainTitle && parsed.sections.length === 0)) return null;
      return { ...parsed, sources: extractSources(res) };
    } catch (e) {
      const status = e?.status ?? e?.code;
      if ((status === 429 || status === 503 || status === 500) && attempt < MAX_RETRIES) {
        const wait = 10 * (attempt + 1);
        console.log(`  · rate limited (${status}), waiting ${wait}s (retry ${attempt + 1})`);
        await sleep(wait * 1000);
        continue;
      }
      throw e;
    }
  }
}

async function main() {
  /** @type {Cache} */
  const cache = existsSync(AI_CACHE) ? JSON.parse(readFileSync(AI_CACHE, 'utf8')) : {};
  const write = () => writeFileSync(AI_CACHE, JSON.stringify(cache, null, 2));

  if (!KEY) {
    console.warn('GEMINI_API_KEY not set — skipping AI generation (existing cache kept).');
    write();
    return;
  }
  if (!existsSync(BILLS)) {
    console.error('static/bills.json not found — run `npm run data` first.');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: KEY });
  /** @type {Bill[]} */
  const bills = JSON.parse(readFileSync(BILLS, 'utf8'));

  // Figure out up front how many bills actually need generating.
  const todo = bills.filter(
    (b) => !(cache[b.id]?.hash === aiHash(buildAiInput(b)) && cache[b.id]?.v === PROMPT_VERSION)
  );
  console.log(
    `Model: ${MODEL} (grounded) · ${bills.length} bills · ${bills.length - todo.length} cached · ${todo.length} to generate → data/ai.json`
  );
  if (todo.length === 0) {
    console.log('Everything up to date.');
    return;
  }

  const started = Date.now();
  let made = 0;
  let failed = 0;
  for (let i = 0; i < todo.length; i++) {
    const bill = todo[i];
    const n = `[${i + 1}/${todo.length}]`;
    const label = `${bill.id} ${bill.title.slice(0, 24)}…`;
    process.stdout.write(`${n} ⏳ ${label}\n`);
    try {
      const result = await generate(ai, buildAiInput(bill));
      if (result) {
        cache[bill.id] = { ...result, hash: aiHash(buildAiInput(bill)), v: PROMPT_VERSION };
        made++;
        write(); // checkpoint after every success
        console.log(`${n} ✓ ${result.plainTitle.slice(0, 40)}`);
      } else {
        failed++;
        console.log(`${n} · empty result for ${bill.id}`);
      }
    } catch (e) {
      failed++;
      console.warn(`${n} ! ${bill.id} failed (${e?.status ?? e?.message}) — will backfill next run`);
    }
    const elapsed = Math.round((Date.now() - started) / 1000);
    const eta = Math.round((elapsed / (i + 1)) * (todo.length - i - 1));
    console.log(`      progress: ${made} done, ${failed} failed · ${elapsed}s elapsed · ~${eta}s left`);
    if (i < todo.length - 1) await sleep(DELAY_MS);
  }
  console.log(`Done. ${made} generated, ${failed} failed, ${bills.length - todo.length} unchanged → data/ai.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
