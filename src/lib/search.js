// Free-text bill search. The official 法案名 alone misses a lot — beginners search by the
// plain-language title, a phrase from the summary, or a party/submitter name. Match across all
// of those with a simple case-insensitive substring (no fuzzy), keeping the prior behavior's
// predictability.

/** @typedef {import('./types.js').Bill} Bill */

/**
 * @param {Bill} bill
 * @returns {string} lowercased haystack of every searchable field
 */
function haystack(bill) {
  return [
    bill.title,
    bill.ai?.plainTitle,
    bill.ai?.oneLiner,
    bill.category,
    bill.submitter,
    ...(bill.submitterParties ?? [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/**
 * @param {Bill} bill
 * @param {string} q raw query; empty/whitespace matches everything
 * @returns {boolean}
 */
export function matchesQuery(bill, q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return haystack(bill).includes(needle);
}
