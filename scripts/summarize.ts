// Generate plain-language Japanese summaries from the fetched outline text using
// Groq's free tier (OpenAI-compatible API). Cached by content hash so each bill is
// summarized once; re-summarized only if its outline text changes. Degrades
// gracefully: no key / rate limit → leaves summary unset for a later run to backfill.

import './load-env';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import OpenAI from 'openai';

const ROOT = join(import.meta.dirname, '..');
const CONTENT_DIR = join(ROOT, 'data', 'content');
const SUMMARIES = join(ROOT, 'data', 'summaries.json');

// 70B only by default: smaller free models (8b-instant) hallucinate facts, which is
// unacceptable for a civic tool. With 800-char inputs a full session (~83 bills,
// ~77k tokens) fits under the free-tier 100k tokens/day cap. Override with GROQ_MODEL.
const MODELS = process.env.GROQ_MODEL
  ? [process.env.GROQ_MODEL]
  : ['llama-3.3-70b-versatile'];
const KEY = process.env.GROQ_API_KEY;
const DELAY_MS = 6000; // ~10 calls/min keeps us under the free-tier tokens/min cap
const MAX_RETRIES = 6;
const INPUT_CHARS = 800; // the 議案要旨 leads with the substance; cap tokens (and daily cap)

type Cache = Record<string, { hash: string; text: string }>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

const SYSTEM =
  'あなたは日本の法律案を一般市民向けに要約する専門家です。提供された議案要旨や本文をもとに、' +
  'その法案が「何を・どう変えるのか」を、専門用語を避けた平易な日本語で2文以内・120字程度にまとめてください。' +
  '前置きや「この法案は」等の繰り返しは省き、要点のみを述べてください。';

/** Seconds to wait from a 429: prefer retry-after header, else parse the message. */
function retryAfterSec(e: any): number {
  const hdr = Number(e?.headers?.['retry-after'] ?? e?.response?.headers?.get?.('retry-after'));
  if (Number.isFinite(hdr) && hdr > 0) return hdr;
  const m = String(e?.message ?? '').match(/try again in ([\d.]+)\s*s/i);
  if (m) return Math.ceil(parseFloat(m[1]));
  return 12;
}

const isDailyCap = (e: any) => /per day|TPD/i.test(String(e?.message ?? ''));

/** Models exhausted for the day, so we stop trying them this run. */
const exhausted = new Set<string>();

function nextModel(): string | null {
  return MODELS.find((m) => !exhausted.has(m)) ?? null;
}

async function summarizeOne(client: OpenAI, content: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const model = nextModel();
    if (!model) throw new Error('all models exhausted for today');
    try {
      const res = await client.chat.completions.create({
        model,
        temperature: 0.3,
        max_tokens: 180,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: content.slice(0, INPUT_CHARS) }
        ]
      });
      return (res.choices[0]?.message?.content ?? '').trim();
    } catch (e: any) {
      const status = e?.status ?? e?.response?.status;
      if (status === 429 && isDailyCap(e)) {
        console.log(`  · ${model} daily token cap reached — switching model`);
        exhausted.add(model);
        continue; // try the next model immediately
      }
      if (status === 429 && attempt < MAX_RETRIES) {
        const wait = Math.min(retryAfterSec(e) + 1, 60);
        console.log(`  · rate limited, waiting ${wait}s (retry ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(wait * 1000);
        continue;
      }
      throw e;
    }
  }
}

async function main() {
  const cache: Cache = existsSync(SUMMARIES) ? JSON.parse(readFileSync(SUMMARIES, 'utf8')) : {};

  if (!KEY) {
    console.warn('GROQ_API_KEY not set — skipping summary generation (existing cache kept).');
    writeFlat(cache);
    return;
  }

  const client = new OpenAI({ apiKey: KEY, baseURL: 'https://api.groq.com/openai/v1' });
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.txt'));

  let made = 0;
  let skipped = 0;
  for (const f of files) {
    const id = f.replace(/\.txt$/, '');
    const content = readFileSync(join(CONTENT_DIR, f), 'utf8').trim();
    if (content.length < 80) continue; // no usable outline
    const hash = sha(content);
    if (cache[id]?.hash === hash) {
      skipped++;
      continue;
    }
    try {
      const text = await summarizeOne(client, content);
      if (text) {
        cache[id] = { hash, text };
        made++;
        console.log(`✓ ${id}  ${text.slice(0, 40)}…`);
        writeFlat(cache); // checkpoint after each success
      }
    } catch (e: any) {
      if (/all models exhausted/.test(String(e?.message))) {
        console.warn('All free-tier model budgets exhausted for today — stopping; the daily run will backfill the rest.');
        break;
      }
      const status = e?.status ?? e?.response?.status;
      console.warn(`! ${id} failed (${status ?? e?.message}) — will backfill next run`);
    }
    await sleep(DELAY_MS);
  }
  console.log(`Done. ${made} summaries generated, ${skipped} unchanged.`);
}

/** Write both the rich cache and a flat id→text map for the build to merge. */
function writeFlat(cache: Cache) {
  writeFileSync(SUMMARIES, JSON.stringify(cache, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
