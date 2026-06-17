// Parse the Gemini Markdown contract into structure.
//
//   TITLE: <plain-language title>
//   SUMMARY: <one or two sentences>
//   ## <section heading>
//   body paragraph(s)
//   - bullet
//   ## <next heading> …
//
// Grounding (googleSearch) can't be combined with enforced JSON output, so we ask for this
// simple Markdown and parse it ourselves.

/**
 * @typedef {object} AiSection
 * @property {string} heading
 * @property {string} body
 * @property {string[]} bullets
 */
/**
 * @typedef {object} AiContent
 * @property {string} plainTitle
 * @property {string} oneLiner
 * @property {AiSection[]} sections
 */

// The model sometimes emits arrows as LaTeX ($\rightarrow$), ASCII (->), or other unicode
// (⇒). Normalise them all to a literal "→" so the UI never shows raw markup.
/**
 * @param {string} s
 * @returns {string}
 */
function normalizeArrows(s) {
  return s
    .replace(/\$([^$]*?)\\?(?:rightarrow|longrightarrow|Rightarrow|to)([^$]*?)\$/g, '$1→$2')
    .replace(/\\(?:rightarrow|longrightarrow|Rightarrow|to)\b/g, '→')
    .replace(/[⇒⟶➡]/g, '→')
    .replace(/\s*(?:->|=>|―>|—>)\s*/g, ' → ');
}

/**
 * @param {string} s
 * @returns {string}
 */
function clean(s) {
  // Strip leading markdown markers/space, but KEEP **bold** so the UI can render it.
  return normalizeArrows(s.replace(/^[#\s>]+/, '')).trim();
}

// The plain title should never carry bold markers.
/**
 * @param {string} s
 * @returns {string}
 */
const stripBold = (s) => s.replace(/\*\*/g, '').trim();

/**
 * @param {string} text
 * @returns {AiContent | null}
 */
export function parseAiMarkdown(text) {
  if (!text) return null;
  const lines = text.replace(/\r/g, '').split('\n');

  let plainTitle = '';
  let oneLiner = '';
  /** @type {AiSection[]} */
  const sections = [];
  /** @type {AiSection | null} */
  let cur = null;

  const flush = () => {
    if (cur) {
      cur.body = cur.body.trim();
      sections.push(cur);
      cur = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (!t) {
      if (cur && cur.body) cur.body += '\n';
      continue;
    }

    const mTitle = t.match(/^TITLE\s*[:：]\s*(.+)$/i);
    if (mTitle) {
      plainTitle = stripBold(clean(mTitle[1]));
      continue;
    }
    const mSummary = t.match(/^SUMMARY\s*[:：]\s*(.+)$/i);
    if (mSummary) {
      oneLiner = stripBold(clean(mSummary[1]));
      continue;
    }
    // Section heading: "## ..." or "### ..." (also tolerate "■"/"●" leaders).
    const mHead = t.match(/^(?:#{2,4}\s+|[■●▶]\s*)(.+)$/);
    if (mHead) {
      flush();
      cur = { heading: stripBold(clean(mHead[1])), body: '', bullets: [] };
      continue;
    }
    // Bullet
    const mBullet = t.match(/^[-*・]\s+(.+)$/);
    if (mBullet && cur) {
      cur.bullets.push(clean(mBullet[1]));
      continue;
    }
    // Body line
    if (cur) {
      cur.body += (cur.body && !cur.body.endsWith('\n') ? '' : '') + clean(t) + '\n';
    } else if (!plainTitle && !oneLiner) {
      // Stray leading prose before any marker → treat as oneLiner.
      oneLiner = clean(t);
    }
  }
  flush();

  // Normalise body whitespace.
  for (const s of sections) s.body = s.body.replace(/\n{2,}/g, '\n').trim();

  if (!plainTitle && !oneLiner && sections.length === 0) return null;
  return { plainTitle, oneLiner, sections };
}
