// Fetch the official outline text for each bill so summaries are based on real
// content, not just the title. Preferred source: the sangiin meisai page (inline
// 議案要旨 prose). Fallback: the shugiin 本文 full text. Cached per bill so each is
// fetched only once; re-run only refetches bills missing a cache file.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Bill } from '../src/lib/types';

const ROOT = join(import.meta.dirname, '..');
const CONTENT_DIR = join(ROOT, 'data', 'content');
const BILLS = join(ROOT, 'static', 'bills.json');

const DELAY_MS = 700; // polite crawl
const MAX_CHARS = 1800; // bound LLM token cost

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/[ \t　]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

const FOOTER = /(ページの先頭|このページのトップ|議案審議情報一覧|Copyright|お問い合わせ|サイトマップ|関連リンク)/;

/** Pull the 議案要旨 section out of a sangiin meisai page. */
function extractYoushi(text: string): string | null {
  const i = text.indexOf('議案要旨');
  if (i < 0) return null;
  let body = text.slice(i + '議案要旨'.length);
  const f = body.search(FOOTER);
  if (f > 0) body = body.slice(0, f);
  body = body.replace(/^[\s\n（(][^\n]*要旨\s*$/m, '').trim();
  // Require some substance (a stub page just repeats the title).
  return body.length > 80 ? body.slice(0, MAX_CHARS) : null;
}

/** Take the substantive head of a shugiin 本文 page. */
function extractHonbun(text: string): string | null {
  const i = text.search(/(本文|提案理由|第一条|目次)/);
  const body = (i > 0 ? text.slice(i) : text).trim();
  return body.length > 80 ? body.slice(0, MAX_CHARS) : null;
}

/** Normalize a charset label to one TextDecoder understands. */
function normalizeCharset(label: string | undefined): string {
  const c = (label ?? '').toLowerCase().trim();
  if (/shift_?jis|sjis|x-sjis|windows-31j|ms_kanji/.test(c)) return 'shift_jis';
  if (/euc-?jp/.test(c)) return 'euc-jp';
  return 'utf-8';
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'kokkai-visu/0.1 (research)' } });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    // sangiin meisai pages are UTF-8; shugiin 本文 pages are Shift_JIS. Detect from
    // the Content-Type header, falling back to the <meta charset> in the markup.
    let charset = res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1];
    if (!charset) {
      const head = new TextDecoder('latin1').decode(buf.slice(0, 2048));
      charset = head.match(/charset=["']?([\w-]+)/i)?.[1];
    }
    return new TextDecoder(normalizeCharset(charset)).decode(buf);
  } catch {
    return null;
  }
}

async function contentFor(bill: Bill): Promise<string | null> {
  if (bill.links.detail) {
    const html = await fetchText(bill.links.detail);
    if (html) {
      const y = extractYoushi(htmlToText(html));
      if (y) return y;
    }
    await sleep(DELAY_MS);
  }
  if (bill.links.fullText) {
    const html = await fetchText(bill.links.fullText);
    if (html) return extractHonbun(htmlToText(html));
  }
  return null;
}

async function main() {
  const bills: Bill[] = JSON.parse(readFileSync(BILLS, 'utf8'));
  mkdirSync(CONTENT_DIR, { recursive: true });

  let fetched = 0;
  let cached = 0;
  for (const bill of bills) {
    const path = join(CONTENT_DIR, `${bill.id}.txt`);
    if (existsSync(path)) {
      cached++;
      continue;
    }
    const text = await contentFor(bill);
    writeFileSync(path, text ?? ''); // write empty marker so we don't retry forever
    if (text) {
      fetched++;
      console.log(`✓ ${bill.id}  ${bill.title.slice(0, 28)}…  (${text.length} chars)`);
    } else {
      console.log(`· ${bill.id}  no outline available`);
    }
    await sleep(DELAY_MS);
  }
  console.log(`Done. ${fetched} fetched, ${cached} already cached.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
