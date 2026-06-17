// The source material we feed the LLM for a bill, and which we hash to decide whether a
// cached AI explanation is still fresh. Shared by summarize.js (generation) and
// build-data.js (cache verification) so both compute the identical hash.
import { createHash } from 'node:crypto';

/** @typedef {import('../src/lib/types.js').Bill} Bill */

// Bump to force regeneration when the prompt/output format changes. build-data and
// summarize both read this so cached entries from an older prompt are dropped.
export const PROMPT_VERSION = 7;

/**
 * @param {Pick<Bill, 'title' | 'billType' | 'submitter' | 'outline'>} bill
 * @returns {string}
 */
export function buildAiInput(bill) {
  const parts = [`法案名: ${bill.title}`, `種類: ${bill.billType}`, `提出者: ${bill.submitter}`];
  if (bill.outline) {
    parts.push(`\n【議案要旨】\n${bill.outline.lead}`);
    for (const p of bill.outline.points) {
      parts.push(`■ ${p.heading}${p.body ? `\n${p.body}` : ''}`);
    }
    if (bill.outline.enforcement) parts.push(`施行: ${bill.outline.enforcement}`);
  } else {
    parts.push('（公式の議案要旨は未公表。検索で補ってください）');
  }
  return parts.join('\n');
}

/**
 * @param {string} input
 * @returns {string}
 */
export const aiHash = (input) => createHash('sha256').update(input).digest('hex').slice(0, 16);
