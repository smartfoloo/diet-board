<script>
  // Tappable theme chips — a more discoverable, casual-friendly replacement for the テーマ
  // dropdown. Single-select: tapping the active chip (or すべて) clears the filter.

  /**
   * @type {{
   *   value: string,
   *   categories: string[]
   * }}
   */
  let { value = $bindable(), categories } = $props();

  /** @param {string} c */
  function pick(c) {
    value = value === c ? '' : c;
  }
</script>

<div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="テーマで絞り込み">
  <button
    type="button"
    onclick={() => (value = '')}
    aria-pressed={!value}
    class="tag transition-colors {!value
      ? 'bg-ink text-canvas'
      : 'bg-surface-2 text-ink-soft hover:text-ink'}"
  >
    すべて
  </button>
  {#each categories as c (c)}
    <button
      type="button"
      onclick={() => pick(c)}
      aria-pressed={value === c}
      class="tag transition-colors {value === c
        ? 'bg-ink text-canvas'
        : 'bg-surface-2 text-ink-soft hover:text-ink'}"
    >
      {c}
    </button>
  {/each}
</div>
