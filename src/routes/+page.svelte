<script lang="ts">
  import { browser } from '$app/environment';
  import type { Bill, Stage } from '$lib/types';
  import { COLUMNS } from '$lib/types';
  import FilterBar, { type Filters } from '$lib/components/FilterBar.svelte';
  import Column from '$lib/components/Column.svelte';
  import BillDetail from '$lib/components/BillDetail.svelte';

  let { data } = $props();
  const bills = $derived(data.bills);
  const meta = $derived(data.meta);

  // --- filters initialised from URL (browser only; SSR prerenders empty) --
  const sp = browser ? new URL(window.location.href).searchParams : new URLSearchParams();
  let filters = $state<Filters>({
    party: sp.get('party') ?? '',
    category: sp.get('category') ?? '',
    stage: sp.get('stage') ?? '',
    q: sp.get('q') ?? ''
  });

  let selectedId = $state<string | null>(sp.get('bill'));
  const selected = $derived(bills.find((b) => b.id === selectedId) ?? null);

  // Parties that actually appear, for the filter dropdown.
  const visibleParties = $derived([
    ...new Set(bills.map((b) => b.submitterParty).filter(Boolean) as string[])
  ]);

  // --- filtered set ------------------------------------------------------
  const filtered = $derived(
    bills.filter((b) => {
      if (filters.party && b.submitterParty !== filters.party) return false;
      if (filters.category && b.category !== filters.category) return false;
      if (filters.stage) {
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

  function colBills(stage: Stage): Bill[] {
    if (stage === '成立') return filtered.filter((b) => b.stage === '成立' || b.stage === '廃案');
    return filtered.filter((b) => b.stage === stage);
  }

  function select(b: Bill) {
    selectedId = b.id;
  }
  function close() {
    selectedId = null;
  }

  // --- keep URL in sync (shareable views) --------------------------------
  $effect(() => {
    if (!browser) return;
    const u = new URL(window.location.href);
    const set = (k: string, v: string) => (v ? u.searchParams.set(k, v) : u.searchParams.delete(k));
    set('party', filters.party);
    set('category', filters.category);
    set('stage', filters.stage);
    set('q', filters.q);
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
  {visibleParties}
  total={bills.length}
  shown={filtered.length}
/>

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

<BillDetail bill={selected} onclose={close} />
