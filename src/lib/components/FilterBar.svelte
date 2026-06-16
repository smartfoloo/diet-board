<script lang="ts">
  import type { Meta } from '$lib/types';
  import { COLUMNS } from '$lib/types';
  import Dropdown, { type Option } from './Dropdown.svelte';

  export interface Filters {
    party: string;
    category: string;
    stage: string; // '' or a Stage id
    q: string;
  }

  let {
    meta,
    filters = $bindable(),
    visibleParties,
    total,
    shown
  }: {
    meta: Meta;
    filters: Filters;
    visibleParties: string[];
    total: number;
    shown: number;
  } = $props();

  const partyOptions = $derived<Option[]>(
    meta.parties
      .filter((p) => visibleParties.includes(p.key) && p.key !== 'cabinet')
      .map((p) => ({ value: p.key, label: p.label, color: p.color }))
  );
  const categoryOptions = $derived<Option[]>(meta.categories.map((c) => ({ value: c, label: c })));
  const stageOptions = $derived<Option[]>(COLUMNS.map((c) => ({ value: c.id, label: c.label })));

  function clear() {
    filters.party = '';
    filters.category = '';
    filters.stage = '';
    filters.q = '';
  }

  const dirty = $derived(!!(filters.party || filters.category || filters.stage || filters.q));
</script>

<div
  class="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/70"
>
  <div class="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-4 py-2.5">
    <div class="mr-1 flex items-baseline gap-2">
      <span class="text-sm font-bold tracking-tight text-ink">国会ビジュアライザー</span>
      <span class="rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-deep">
        第{meta.session}回国会
      </span>
    </div>

    <div class="relative">
      <input
        type="search"
        bind:value={filters.q}
        placeholder="法案名で検索…"
        class="pill w-44 bg-surface focus:border-accent/40 focus:outline-none"
      />
    </div>

    <Dropdown bind:value={filters.party} options={partyOptions} placeholder="すべての会派" label="会派" />
    <Dropdown bind:value={filters.category} options={categoryOptions} placeholder="すべての分野" label="分野" />
    <Dropdown bind:value={filters.stage} options={stageOptions} placeholder="すべての段階" label="段階" />

    {#if dirty}
      <button type="button" onclick={clear} class="pill hover:border-accent/30 hover:text-accent-deep">
        クリア ✕
      </button>
    {/if}

    <span class="ml-auto text-xs text-ink-faint tabular-nums">
      {shown} / {total} 件
    </span>
  </div>
</div>
