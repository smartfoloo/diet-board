<script>
  /** @typedef {{ value: string, label: string }} Tab */

  /**
   * Segmented control with a solid dark "pill" that slides to the active tab.
   * Default height matches the global `.pill` (34px) so it lines up with the
   * search box / dropdowns it sits next to.
   *
   * @type {{
   *   value: string,
   *   options: Tab[],
   *   ariaLabel?: string,
   *   class?: string
   * }}
   */
  let { value = $bindable(), options, ariaLabel, class: klass = '' } = $props();

  const n = $derived(options.length);
  const activeIndex = $derived(Math.max(0, options.findIndex((o) => o.value === value)));
</script>

<div
  role="tablist"
  aria-label={ariaLabel}
  class="relative inline-grid auto-cols-fr grid-flow-col items-stretch rounded-pill border border-line bg-surface-2 p-0.5 text-sm {klass}"
>
  <!-- Sliding active indicator -->
  <span
    aria-hidden="true"
    class="pointer-events-none absolute bottom-0.5 left-0.5 top-0.5 rounded-pill bg-ink shadow-card transition-transform duration-200 ease-out"
    style="width: calc((100% - 0.25rem) / {n}); transform: translateX({activeIndex * 100}%);"
  ></span>

  {#each options as o (o.value)}
    <button
      type="button"
      role="tab"
      aria-selected={value === o.value}
      onclick={() => (value = o.value)}
      class="relative z-10 whitespace-nowrap rounded-pill px-3 py-1 text-center leading-5 transition-colors {value ===
      o.value
        ? 'font-medium text-canvas'
        : 'text-ink-soft hover:text-ink'}"
    >
      {o.label}
    </button>
  {/each}
</div>
