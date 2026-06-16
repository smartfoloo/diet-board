import { base } from '$app/paths';
import type { PageLoad } from './$types';
import type { Bill, Meta } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
  const [bills, meta] = await Promise.all([
    fetch(`${base}/bills.json`).then((r) => r.json() as Promise<Bill[]>),
    fetch(`${base}/meta.json`).then((r) => r.json() as Promise<Meta>)
  ]);
  return { bills, meta };
};
