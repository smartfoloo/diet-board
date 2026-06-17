<script>
  import { COLUMNS } from '$lib/types';
  import Dropdown from './Dropdown.svelte';

  /** @typedef {import('$lib/types.js').Meta} Meta */
  /** @typedef {{ value: string, label: string, color?: string }} Option */
  /**
   * @typedef {object} Filters
   * @property {string} party
   * @property {string} category
   * @property {string} stage '' or a Stage id
   * @property {string} q
   */

  /**
   * @type {{
   *   meta: Meta,
   *   filters: Filters,
   *   view: 'simple' | 'board' | 'recent',
   *   groupBy: 'status' | 'category',
   *   visibleParties: string[],
   *   total: number,
   *   shown: number
   * }}
   */
  let {
    meta,
    filters = $bindable(),
    view = $bindable(),
    groupBy = $bindable(),
    visibleParties,
    total,
    shown
  } = $props();

  /** @type {Option[]} */
  const partyOptions = $derived(
    meta.parties
      .filter((p) => visibleParties.includes(p.key) && p.key !== 'cabinet')
      .map((p) => ({ value: p.key, label: p.label, color: p.color }))
  );
  /** @type {Option[]} */
  const categoryOptions = $derived(meta.categories.map((c) => ({ value: c, label: c })));
  /** @type {Option[]} */
  const stageOptions = $derived(COLUMNS.map((c) => ({ value: c.id, label: c.label })));

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

    <!-- View toggle -->
    <div class="flex rounded-pill border border-line bg-surface p-0.5 text-sm">
      <button
        type="button"
        onclick={() => (view = 'simple')}
        class="rounded-pill px-3 py-1 transition-colors {view === 'simple'
          ? 'bg-accent text-white'
          : 'text-ink-soft hover:text-ink'}"
      >
        まとめ
      </button>
      <button
        type="button"
        onclick={() => (view = 'board')}
        class="rounded-pill px-3 py-1 transition-colors {view === 'board'
          ? 'bg-accent text-white'
          : 'text-ink-soft hover:text-ink'}"
      >
        ボード
      </button>
      <button
        type="button"
        onclick={() => (view = 'recent')}
        class="rounded-pill px-3 py-1 transition-colors {view === 'recent'
          ? 'bg-accent text-white'
          : 'text-ink-soft hover:text-ink'}"
      >
        動き
      </button>
    </div>

    <div class="relative">
      <input
        type="search"
        bind:value={filters.q}
        placeholder="法案名で検索…"
        class="pill w-40 bg-surface focus:border-accent/40 focus:outline-none"
      />
    </div>

    <Dropdown bind:value={filters.category} options={categoryOptions} placeholder="すべてのテーマ" label="テーマ" />
    <Dropdown bind:value={filters.party} options={partyOptions} placeholder="すべての政党" label="政党" />
    {#if view === 'board'}
      <Dropdown bind:value={filters.stage} options={stageOptions} placeholder="すべての段階" label="段階" />
    {/if}

    {#if view === 'simple'}
      <div class="flex items-center gap-1 text-xs text-ink-faint">
        <span class="hidden sm:inline">まとめ方</span>
        <div class="flex rounded-pill border border-line bg-surface p-0.5">
          <button
            type="button"
            onclick={() => (groupBy = 'status')}
            class="rounded-pill px-2.5 py-1 transition-colors {groupBy === 'status'
              ? 'bg-accent text-white'
              : 'text-ink-soft hover:text-ink'}"
          >
            状況
          </button>
          <button
            type="button"
            onclick={() => (groupBy = 'category')}
            class="rounded-pill px-2.5 py-1 transition-colors {groupBy === 'category'
              ? 'bg-accent text-white'
              : 'text-ink-soft hover:text-ink'}"
          >
            テーマ
          </button>
        </div>
      </div>
    {/if}

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
