// Fetch the official outline text for each bill so summaries are based on real
// content, not just the title. Preferred source: the sangiin meisai page (inline
// 議案要旨 prose). Fallback: the shugiin 本文 full text. Cached per bill so each is
// fetched only once; re-run only refetches bills missing a cache file.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** @typedef {import('../src/lib/types.js').Bill} Bill */

const ROOT = join(import.meta.dirname, '..');
const CONTENT_DIR = join(ROOT, 'data', 'content');
const BILLS = join(ROOT, 'static', 'bills.json');

const DELAY_MS = 700; // polite crawl
const MAX_CHARS = 1800; // bound LLM token cost

/** @param {number} ms */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} html
 * @returns {string}
 */
function htmlToText(html) {
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

const FOOTER =
  /(議案要旨のPDF|議案等のファイル|提出法律案|成立法律|委員会の修正案|ページの先頭|このページのトップ|議案審議情報一覧|利用案内|著作権|免責事項|ご意見・ご質問|Copyright|All rights reserved|お問い合わせ|サイトマップ|関連リンク)/;

/**
 * Pull the 議案要旨 section out of a sangiin meisai page.
 * @param {string} text
 * @returns {string | null}
 */
function extractYoushi(text) {
  const i = text.indexOf('議案要旨');
  if (i < 0) return null;
  let body = text.slice(i + '議案要旨'.length);
  const f = body.search(FOOTER);
  if (f > 0) body = body.slice(0, f);
  body = body.replace(/^[\s\n（(][^\n]*要旨\s*$/m, '').trim();
  // Require some substance (a stub page just repeats the title).
  return body.length > 80 ? body.slice(0, MAX_CHARS) : null;
}

/**
 * Take the substantive head of a shugiin 本文 page.
 * @param {string} text
 * @returns {string | null}
 */
function extractHonbun(text) {
  // Some shugiin URLs are a "本文情報一覧" index page (navigation, not the bill) — skip.
  if (/本文情報一覧|照会できる情報の一覧/.test(text)) return null;
  const i = text.search(/(提案理由|第一条|目次)/);
  const body = (i > 0 ? text.slice(i) : text).trim();
  return body.length > 80 ? body.slice(0, MAX_CHARS) : null;
}

/**
 * Normalize a charset label to one TextDecoder understands.
 * @param {string | undefined} label
 * @returns {string}
 */
function normalizeCharset(label) {
  const c = (label ?? '').toLowerCase().trim();
  if (/shift_?jis|sjis|x-sjis|windows-31j|ms_kanji/.test(c)) return 'shift_jis';
  if (/euc-?jp/.test(c)) return 'euc-jp';
  return 'utf-8';
}

/**
 * @param {string} url
 * @returns {Promise<string | null>}
 */
async function fetchText(url) {
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

/**
 * @param {Bill} bill
 * @returns {Promise<string | null>}
 */
async function contentFor(bill) {
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
  /** @type {Bill[]} */
  const bills = JSON.parse(readFileSync(BILLS, 'utf8'));
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
