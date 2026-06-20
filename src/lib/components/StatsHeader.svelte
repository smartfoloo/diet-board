<script>
  import { simpleStatus } from '$lib/status';

  /** @typedef {import('$lib/types.js').Bill} Bill */
  /** @typedef {import('$lib/types.js').Meta} Meta */
  /** @typedef {import('$lib/status.js').Tone} Tone */

  /** @type {{ bills: Bill[], meta: Meta }} */
  let { bills, meta } = $props();

  const counts = $derived.by(() => {
    /** @type {Record<Tone, number>} */
    const c = { new: 0, active: 0, done: 0, failed: 0 };
    for (const b of bills) c[simpleStatus(b).tone]++;
    return c;
  });

  const total = $derived(bills.length);
  const passRate = $derived(total ? Math.round((counts.done / total) * 100) : 0);

  const stats = $derived([
    { label: '提出', value: counts.new, dot: '#a1a1aa' },
    { label: '審議中', value: counts.active, dot: '#0d9488' },
    { label: '成立', value: counts.done, dot: '#16a34a' },
    { label: '廃案', value: counts.failed, dot: '#71717a' }
  ]);
</script>

<section class="mb-8 text-center">
  <!-- National Diet Building (国会議事堂) -->
  <svg
    class="mx-auto h-24 w-auto opacity-80 sm:h-28"
    viewBox="0 0 320 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="0" y="138" width="320" height="2" fill="#c7ccd6" />
    <rect x="20" y="92" width="100" height="46" fill="#cdd3df" />
    <rect x="200" y="92" width="100" height="46" fill="#cdd3df" />
    <rect x="20" y="86" width="100" height="8" fill="#bcc3d1" />
    <rect x="200" y="86" width="100" height="8" fill="#bcc3d1" />
    {#each [28, 42, 56, 70, 84, 98] as x}
      <rect {x} y="98" width="6" height="40" fill="#dde2eb" />
    {/each}
    {#each [208, 222, 236, 250, 264, 278] as x}
      <rect {x} y="98" width="6" height="40" fill="#dde2eb" />
    {/each}
    <rect x="120" y="70" width="80" height="68" fill="#d5dae5" />
    <rect x="120" y="64" width="80" height="8" fill="#c2c9d7" />
    {#each [130, 146, 162, 178, 192] as x}
      <rect {x} y="76" width="7" height="62" fill="#e4e8f0" />
    {/each}
    <rect x="142" y="40" width="36" height="26" fill="#c6cdda" />
    <rect x="146" y="30" width="28" height="12" fill="#b9c0cf" />
    <rect x="150" y="22" width="20" height="10" fill="#aab2c3" />
    <polygon points="160,8 150,24 170,24" fill="#9aa3b6" />
    <rect x="154" y="116" width="12" height="22" fill="#aab2c3" />
  </svg>

  <h1 class="mt-4 text-xl font-bold text-ink sm:text-2xl">いま国会で動いている法案</h1>
  <p class="mt-1.5 text-sm text-ink-soft">
    第{meta.session}回国会（{meta.sessionType}）に提出された{total}件の法案の審議状況をまとめています。
  </p>

  <!-- Compact stats row -->
  <div class="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
    {#each stats as s}
      <div class="flex items-center gap-1.5">
        <span class="h-2 w-2 rounded-full shrink-0" style="background:{s.dot}"></span>
        <span class="text-xs text-ink-soft">{s.label}</span>
        <span class="text-sm font-semibold tabular-nums text-ink">{s.value}</span>
      </div>
    {/each}
    <div class="flex items-center gap-1.5 border-l border-line pl-5">
      <span class="text-xs text-ink-soft">成立率</span>
      <span class="text-sm font-semibold tabular-nums text-success-ink">{passRate}%</span>
    </div>
  </div>
</section>
