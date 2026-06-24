<script>
  import SimpleCard from './SimpleCard.svelte';

  /** @typedef {import('$lib/types.js').Bill} Bill */

  /**
   * Flat, sorted list of bills for the 一覧 view. Ordering is decided upstream (FilterPopup →
   * sortBills); this just renders the grid.
   *
   * @type {{
   *   bills: Bill[],
   *   onselect: (b: Bill, rect: DOMRect) => void
   * }}
   */
  let { bills, onselect } = $props();
</script>

<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
  {#each bills as bill (bill.id)}
    <SimpleCard {bill} {onselect} />
  {/each}
</div>

{#if bills.length === 0}
  <p class="py-16 text-center text-ink-faint">条件に合う法案が見つかりませんでした。</p>
{/if}
