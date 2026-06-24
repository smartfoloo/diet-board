<script>
  import { COLUMNS } from '$lib/types';
  import Dropdown from './Dropdown.svelte';
  import SearchBox from './SearchBox.svelte';

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
   * Filter bar for the ボード view: search + dropdown filters (テーマ / 政党 / 段階). The 一覧
   * view uses FilterPopup instead.
   *
   * @type {{
   *   meta: Meta,
   *   filters: Filters,
   *   visibleParties: string[]
   * }}
   */
  let { meta, filters = $bindable(), visibleParties } = $props();

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

<div class="mb-8 flex flex-wrap items-center gap-2">
  <SearchBox bind:value={filters.q} class="w-44" />

  <Dropdown
    bind:value={filters.category}
    options={categoryOptions}
    placeholder="すべてのテーマ"
    label="テーマ"
  />
  <Dropdown
    bind:value={filters.party}
    options={partyOptions}
    placeholder="すべての政党"
    label="政党"
  />
  <Dropdown
    bind:value={filters.stage}
    options={stageOptions}
    placeholder="すべての段階"
    label="段階"
  />

  {#if dirty}
    <button
      type="button"
      onclick={clear}
      class="pill ml-auto hover:border-accent/30 hover:text-accent-deep"
    >
      クリア ✕
    </button>
  {/if}
</div>
