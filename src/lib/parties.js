// Faction (会派) normalization + brand colors.
// Faction names in the data carry suffixes like 「・無所属」「・無所属クラブ」「・無所属の会」.
// We normalize to a canonical key and assign a stable color.

/**
 * @typedef {object} PartyDef
 * @property {string} key
 * @property {string} label
 * @property {string} color
 * @property {RegExp} match
 */

// Order matters: first match wins.
/** @type {PartyDef[]} */
export const PARTIES = [
  { key: 'cabinet', label: '内閣', color: '#6b6457', match: /内閣/ },
  { key: 'ldp', label: '自由民主党', color: '#d6322e', match: /自由民主党|自民/ },
  { key: 'cdp', label: '立憲民主党', color: '#1b50a4', match: /立憲民主党|立憲/ },
  { key: 'komeito', label: '公明党', color: '#d4528f', match: /公明/ },
  { key: 'ishin', label: '日本維新の会', color: '#7bbf3f', match: /維新/ },
  { key: 'dpp', label: '国民民主党', color: '#e8b21f', match: /国民民主党|国民民主/ },
  { key: 'jcp', label: '日本共産党', color: '#c0322e', match: /共産/ },
  { key: 'reiwa', label: 'れいわ新選組', color: '#b8367f', match: /れいわ/ },
  { key: 'sdp', label: '社会民主党', color: '#1aa0c8', match: /社会民主|社民/ },
  { key: 'sanseito', label: '参政党', color: '#e3601f', match: /参政/ },
  { key: 'conservative', label: '日本保守党', color: '#1f3a6e', match: /保守党|減税保守/ },
  { key: 'mirai', label: 'チームみらい', color: '#15b8a6', match: /みらい/ },
  { key: 'chudo', label: '中道改革連合', color: '#5b6fb0', match: /中道改革/ },
  { key: 'yushi', label: '有志の会', color: '#8a7a5c', match: /有志/ },
  { key: 'chair', label: '委員長提出', color: '#7d7468', match: /委員長|議院運営/ }
];

/** @type {PartyDef} */
const OTHER = { key: 'other', label: 'その他・無所属', color: '#9a9182', match: /.*/ };

/**
 * Split a raw faction cell (semicolon-separated) into trimmed names.
 * @param {string | undefined | null} raw
 * @returns {string[]}
 */
export function splitFactions(raw) {
  if (!raw) return [];
  return raw
    .split(/[;；]/)
    .map((s) => s.replace(/[\s　]+/g, '').trim())
    .filter(Boolean);
}

/**
 * @param {string} name
 * @returns {PartyDef}
 */
export function partyFor(name) {
  for (const p of PARTIES) if (p.match.test(name)) return p;
  return OTHER;
}

/**
 * Canonical key for the primary (first) submitting faction.
 * @param {string[]} factions
 * @returns {string | null}
 */
export function primaryPartyKey(factions) {
  if (!factions.length) return null;
  return partyFor(factions[0]).key;
}

/**
 * @param {string | null} key
 * @returns {string}
 */
export function partyColor(key) {
  if (!key) return OTHER.color;
  const p = PARTIES.find((x) => x.key === key);
  return p ? p.color : OTHER.color;
}

/**
 * @param {string | null} key
 * @returns {string}
 */
export function partyLabel(key) {
  if (!key) return OTHER.label;
  const p = PARTIES.find((x) => x.key === key);
  return p ? p.label : OTHER.label;
}

/** @returns {PartyDef[]} */
export function allPartyDefs() {
  return [...PARTIES, OTHER];
}
