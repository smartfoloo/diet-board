<script>
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import SegmentedTabs from '$lib/components/SegmentedTabs.svelte';

  /** @typedef {import('$lib/types.js').Meta} Meta */

  /**
   * @type {{
   *   meta: Meta,
   *   view: 'digest' | 'simple' | 'board' | 'recent',
   *   total: number,
   *   shown: number
   * }}
   */
  let { meta, view = $bindable(), total, shown } = $props();

  const viewTabs = [
    { value: 'digest', label: 'ダイジェスト' },
    { value: 'simple', label: '一覧' },
    { value: 'board', label: 'ボード' },
    { value: 'recent', label: '動き' }
  ];
</script>

<!-- Floating pill toolbar -->
<div class="fixed inset-x-0 top-0 z-20 px-3">
  <div
    class="mx-auto mt-2.5 flex max-w-[1100px] items-center gap-2 rounded-pill border border-line bg-surface/85 px-2.5 py-1.5 shadow-card-hover backdrop-blur supports-[backdrop-filter]:bg-surface/70 sm:gap-3 sm:px-3.5"
  >
    <!-- Brand -->
    <div class="hidden items-baseline gap-2 sm:flex">
      <span class="text-sm font-bold tracking-tight text-ink">国会ボード</span>
      <span class="rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-deep">
        第{meta.session}回国会
      </span>
    </div>

    <span class="hidden h-5 w-px bg-line sm:block" aria-hidden="true"></span>

    <!-- View tabs (primary) -->
    <SegmentedTabs bind:value={view} options={viewTabs} ariaLabel="表示切り替え" />

    <div class="ml-auto flex items-center gap-2 sm:gap-2.5">
      <span class="hidden text-xs text-ink-faint tabular-nums sm:inline">
        {shown} / {total} 件
      </span>
      <span class="hidden h-5 w-px bg-line sm:block" aria-hidden="true"></span>
      <ThemeToggle />
    </div>
  </div>
</div>
