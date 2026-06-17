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
  // 成立率: enacted as a share of all bills this session.
  const passRate = $derived(total ? Math.round((counts.done / total) * 100) : 0);

  const stats = $derived([
    { label: '提出', value: counts.new, dot: '#98a0ab', hint: '出されたばかり' },
    { label: '審議中', value: counts.active, dot: '#2f6fb0', hint: '議論が進行中' },
    { label: '成立', value: counts.done, dot: '#4e9e6e', hint: '法律になった' },
    { label: '廃案', value: counts.failed, dot: '#b0b6bf', hint: '見送り・未了' }
  ]);

  const updated = $derived(
    meta.updatedAt.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1年$2月$3日')
  );
</script>

<section class="mb-8 overflow-hidden rounded-card border border-line bg-surface">
  <div class="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
    <!-- Left: Diet building illustration + session info -->
    <div
      class="relative flex flex-col justify-end overflow-hidden bg-gradient-to-b from-[#eef1f6] to-[#e3e8f0] p-5 sm:p-6"
    >
      <!-- National Diet Building (国会議事堂) -->
      <svg
        class="pointer-events-none absolute inset-x-0 top-3 mx-auto h-28 w-auto opacity-90 sm:top-4 sm:h-32"
        viewBox="0 0 320 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <!-- ground line -->
        <rect x="0" y="138" width="320" height="2" fill="#c7ccd6" />
        <!-- left & right wings -->
        <rect x="20" y="92" width="100" height="46" fill="#cdd3df" />
        <rect x="200" y="92" width="100" height="46" fill="#cdd3df" />
        <rect x="20" y="86" width="100" height="8" fill="#bcc3d1" />
        <rect x="200" y="86" width="100" height="8" fill="#bcc3d1" />
        <!-- wing columns -->
        {#each [28, 42, 56, 70, 84, 98] as x}
          <rect {x} y="98" width="6" height="40" fill="#dde2eb" />
        {/each}
        {#each [208, 222, 236, 250, 264, 278] as x}
          <rect {x} y="98" width="6" height="40" fill="#dde2eb" />
        {/each}
        <!-- central block -->
        <rect x="120" y="70" width="80" height="68" fill="#d5dae5" />
        <rect x="120" y="64" width="80" height="8" fill="#c2c9d7" />
        {#each [130, 146, 162, 178, 192] as x}
          <rect {x} y="76" width="7" height="62" fill="#e4e8f0" />
        {/each}
        <!-- central tower (stepped pyramid roof) -->
        <rect x="142" y="40" width="36" height="26" fill="#c6cdda" />
        <rect x="146" y="30" width="28" height="12" fill="#b9c0cf" />
        <rect x="150" y="22" width="20" height="10" fill="#aab2c3" />
        <polygon points="160,8 150,24 170,24" fill="#9aa3b6" />
        <!-- doorway -->
        <rect x="154" y="116" width="12" height="22" fill="#aab2c3" />
      </svg>

      <div class="relative mt-24 sm:mt-28">
        <p class="text-[11px] font-medium uppercase tracking-wide text-ink-faint">会期</p>
        <p class="text-2xl font-bold tracking-tight text-ink">
          第{meta.session}回国会
          <span class="ml-1 align-middle text-sm font-medium text-ink-soft">{meta.sessionType}</span>
        </p>
        <p class="mt-1 text-xs text-ink-faint">最終更新: {updated}</p>
      </div>
    </div>

    <!-- Right: progress breakdown + pass rate -->
    <div class="flex flex-col gap-4 p-5 sm:p-6">
      <div class="flex items-baseline justify-between">
        <h2 class="text-sm font-bold text-ink">国会の動き</h2>
        <span class="text-xs text-ink-faint tabular-nums">全 {total} 件</span>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {#each stats as s}
          <div class="rounded-card border border-line bg-canvas-deep/40 p-3">
            <span class="flex items-center gap-1.5 text-[11px] text-ink-soft">
              <span class="h-2 w-2 rounded-full" style="background:{s.dot}"></span>
              {s.label}
            </span>
            <p class="mt-1 text-2xl font-bold tabular-nums text-ink">{s.value}</p>
          </div>
        {/each}
      </div>

      <!-- Pass rate -->
      <div class="rounded-card border border-line bg-canvas-deep/40 p-3.5">
        <div class="mb-1.5 flex items-baseline justify-between">
          <span class="text-xs font-medium text-ink-soft">成立率</span>
          <span class="text-lg font-bold tabular-nums text-success-ink">{passRate}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-pill bg-line">
          <div class="h-full rounded-pill bg-success" style="width:{passRate}%"></div>
        </div>
        <p class="mt-1.5 text-[11px] text-ink-faint">
          今国会に提出された{total}件のうち{counts.done}件が成立しました。
        </p>
      </div>
    </div>
  </div>
</section>
