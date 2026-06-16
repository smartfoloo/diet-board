// Build the unified bills.json + meta.json the front end consumes.
//
//   HoR gian.csv  ─┐
//                  ├─► merge by (session, normalized title) ─► Bill[] ─► static/bills.json
//   HoC gian.csv  ─┘                                                  └─► static/meta.json
//
// HoR is the rich spine (審議状況, era dates, faction for/against). HoC enriches with
// the sangiin outline URL and numeric roll-call tallies. Summaries (if cached by
// summarize.ts) are merged in from data/summaries.json.

import './load-env';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import Papa from 'papaparse';
import type { Bill, Meta, Stage, TimelineEvent, VoteRecord } from '../src/lib/types';
import { STAGES } from '../src/lib/types';
import { parseJpDate, daysSince } from './jpdate';
import { classify, allCategoryLabels } from './categories';
import { splitFactions, primaryPartyKey, allPartyDefs } from '../src/lib/parties';

const ROOT = join(import.meta.dirname, '..');
const RAW_DIR = join(ROOT, 'data', 'raw');
const CONTENT_DIR = join(ROOT, 'data', 'content');
const STATIC_DIR = join(ROOT, 'static');
const SUMMARIES = join(ROOT, 'data', 'summaries.json');

const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

/** A summary is only trusted if it was generated from the current outline text. */
function freshSummary(
  id: string,
  cache: Record<string, { hash: string; text: string }>
): string | null {
  const entry = cache[id];
  if (!entry) return null;
  const contentPath = join(CONTENT_DIR, `${id}.txt`);
  if (!existsSync(contentPath)) return null;
  const content = readFileSync(contentPath, 'utf8').trim();
  return sha(content) === entry.hash ? entry.text : null;
}

const HOR_URL =
  'https://raw.githubusercontent.com/smartnews-smri/house-of-representatives/master/data/gian.csv';
const HOC_URL =
  'https://raw.githubusercontent.com/smartnews-smri/house-of-councillors/master/data/gian.csv';

const SESSION = Number(process.env.SESSION ?? 0); // 0 → auto (latest)
const BILL_TYPES = new Set(['閣法', '衆法', '参法']); // 法律案 only for the MVP board

type Row = Record<string, string>;

async function fetchCsv(url: string, cacheName: string): Promise<Row[]> {
  mkdirSync(RAW_DIR, { recursive: true });
  const cache = join(RAW_DIR, cacheName);
  let text: string;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
    writeFileSync(cache, text);
  } catch (e) {
    if (existsSync(cache)) {
      console.warn(`! fetch ${url} failed (${e}); using cached ${cacheName}`);
      text = readFileSync(cache, 'utf8');
    } else {
      throw e;
    }
  }
  return Papa.parse<Row>(text, { header: true, skipEmptyLines: true }).data;
}

function norm(title: string): string {
  return title.replace(/[\s　]+/g, '').replace(/[（(].*?[)）]/g, '');
}

function latestSession(rows: Row[], key: string): number {
  return rows.reduce((max, r) => Math.max(max, Number(r[key]) || 0), 0);
}

// --- HoC index: normalized title → row (for the chosen session) -------------
function indexHoC(rows: Row[], session: number): Map<string, Row> {
  const idx = new Map<string, Row>();
  for (const r of rows) {
    if (Number(r['審議回次']) !== session) continue;
    idx.set(norm(r['件名'] ?? ''), r);
  }
  return idx;
}

// --- Stage derivation -------------------------------------------------------
const FAILED_STATUSES = /未了|撤回|否決|承諾なし|不承認|閉会中審査/;

function deriveStage(
  hor: Row,
  origin: '衆' | '参'
): { stage: Stage; finalState: '成立' | '廃案' | null } {
  const status = hor['審議状況'] ?? '';
  if (/成立|公布|可決成立/.test(status)) return { stage: '成立', finalState: '成立' };
  if (FAILED_STATUSES.test(status)) return { stage: '廃案', finalState: '廃案' };

  // In-progress: pick furthest reached milestone from populated date columns.
  const has = (col: string) => !!parseJpDate(hor[col]);
  // Sangiin reached?
  if (
    has('参議院付託年月日／参議院付託委員会') ||
    has('参議院議案受理年月日') ||
    /参議院/.test(status)
  ) {
    return { stage: '参議院', finalState: null };
  }
  // First-house plenary?
  if (has('衆議院審査終了年月日／衆議院審査結果') || has('衆議院審議終了年月日／衆議院審議結果')) {
    return { stage: '本会議', finalState: null };
  }
  // Committee?
  if (has('衆議院付託年月日／衆議院付託委員会')) {
    return { stage: '委員会審議', finalState: null };
  }
  return { stage: '提出', finalState: null };
}

function stageEntryDate(hor: Row, stage: Stage): string | null {
  switch (stage) {
    case '提出':
      return parseJpDate(hor['衆議院議案受理年月日']) ?? parseJpDate(hor['衆議院予備審査議案受理年月日']);
    case '委員会審議':
      return parseJpDate(hor['衆議院付託年月日／衆議院付託委員会']);
    case '本会議':
      return (
        parseJpDate(hor['衆議院審査終了年月日／衆議院審査結果']) ??
        parseJpDate(hor['衆議院付託年月日／衆議院付託委員会'])
      );
    case '参議院':
      return (
        parseJpDate(hor['参議院付託年月日／参議院付託委員会']) ??
        parseJpDate(hor['参議院議案受理年月日'])
      );
    case '成立':
      return parseJpDate(hor['公布年月日／法律番号']) ?? parseJpDate(hor['参議院審議終了年月日／参議院審議結果']);
    case '廃案':
      return (
        parseJpDate(hor['参議院審議終了年月日／参議院審議結果']) ??
        parseJpDate(hor['衆議院審議終了年月日／衆議院審議結果']) ??
        parseJpDate(hor['衆議院付託年月日／衆議院付託委員会'])
      );
  }
}

// --- Timeline ---------------------------------------------------------------
function buildTimeline(hor: Row): TimelineEvent[] {
  const ev: TimelineEvent[] = [];
  const push = (col: string, label: string, house?: '衆' | '参') => {
    const raw = hor[col];
    const date = parseJpDate(raw);
    if (!date) return;
    const after = (raw ?? '').split('／')[1]?.trim();
    ev.push({ date, label, house, detail: after || undefined });
  };
  push('衆議院議案受理年月日', '衆議院 受理', '衆');
  push('衆議院付託年月日／衆議院付託委員会', '衆議院 委員会付託', '衆');
  push('衆議院審査終了年月日／衆議院審査結果', '衆議院 委員会審査終了', '衆');
  push('衆議院審議終了年月日／衆議院審議結果', '衆議院 本会議議決', '衆');
  push('参議院議案受理年月日', '参議院 受理', '参');
  push('参議院付託年月日／参議院付託委員会', '参議院 委員会付託', '参');
  push('参議院審査終了年月日／参議院審査結果', '参議院 委員会審査終了', '参');
  push('参議院審議終了年月日／参議院審議結果', '参議院 本会議議決', '参');
  push('公布年月日／法律番号', '公布', undefined);
  return ev.sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : 0));
}

// --- Votes ------------------------------------------------------------------
function buildVotes(hor: Row, hoc: Row | undefined): VoteRecord[] {
  const votes: VoteRecord[] = [];
  const forF = splitFactions(hor['衆議院審議時賛成会派']);
  const againstF = splitFactions(hor['衆議院審議時反対会派']);
  if (forF.length || againstF.length || hor['衆議院審議時会派態度']) {
    votes.push({
      house: '衆',
      forParties: forF,
      againstParties: againstF,
      attitude: hor['衆議院審議時会派態度'] || undefined,
      result: (hor['衆議院審議終了年月日／衆議院審議結果'] ?? '').split('／')[1]?.trim() || undefined
    });
  }
  // HoC numeric roll-call (when present)
  if (hoc) {
    const tallyRaw = hoc['参議院本会議経過情報 - 投票結果'] ?? '';
    const m = tallyRaw.match(/賛成\s*(\d+).*?反対\s*(\d+)/s);
    const method = hoc['参議院本会議経過情報 - 採決方法'] || undefined;
    const result = hoc['参議院本会議経過情報 - 議決'] || undefined;
    if (m || method || result) {
      votes.push({
        house: '参',
        forParties: [],
        againstParties: [],
        method,
        result,
        tally: m ? { for: Number(m[1]), against: Number(m[2]) } : undefined
      });
    }
  }
  return votes;
}

async function main() {
  console.log('Fetching SMRI datasets…');
  const [horAll, hocAll] = await Promise.all([
    fetchCsv(HOR_URL, 'hor.csv'),
    fetchCsv(HOC_URL, 'hoc.csv')
  ]);

  const session = SESSION || latestSession(horAll, '掲載回次');
  console.log(`Session: ${session}`);

  const hocIdx = indexHoC(hocAll, session);
  const summaries: Record<string, { hash: string; text: string }> = existsSync(SUMMARIES)
    ? JSON.parse(readFileSync(SUMMARIES, 'utf8'))
    : {};

  const bills: Bill[] = [];
  for (const r of horAll) {
    if (Number(r['掲載回次']) !== session) continue;
    const billType = r['議案種類'] ?? '';
    if (!BILL_TYPES.has(billType)) continue;

    const title = (r['議案件名'] ?? '').trim();
    const number = Number(r['番号']) || 0;
    const origin: '衆' | '参' = billType === '参法' ? '参' : '衆';
    const hoc = hocIdx.get(norm(title));

    const { stage, finalState } = deriveStage(r, origin);
    const stageEnteredDate = stageEntryDate(r, stage);
    const submitterParties = splitFactions(r['議案提出会派']);

    const id = `${session}-${billType}-${number}`;
    bills.push({
      id,
      session,
      number,
      title,
      billType,
      submitter: (r['議案提出者'] ?? '').replace(/[\s　]+/g, '') || '内閣',
      submitterParty: r['議案提出者']?.includes('内閣')
        ? 'cabinet'
        : primaryPartyKey(submitterParties),
      submitterParties,
      category: classify(title),
      status: r['審議状況'] ?? '',
      stage,
      finalState,
      stageEnteredDate,
      daysInStage: daysSince(stageEnteredDate),
      heat: 'normal', // filled in after thresholds are known
      timeline: buildTimeline(r),
      votes: buildVotes(r, hoc),
      summary: freshSummary(id, summaries),
      links: {
        progress: r['経過情報URL'] || undefined,
        fullText: r['本文情報URL'] || undefined,
        detail: hoc?.['議案URL'] || undefined,
        outlinePdf: hoc?.['議案要旨'] || undefined
      }
    });
  }

  // --- Heat: per-stage median of daysInStage among active bills -------------
  const thresholds = computeHeatThresholds(bills);
  for (const b of bills) {
    b.heat = heatFor(b, thresholds);
  }

  bills.sort((a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage) || a.number - b.number);

  const meta: Meta = {
    session,
    updatedAt: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    billCount: bills.length,
    categories: allCategoryLabels(),
    parties: allPartyDefs().map((p) => ({ key: p.key, label: p.label, color: p.color })),
    heatThresholds: thresholds
  };

  mkdirSync(STATIC_DIR, { recursive: true });
  writeFileSync(join(STATIC_DIR, 'bills.json'), JSON.stringify(bills));
  writeFileSync(join(STATIC_DIR, 'meta.json'), JSON.stringify(meta, null, 2));

  const withSummary = bills.filter((b) => b.summary).length;
  console.log(
    `Wrote ${bills.length} bills (${withSummary} with summaries) → static/bills.json`
  );
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function computeHeatThresholds(bills: Bill[]): Record<Stage, { warm: number; hot: number }> {
  const out = {} as Record<Stage, { warm: number; hot: number }>;
  for (const stage of STAGES) {
    const active = bills.filter(
      (b) => b.stage === stage && b.finalState === null && b.daysInStage != null
    );
    const med = median(active.map((b) => b.daysInStage!));
    const base = Math.max(med, 7); // avoid hyper-sensitive heat on tiny medians
    out[stage] = { warm: Math.round(base * 1.5), hot: Math.round(base * 3) };
  }
  return out;
}

function heatFor(b: Bill, t: Record<Stage, { warm: number; hot: number }>) {
  if (b.finalState || b.daysInStage == null) return 'normal' as const;
  const th = t[b.stage];
  if (b.daysInStage >= th.hot) return 'hot' as const;
  if (b.daysInStage >= th.warm) return 'warm' as const;
  return 'normal' as const;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
