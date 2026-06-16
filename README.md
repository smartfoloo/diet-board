# 国会ビジュアライザー — Diet Bill Tracker

A Kanban-style board that shows what's moving through the Japanese Diet (国会) **right
now**. Columns are legislative stages (提出 → 委員会審議 → 本会議 → 参議院 → 成立・廃案);
each card is a bill colored by submitting party, tagged by policy category, and tinted
when it has been stuck in a stage unusually long. Click a card for a plain-language
summary, the party vote breakdown, a stage-by-stage timeline, and official links.

You land directly in the board — no homepage. Filters (会派 / 分野 / 段階 / 検索) live in
the top bar and in the URL, so any filtered view is shareable.

## Data

All bill data comes from the **SmartNews Media Research Institute** datasets, which are
scraped daily from the official shugiin.go.jp / sangiin.go.jp sites and published as
MIT-licensed CSV/JSON:

- House of Representatives — https://github.com/smartnews-smri/house-of-representatives
- House of Councillors — https://github.com/smartnews-smri/house-of-councillors

The House of Representatives dataset is the spine (deliberation status, era-formatted
stage dates, faction for/against votes); the House of Councillors dataset enriches each
bill with the sangiin outline URL and numeric roll-call tallies.

Plain-language summaries are generated from each bill's official **議案要旨 (outline)** —
fetched as inline text from the sangiin detail page (or the shugiin 本文 as fallback) —
not from the title alone.

## Pipeline

```
SMRI CSVs ─► scripts/build-data.ts ─► static/{bills,meta}.json
                                       ▲
scripts/fetch-content.ts ─► data/content/<id>.txt
scripts/summarize.ts (Groq) ─► data/summaries.json
```

| Command | What it does |
|---------|--------------|
| `npm run data` | Fetch SMRI CSVs, normalize, merge both houses, classify category, compute stage/heat, fold in cached summaries → `static/bills.json` + `static/meta.json`. |
| `npm run data:content` | Fetch each bill's official outline text (cached per bill in `data/content/`). |
| `npm run data:summaries` | Summarize outline text via Groq (`llama-3.3-70b-versatile`), cached by content hash in `data/summaries.json`. Skips silently if `GROQ_API_KEY` is unset, and stops gracefully when the free-tier daily token cap is hit (the next run backfills). |
| `npm run data:all` | All of the above, then re-run `data` to fold summaries in. |

`SESSION=<n>` selects a Diet session (defaults to the latest in the data, currently 221).

## Develop

```bash
npm install
npm run data        # generate static/bills.json (first run only; committed copy exists)
npm run dev         # http://localhost:5173
npm test            # unit tests (date parser, category classifier)
```

### Summaries (optional)

Get a free key at https://console.groq.com/keys, then:

```bash
echo "GROQ_API_KEY=gsk_..." >> .env   # auto-loaded by the scripts
npm run data:content && npm run data:summaries && npm run data
```

Summaries are generated from each bill's official outline (≈800 chars sent per call) by
`llama-3.3-70b-versatile`. A full session (~83 bills, ~77k tokens) fits under Groq's free
**100k-tokens/day** cap. If you exceed it (e.g. re-running repeatedly), the script stops
cleanly and the next run backfills the rest — summaries are cached per bill, so each is
generated only once. `build-data` only trusts a cached summary whose hash matches the
current outline text, so stale summaries never reach the UI. Smaller free models
(`8b-instant`) are intentionally not used as a fallback because they hallucinate facts.

## Deploy

`adapter-static` builds a static site. `.github/workflows/daily-build.yml` rebuilds the
data daily (after the SMRI refresh), regenerates summaries for any new bills, commits the
caches back, and deploys to **GitHub Pages**. Add a `GROQ_API_KEY` repository secret to
enable summaries in CI. To deploy on a project page, the workflow passes `BASE_PATH`
automatically.

## Stack

SvelteKit (Svelte 5 runes) · Vite · Tailwind CSS · TypeScript. Design language adapted
from [trackpolicy.org](https://trackpolicy.org/) — warm cream canvas, soft cards, blue
data accent, amber heat tints.
