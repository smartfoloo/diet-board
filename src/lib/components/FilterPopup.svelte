<script>
  import { SORT_OPTIONS } from '$lib/sort';

  /** @typedef {import('$lib/types.js').Meta} Meta */
  /** @typedef {import('$lib/sort.js').SortKey} SortKey */
  /** @typedef {{ value: string, label: string, color?: string }} Option */
  /**
   * @typedef {object} Filters
   * @property {string} party
   * @property {string} category
   * @property {string} stage
   * @property {string} q
   */

  /**
   * Anchored popup holding every sort + filter control for the 一覧 view. Two sections —
   * 並び替え (single sort order) and 絞り込み (テーマ / 政党) — sharing one chip language so
   * the panel reads as a single, consistent surface. Search lives outside, on the page.
   *
   * @type {{
   *   meta: Meta,
   *   filters: Filters,
   *   sort: SortKey,
   *   visibleParties: string[]
   * }}
   */
  let { meta, filters = $bindable(), sort = $bindable(), visibleParties } = $props();

  /** @type {Option[]} */
  const categoryOptions = $derived(meta.categories.map((c) => ({ value: c, label: c })));
  /** @type {Option[]} */
  const partyOptions = $derived(
    meta.parties
      .filter((p) => visibleParties.includes(p.key) && p.key !== 'cabinet')
      .map((p) => ({ value: p.key, label: p.label, color: p.color }))
  );

  const dirty = $derived(!!(filters.party || filters.category));

  let open = $state(false);
  /** @type {HTMLDivElement} */
  let root;

  /** @param {string} v */
  const chooseSort = (v) => (sort = /** @type {SortKey} */ (v));
  /** @param {string} v */
  const chooseCategory = (v) => (filters.category = filters.category === v ? '' : v);
  /** @param {string} v */
  const chooseParty = (v) => (filters.party = filters.party === v ? '' : v);

  function clearFilters() {
    filters.party = '';
    filters.category = '';
  }

  /** @param {boolean} active */
  const chipCls = (active) =>
    `inline-flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium transition-colors ${
      active
        ? 'bg-accent text-on-accent'
        : 'bg-surface-2 text-ink-soft hover:bg-line/50 hover:text-ink'
    }`;

  /** @param {MouseEvent} e */
  function onWindowClick(e) {
    if (open && root && !root.contains(/** @type {Node} */ (e.target))) open = false;
  }
  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key === 'Escape') open = false;
  }
</script>

<svelte:window on:click={onWindowClick} on:keydown={onKey} />

{#snippet chips(
  /** @type {Option[]} */ options,
  /** @type {string} */ selected,
  /** @type {(v: string) => void} */ choose,
  /** @type {string | undefined} */ allLabel
)}
  <div class="flex flex-wrap gap-1.5">
    {#if allLabel}
      <button
        type="button"
        aria-pressed={selected === ''}
        onclick={() => choose('')}
        class={chipCls(selected === '')}
      >
        {allLabel}
      </button>
    {/if}
    {#each options as o (o.value)}
      <button
        type="button"
        aria-pressed={selected === o.value}
        onclick={() => choose(o.value)}
        class={chipCls(selected === o.value)}
      >
        {#if o.color}
          <span class="h-2 w-2 shrink-0 rounded-full" style="background:{o.color}"></span>
        {/if}
        {o.label}
      </button>
    {/each}
  </div>
{/snippet}

<div class="relative" bind:this={root}>
  <button
    type="button"
    aria-haspopup="dialog"
    aria-expanded={open}
    aria-label="絞り込みと並び替え"
    onclick={() => (open = !open)}
    class="pill relative {open ? 'border-accent/40' : ''} {dirty ? 'pill-active' : ''}"
  >
    <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <path d="M3 8.5h10M19 8.5h2" />
        <path d="M3 15.5h2M11 15.5h10" />
        <circle cx="16" cy="8.5" r="2.5" />
        <circle cx="8" cy="15.5" r="2.5" />
      </g>
    </svg>
    <span class="hidden sm:inline">絞り込み</span>
    {#if dirty}
      <span
        class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-canvas"
      ></span>
    {/if}
  </button>

  {#if open}
    <div
      role="dialog"
      aria-label="絞り込みと並び替え"
      class="absolute right-0 z-40 mt-1.5 w-[min(20rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-4 shadow-card-hover"
    >
      <!-- 並び替え -->
      <section>
        <h3 class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          並び替え
        </h3>
        {@render chips(SORT_OPTIONS, sort, chooseSort, undefined)}
      </section>

      <div class="my-3.5 border-t border-line"></div>

      <!-- 絞り込み -->
      <section class="space-y-3">
        <h3 class="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">絞り込み</h3>
        <div>
          <p class="mb-1.5 text-xs font-medium text-ink-soft">テーマ</p>
          {@render chips(categoryOptions, filters.category, chooseCategory, 'すべて')}
        </div>
        <div>
          <p class="mb-1.5 text-xs font-medium text-ink-soft">政党</p>
          {@render chips(partyOptions, filters.party, chooseParty, 'すべて')}
        </div>
      </section>

      {#if dirty}
        <div class="mt-3.5 border-t border-line pt-3">
          <button
            type="button"
            onclick={clearFilters}
            class="inline-flex items-center gap-1 rounded-control text-xs font-medium text-ink-soft transition-colors hover:text-accent-deep"
          >
            絞り込みをクリア ✕
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
