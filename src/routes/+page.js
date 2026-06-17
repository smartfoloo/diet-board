import { base } from '$app/paths';

/** @type {import('./$types').PageLoad} */
export const load = async ({ fetch }) => {
  const [bills, meta] = await Promise.all([
    /** @type {Promise<import('$lib/types.js').Bill[]>} */ (
      fetch(`${base}/bills.json`).then((r) => r.json())
    ),
    /** @type {Promise<import('$lib/types.js').Meta>} */ (
      fetch(`${base}/meta.json`).then((r) => r.json())
    )
  ]);
  return { bills, meta };
};
