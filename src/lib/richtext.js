// Split text containing **bold** markers into segments so the UI can render <strong>
// without using {@html} (avoids XSS from model output).

/**
 * @typedef {object} Segment
 * @property {string} text
 * @property {boolean} bold
 */

/**
 * @param {string} text
 * @returns {Segment[]}
 */
export function boldSegments(text) {
  /** @type {Segment[]} */
  const out = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  /** @type {RegExpExecArray | null} */
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), bold: false });
  return out.length ? out : [{ text, bold: false }];
}
