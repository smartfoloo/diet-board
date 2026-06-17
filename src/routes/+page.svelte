<script>
  import { browser } from '$app/environment';
  import { COLUMNS } from '$lib/types';
  import FilterBar from '$lib/components/FilterBar.svelte';
  import Column from '$lib/components/Column.svelte';
  import Feed from '$lib/components/Feed.svelte';
  import ActivityFeed from '$lib/components/ActivityFeed.svelte';
  import StatsHeader from '$lib/components/StatsHeader.svelte';
  import BillDetail from '$lib/components/BillDetail.svelte';

  /** @typedef {import('$lib/types.js').Bill} Bill */
  /** @typedef {import('$lib/types.js').Stage} Stage */

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
  const bills = $derived(data.bills);
  const meta = $derived(data.meta);

  // --- filters initialised from URL (browser only; SSR prerenders empty) --
  const sp = browser ? new URL(window.location.href).searchParams : new URLSearchParams();
  let filters = $state({
    party: sp.get('party') ?? '',
    category: sp.get('category') ?? '',
    stage: sp.get('stage') ?? '',
    q: sp.get('q') ?? ''
  });
  /** @type {'simple' | 'board' | 'recent'} */
  let view = $state(
    sp.get('view') === 'board' ? 'board' : sp.get('view') === 'recent' ? 'recent' : 'simple'
  );
  /** @type {'status' | 'category'} */
  let groupBy = $state(sp.get('group') === 'category' ? 'category' : 'status');

  /** @type {string | null} */
  let selectedId = $state(sp.get('bill'));
  /** @type {DOMRect | null} */
  let originRect = $state(null);
  const selected = $derived(bills.find((b) => b.id === selectedId) ?? null);

  // Parties that actually appear, for the filter dropdown.
  const visibleParties = $derived(
    /** @type {string[]} */ ([...new Set(bills.map((b) => b.submitterParty).filter(Boolean))])
  );

  // --- filtered set ------------------------------------------------------
  const filtered = $derived(
    bills.filter((b) => {
      if (filters.party && b.submitterParty !== filters.party) return false;
      if (filters.category && b.category !== filters.category) return false;
      // The 段階 filter only applies to the board (the feed groups by status instead).
      if (view === 'board' && filters.stage) {
        const inCol =
          filters.stage === '成立'
            ? b.stage === '成立' || b.stage === '廃案'
            : b.stage === filters.stage;
        if (!inCol) return false;
      }
      if (filters.q && !b.title.includes(filters.q)) return false;
      return true;
    })
  );

  /**
   * @param {Stage} stage
   * @returns {Bill[]}
   */
  function colBills(stage) {
    if (stage === '成立') return filtered.filter((b) => b.stage === '成立' || b.stage === '廃案');
    return filtered.filter((b) => b.stage === stage);
  }

  /**
   * @param {Bill} b
   * @param {DOMRect} rect
   */
  function select(b, rect) {
    originRect = rect;
    selectedId = b.id;
  }
  function close() {
    selectedId = null;
  }

  // --- keep URL in sync (shareable views) --------------------------------
  $effect(() => {
    if (!browser) return;
    const u = new URL(window.location.href);
    const set = (/** @type {string} */ k, /** @type {string} */ v) =>
      v ? u.searchParams.set(k, v) : u.searchParams.delete(k);
    set('party', filters.party);
    set('category', filters.category);
    set('stage', filters.stage);
    set('q', filters.q);
    set('view', view === 'simple' ? '' : view);
    set('group', groupBy === 'category' ? 'category' : '');
    set('bill', selectedId ?? '');
    if (u.href !== window.location.href) history.replaceState(history.state, '', u);
  });
</script>

<svelte:head>
  <title>国会ビジュアライザー — 第{meta.session}回国会</title>
</svelte:head>

<FilterBar
  {meta}
  bind:filters
  bind:view
  bind:groupBy
  {visibleParties}
  total={bills.length}
  shown={filtered.length}
/>

{#if view === 'simple'}
  <main class="mx-auto max-w-[1100px] px-4 py-6">
    <!-- 国会 overview stats -->
    <StatsHeader bills={bills} {meta} />

    <!-- Friendly intro -->
    <div class="mb-8 rounded-card border border-line bg-surface p-5 sm:p-6">
      <h1 class="text-xl font-bold text-ink sm:text-2xl">いま国会で動いている法案</h1>
      <p class="mt-2 text-sm leading-relaxed text-ink-soft">
        国会では、新しいルール（法律）の案が日々話し合われています。このページでは、
        その法案がいまどこまで進んでいるかを、やさしい言葉でまとめています。カードを押すと、
        わかりやすい要約・くわしい内容・賛成反対の結果が見られます。
      </p>
      <p class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
        <span class="font-medium text-ink-soft">法案の流れ:</span>
        <span class="rounded-pill bg-canvas-deep px-2 py-0.5">① 提出される</span>
        <span>→</span>
        <span class="rounded-pill bg-accent-soft px-2 py-0.5 text-accent-deep">② 国会で議論・投票</span>
        <span>→</span>
        <span class="rounded-pill bg-success-soft px-2 py-0.5 text-success-ink">③ 成立して法律に</span>
      </p>
    </div>

    <Feed bills={filtered} {meta} {groupBy} onselect={select} />
  </main>
{:else if view === 'recent'}
  <main class="mx-auto max-w-[1100px] px-4 py-6">
    <ActivityFeed {bills} {meta} onselect={select} />
  </main>
{:else}
  <main class="mx-auto max-w-[1600px] px-4 py-4">
    <div class="flex gap-3 overflow-x-auto pb-4" style="height: calc(100vh - 120px)">
      {#each COLUMNS as col (col.id)}
        <Column
          label={col.label}
          sub={col.sub}
          stage={col.id}
          bills={colBills(col.id)}
          onselect={select}
        />
      {/each}
    </div>
  </main>
{/if}

<BillDetail bill={selected} origin={originRect} onclose={close} />
